package producer

import (
	"fmt"
	"log/slog"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

type Producer struct {
	p   *kafka.Producer
	log *slog.Logger
}

func New(brokers string, log *slog.Logger) (*Producer, error) {
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

	prod := &Producer{p: p, log: log}
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
