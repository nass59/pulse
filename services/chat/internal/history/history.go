/*
Package history is a PROJECTION off the log, not a thing on the request path.
It consumes chat.messages.v1 and maintains a per-channel, capped "last N" list in
Redis (chat:history:{channelId}). Because it is built by replaying the log rather
than written inline when a message arrives, it (a) survives any gateway restart,
(b) stays exactly consistent with the durable record, and (c) is rebuildable by
replaying the topic from the start. That is what "derived storage off Kafka" means.

Contrast it deliberately with internal/consumer (the liveness view): that one uses
a fresh-per-boot group id and never commits offsets, so every node replays the
whole topic on boot (a broadcast). This one uses a STABLE, shared group id and
commits offsets, so the N gateway nodes form a single consumer group, Kafka splits
the partitions between them, and each message is projected exactly once across the
fleet (work-sharing) — resuming where it left off instead of rebuilding.
*/
package history

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
	"github.com/redis/go-redis/v9"
)

/*
historyN is the ring-buffer window: the last 50 messages per channel. LTRIM keeps
the list at this size, discarding the oldest automatically.
*/
const historyN = 50

const keyPrefix = "chat:history:"

/*
chatMessageSent mirrors the fields of the chat.messages.v1 record we care about.
We keep the full server-authored record (not just body), because those fields are
already in the Kafka message and cost nothing to store — and it saves a full
re-projection when Phase 3 puts real authors on the wire.
*/
type chatMessageSent struct {
	MessageID string    `avro:"messageId"`
	ChannelID string    `avro:"channelId"`
	UserID    string    `avro:"userId"`
	Body      string    `avro:"body"`
	SentAt    time.Time `avro:"sentAt"`
}

/*
historyItem is what we actually store in Redis: the record as JSON, newest-first.
Backfill (issue 04) reverses the list to replay it oldest-first.
*/
type historyItem struct {
	MessageID string    `json:"messageId"`
	UserID    string    `json:"userId"`
	Body      string    `json:"body"`
	SentAt    time.Time `json:"sentAt"`
}

type schemaResponse struct {
	Schema string `json:"schema"`
}

type Projection struct {
	c           *kafka.Consumer
	rdb         *redis.Client
	log         *slog.Logger
	registryURL string
	/*
	 * schemas is a writer-schema cache keyed by the id embedded in each message.
	 * Only the Run goroutine ever touches it, so no mutex is needed.
	 */
	schemas map[int]avro.Schema
}

func New(brokers, registryURL, redisURL string, log *slog.Logger) (*Projection, error) {
	c, err := kafka.NewConsumer(&kafka.ConfigMap{
		"bootstrap.servers": brokers,
		/*
		 * A STABLE, shared group id — the opposite of the liveness consumer's
		 * fresh-per-boot id. Every gateway that runs this joins the same group, so
		 * Kafka balances chat.messages.v1's partitions across the fleet and the
		 * projection is written once, not once per node.
		 */
		"group.id":          "chat-history",
		"auto.offset.reset": "earliest", // first run ever builds from the start of the log
		/*
		 * ponytail: auto-commit -> at-most-once for the ring buffer (a crash between
		 * commit and LPUSH loses that message from history, though never from Kafka).
		 * Fine here: history is best-effort and replayable. If exactly-once history
		 * ever matters, switch to manual commit after a successful LPUSH.
		 */
		"enable.auto.commit": true,
	})

	if err != nil {
		return nil, fmt.Errorf("create consumer: %w", err)
	}

	if err := c.SubscribeTopics([]string{"chat.messages.v1"}, nil); err != nil {
		return nil, fmt.Errorf("subscribe: %w", err)
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}

	return &Projection{
		c:           c,
		rdb:         redis.NewClient(opts),
		log:         log,
		registryURL: registryURL,
		schemas:     make(map[int]avro.Schema),
	}, nil
}

/*
unwire strips Confluent's 5-byte wire header: a magic 0x0, then a big-endian
schema id, then the avro body. (Same framing the liveness consumer decodes.)
*/
func unwire(data []byte) (schemaID int, body []byte, err error) {
	if len(data) < 5 || data[0] != 0x0 {
		return 0, nil, fmt.Errorf("not a confluent wire message")
	}

	return int(binary.BigEndian.Uint32(data[1:5])), data[5:], nil
}

func (p *Projection) schemaFor(id int) (avro.Schema, error) {
	if s, ok := p.schemas[id]; ok {
		return s, nil
	}

	url := fmt.Sprintf("%s/apis/ccompat/v7/schemas/ids/%d", p.registryURL, id)
	resp, err := http.Get(url)

	if err != nil {
		return nil, fmt.Errorf("fetch schema: %w", err)
	}

	defer func() { _ = resp.Body.Close() }()

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

	p.schemas[id] = schema

	return schema, nil
}

// project decodes one message and pushes it onto that channel's ring buffer.
func (p *Projection) project(ctx context.Context, msg *kafka.Message) error {
	schemaID, body, err := unwire(msg.Value)
	if err != nil {
		return err
	}

	schema, err := p.schemaFor(schemaID)
	if err != nil {
		return err
	}

	var m chatMessageSent
	if err := avro.Unmarshal(schema, body, &m); err != nil {
		return fmt.Errorf("unmarshal ChatMessageSent: %w", err)
	}

	payload, err := json.Marshal(historyItem{
		MessageID: m.MessageID,
		UserID:    m.UserID,
		SentAt:    m.SentAt,
		Body:      m.Body,
	})

	if err != nil {
		return fmt.Errorf("marshal history item: %w", err)
	}

	/*
	 * LPUSH the newest to the head, then LTRIM to the last N. One pipeline = one
	 * round trip. Ordering within the key is safe regardless: co-partitioning by
	 * channelId means a single consumer instance owns each channel's messages, so
	 * these two ops never race another writer on the same key.
	 */
	key := keyPrefix + m.ChannelID
	pipe := p.rdb.Pipeline()
	pipe.LPush(ctx, key, payload)
	pipe.LTrim(ctx, key, 0, historyN-1)

	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("redis lpush/ltrim %s: %w", key, err)
	}

	return nil
}

// Run drains the topic until Close. One goroutine.
func (p *Projection) Run() {
	ctx := context.Background()
	p.log.Info("history projection running", "group", "chat-history")

	for {
		msg, err := p.c.ReadMessage(-1)

		if err != nil {
			p.log.Error("history read failed", "err", err)
			continue
		}

		if err := p.project(ctx, msg); err != nil {
			p.log.Error("project failed", "err", err, "topic", *msg.TopicPartition.Topic)
		}
	}
}

func (p *Projection) Close() {
	_ = p.c.Close()
	_ = p.rdb.Close()
}
