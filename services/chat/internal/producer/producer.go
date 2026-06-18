package producer

import (
  "encoding/json"
  "fmt"
  "log/slog"
  "net/http"

  "github.com/confluentinc/confluent-kafka-go/v2/kafka"
  "github.com/hamba/avro/v2"
)

type Producer struct {
  p        *kafka.Producer
  log      *slog.Logger
  schema   avro.Schema
  schemaID int
  topic    string
}

type registryResponse struct {
  ID     int    `json:"id"`
  Schema string `json:"schema"`
}

func New(brokers string, registryURL string, log *slog.Logger) (*Producer, error) {
  const topic = "chat.messages.v1"

  schema, schemaID, err := fetchSchema(registryURL, topic+"-value")
  if err != nil {
    return nil, fmt.Errorf("schema init: %w", err)
  }

  p, err := kafka.NewProducer(&kafka.ConfigMap{
    "bootstrap.servers":  brokers,
    "client.id":          "chat",
    "acks":               "all",
    "enable.idempotence": true,
    "compression.type":   "zstd",
    "partitioner":        "murmur2_random",
  })

  if err != nil {
    return nil, fmt.Errorf("create producer: %w", err)
  }

  prod := &Producer{p: p, log: log, schema: schema, schemaID: schemaID, topic: topic}
  go prod.deliveryReports()

  return prod, nil
}

func (p *Producer) deliveryReports() {
  for e := range p.p.Events() {
    switch ev := e.(type) {
    case *kafka.Message:
      if ev.TopicPartition.Error != nil {
        p.log.Error("kafka delivery failed",
          "err", ev.TopicPartition.Error,
          "key", string(ev.Key))
      }
    case kafka.Error:
      p.log.Error("kafka client error", "err", ev)
    }
  }
}

func fetchSchema(registryURL, subject string) (avro.Schema, int, error) {
  url := fmt.Sprintf("%s/apis/ccompat/v7/subjects/%s/versions/latest", registryURL, subject)

  resp, err := http.Get(url)
  if err != nil {
    return nil, 0, fmt.Errorf("fetch schema: %w", err)
  }

  defer func() {
    _ = resp.Body.Close()
  }()

  if resp.StatusCode != http.StatusOK {
    return nil, 0, fmt.Errorf("registry returned %s for %s", resp.Status, subject)
  }

  var rr registryResponse
  if err := json.NewDecoder(resp.Body).Decode(&rr); err != nil {
    return nil, 0, fmt.Errorf("decode schema response: %w", err)
  }

  schema, err := avro.Parse(rr.Schema)
  if err != nil {
    return nil, 0, fmt.Errorf("parse avro schema: %w", err)
  }

  return schema, rr.ID, nil
}
