package consumer

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
	"github.com/hamba/avro/v2"
)

type StreamStarted struct {
	StreamID    string `avro:"streamId"`
	ChannelID   string `avro:"channelId"`
	ChannelSlug string `avro:"channelSlug"`
}

type StreamEnded struct {
	StreamID    string `avro:"streamId"`
	ChannelID   string `avro:"channelId"`
	ChannelSlug string `avro:"channelSlug"`
}

type schemaResponse struct {
	Schema string `json:"schema"`
}

type Consumer struct {
	c            *kafka.Consumer
	log          *slog.Logger
	registryURL  string
	schemas      map[int]avro.Schema
	mu           sync.RWMutex
	liveChannels map[string]string
	slugToID     map[string]string
	onEnded      func(slug string)
}

func New(brokers, groupID, registryURL string, log *slog.Logger) (*Consumer, error) {
	c, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers":  brokers,
		"group.id":           groupID,    // step 1's fresh-per-boot id
		"auto.offset.reset":  "earliest", // where to start when no offset exists
		"enable.auto.commit": false,      // never remember our position
	})

	if err != nil {
		return nil, fmt.Errorf("create consumer: %w", err)
	}

	if err := c.SubscribeTopics([]string{"stream.started.v1", "stream.ended.v1"}, nil); err != nil {
		return nil, fmt.Errorf("subscribe: %w", err)
	}

	return &Consumer{
		c:            c,
		log:          log,
		registryURL:  registryURL,
		schemas:      make(map[int]avro.Schema),
		liveChannels: make(map[string]string),
		slugToID:     make(map[string]string),
	}, nil
}

func unwire(data []byte) (schemaID int, body []byte, err error) {
	if len(data) < 5 || data[0] != 0x0 {
		return 0, nil, fmt.Errorf("not a confluent wire message")
	}

	schemaID = int(binary.BigEndian.Uint32(data[1:5]))
	body = data[5:]

	return schemaID, body, nil
}

func (c *Consumer) schemaFor(id int) (avro.Schema, error) {
	if s, ok := c.schemas[id]; ok {
		return s, nil
	}

	url := fmt.Sprintf("%s/apis/ccompat/v7/schemas/ids/%d", c.registryURL, id)
	resp, err := http.Get(url)

	if err != nil {
		return nil, fmt.Errorf("fetch schema: %w", err)
	}

	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("registry returned %s for %d", resp.Status, id)
	}

	var sr schemaResponse
	if err := json.NewDecoder(resp.Body).Decode(&sr); err != nil {
		return nil, fmt.Errorf("decode schema response: %w", err)
	}

	schema, err := avro.Parse(sr.Schema)
	if err != nil {
		return nil, fmt.Errorf("parse avro schema: %w", err)
	}

	c.schemas[id] = schema

	return schema, nil
}

func (c *Consumer) decode(msg *kafka.Message) error {
	schemaID, body, err := unwire(msg.Value)
	if err != nil {
		return err
	}

	schema, err := c.schemaFor(schemaID)
	if err != nil {
		return err
	}

	switch *msg.TopicPartition.Topic {
	case "stream.started.v1":
		var ev StreamStarted
		if err := avro.Unmarshal(schema, body, &ev); err != nil {
			return fmt.Errorf("unmarshal StreamStarted: %w", err)
		}
		c.applyStarted(ev)
	case "stream.ended.v1":
		var ev StreamEnded
		if err := avro.Unmarshal(schema, body, &ev); err != nil {
			return fmt.Errorf("unmarshal StreamEnded: %w", err)
		}
		c.applyEnded(ev)
	}

	return nil
}

func (c *Consumer) applyStarted(ev StreamStarted) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.liveChannels[ev.ChannelID] = ev.StreamID
	c.slugToID[ev.ChannelSlug] = ev.ChannelID
	c.log.Info("stream started", "slug", ev.ChannelSlug, "channelId", ev.ChannelID, "streamId", ev.StreamID)
}

func (c *Consumer) applyEnded(ev StreamEnded) {
	c.mu.Lock()
	delete(c.liveChannels, ev.ChannelID)
	delete(c.slugToID, ev.ChannelSlug)
	defer c.mu.Unlock()

	c.log.Info("stream ended", "slug", ev.ChannelSlug, "channelId", ev.ChannelID, "streamId", ev.StreamID)

	if c.onEnded != nil {
		c.onEnded(ev.ChannelID)
	}
}

func (c *Consumer) Resolve(slug string) (channelID, streamID string, ok bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	channelID, ok = c.slugToID[slug]
	if !ok {
		return "", "", false
	}

	streamID, ok = c.liveChannels[channelID]

	return channelID, streamID, ok
}

func (c *Consumer) Run() {
	c.log.Info("consumer running, replaying from earliest")

	for {
		msg, err := c.c.ReadMessage(-1)

		if err != nil {
			c.log.Error("consumer read failed", "err", err)
			continue
		}

		if err := c.decode(msg); err != nil {
			c.log.Error("decode failed", "err", err, "topic", *msg.TopicPartition.Topic)
		}
	}
}

func (c *Consumer) Close() {
	_ = c.c.Close()
}

func (c *Consumer) OnEnded(fn func(channelID string)) {
	c.onEnded = fn
}
