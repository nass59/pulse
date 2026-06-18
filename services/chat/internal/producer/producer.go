package producer

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

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

type ChatMessageSent struct {
	MessageID string    `avro:"messageId"`
	ChannelID string    `avro:"channelId"`
	StreamID  string    `avro:"streamId"`
	UserID    string    `avro:"userId"`
	Body      string    `avro:"body"`
	SentAt    time.Time `avro:"sentAt"`
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

func (p *Producer) Produce(ctx context.Context, channelID string, msg ChatMessageSent) error {
	body, err := avro.Marshal(p.schema, msg)
	if err != nil {
		return fmt.Errorf("marshal avro: %w", err)
	}

	return p.p.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &p.topic, Partition: kafka.PartitionAny},
		Key:            []byte(channelID),
		Value:          wire(p.schemaID, body),
	}, nil)
}

func (p *Producer) Close() {
	p.p.Flush(5000) // wait up to 5s in-flight messages to drain
	p.p.Close()     // closes p.Events() -> the deliveryReports goroutine returns
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

func wire(schemaID int, body []byte) []byte {
	buf := make([]byte, 0, 5+len(body))                        // cap = header + body, no regrowth
	buf = append(buf, 0x0)                                     // byte 0: magic
	buf = binary.BigEndian.AppendUint32(buf, uint32(schemaID)) // bytes 1–4: schema id, big-endian

	return append(buf, body...) // bytes 5…: the avro
}
