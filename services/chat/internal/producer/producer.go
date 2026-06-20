package producer

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/hamba/avro/v2"
)

type registryResponse struct {
	ID     int    `json:"id"`
	Schema string `json:"schema"`
}

type eventTopic struct {
	topic    string
	schema   avro.Schema
	schemaID int
}

type Producer struct {
	p        *kafka.Producer
	log      *slog.Logger
	messages eventTopic
	joined   eventTopic
	left     eventTopic
}

type ChatMessageSent struct {
	MessageID string    `avro:"messageId"`
	ChannelID string    `avro:"channelId"`
	StreamID  string    `avro:"streamId"`
	UserID    string    `avro:"userId"`
	Body      string    `avro:"body"`
	SentAt    time.Time `avro:"sentAt"`
}

type ViewerJoined struct {
	ChannelID string    `avro:"channelId"`
	StreamID  string    `avro:"streamId"`
	UserID    string    `avro:"userId"`
	JoinedAt  time.Time `avro:"joinedAt"`
}

type ViewerLeft struct {
	ChannelID string    `avro:"channelId"`
	StreamID  string    `avro:"streamId"`
	UserID    string    `avro:"userId"`
	LeftAt    time.Time `avro:"leftAt"`
}

func New(brokers string, registryURL string, log *slog.Logger) (*Producer, error) {
	messages, err := newEventTopic(registryURL, "chat.messages.v1")
	if err != nil {
		return nil, fmt.Errorf("schema init: %w", err)
	}

	joined, err := newEventTopic(registryURL, "chat.presence.joined.v1")
	if err != nil {
		return nil, fmt.Errorf("schema init: %w", err)
	}

	left, err := newEventTopic(registryURL, "chat.presence.left.v1")
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

	prod := &Producer{p: p, log: log, messages: messages, joined: joined, left: left}
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

func (p *Producer) emit(et *eventTopic, key string, v any) error {
	body, err := avro.Marshal(et.schema, v)
	if err != nil {
		return fmt.Errorf("marshal avro: %w", err)
	}

	return p.p.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &et.topic, Partition: kafka.PartitionAny},
		Key:            []byte(key),
		Value:          wire(et.schemaID, body),
	}, nil)
}

func (p *Producer) ProduceMessage(key string, m ChatMessageSent) error {
	return p.emit(&p.messages, key, m)
}

func (p *Producer) ProduceViewerJoined(key string, v ViewerJoined) error {
	return p.emit(&p.joined, key, v)
}

func (p *Producer) ProduceViewerLeft(key string, v ViewerLeft) error {
	return p.emit(&p.left, key, v)
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

func newEventTopic(registryURL, topic string) (eventTopic, error) {
	schema, id, err := fetchSchema(registryURL, topic+"-value")
	if err != nil {
		return eventTopic{}, fmt.Errorf("%s: %w", topic, err)
	}

	return eventTopic{topic: topic, schema: schema, schemaID: id}, nil
}
