/*
Package fanout is the LIVE plane: Redis pub/sub carries a chat message to every
gateway node the instant it arrives, so a viewer on node B sees what was typed on
node A. It is emphatically NOT the record — pub/sub is at-most-once, has no
retention and no replay, so a node that is down when a message is published never
learns it existed. That is fine, and deliberate: the durable copy went to
`chat.messages.v1` on the way in (ADR-0018), and a viewer who was not connected
did not need the live frame. Kafka is the truth; Redis is the courier.
*/
package fanout

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"

	"github.com/redis/go-redis/v9"
)

const prefix = "chat:fanout:"

/*
Envelope is the INTERNAL fan-out format, and it is intentionally richer than the
external client wire (which stays a raw body string — ADR-0018). SenderID is the
origin node's per-connection id: it exists so the subscriber can skip the socket
that sent the message, since fan-out is now driven by pub/sub and no longer knows
who the sender was. Only the origin node holds a socket with that id — every other
node simply finds no match and fans out to all of its viewers.
*/
type Envelope struct {
	SenderID string `json:"senderId"`
	Body     string `json:"body"`
}

type Fanout struct {
	rdb       *redis.Client
	sub       *redis.PubSub
	log       *slog.Logger
	onMessage func(channelID string, env Envelope)
}

func New(redisUrl string, log *slog.Logger) (*Fanout, error) {
	opts, err := redis.ParseURL(redisUrl)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}

	/*
	 * One subscriber connection for the whole node, opened with zero channels and
	 * grown lazily as viewers arrive. The alternative — a connection per Pulse
	 * channel — buys nothing and costs a socket per live stream.
	 */
	return &Fanout{
		rdb: redis.NewClient(opts),
		sub: redis.NewClient(opts).Subscribe(context.Background()),
		log: log,
	}, nil
}

/*
The Redis channel name for a Pulse channel. Keyed by channelId — the canonical
id everything in Pulse co-partitions on — never by slug
*/
func topic(channelID string) string {
	return prefix + channelID
}

func (f *Fanout) Publish(ctx context.Context, channelID string, env Envelope) error {
	payload, err := json.Marshal(env)
	if err != nil {
		return fmt.Errorf("marshal envelop: %w", err)
	}

	return f.rdb.Publish(ctx, topic(channelID), payload).Err()
}

/*
Subscribe/Unsubscribe are driven by the local connection registry: a node only
needs a channel's fan-out while it actually has viewers on it. The registry is the
reference count — first local socket subscribes, last one leaves unsubscribes.
*/
func (f *Fanout) Subscribe(ctx context.Context, channelID string) error {
	return f.sub.Subscribe(ctx, topic(channelID))
}

func (f *Fanout) Unsubscribe(ctx context.Context, channelID string) error {
	return f.sub.Unsubscribe(ctx, topic(channelID))
}

func (f *Fanout) OnMessage(fn func(channelID string, env Envelope)) {
	f.onMessage = fn
}

// Run drains the subscription until Close. One goroutine, all channels.
func (f *Fanout) Run() {
	for msg := range f.sub.Channel() {
		var env Envelope

		if err := json.Unmarshal([]byte(msg.Payload), &env); err != nil {
			f.log.Error("bad fanout envelope", "err", err, "topic", msg.Channel)
			continue
		}

		if f.onMessage != nil {
			f.onMessage(strings.TrimPrefix(msg.Channel, prefix), env)
		}
	}
}

func (f *Fanout) Close() {
	_ = f.sub.Close()
	_ = f.rdb.Close()
}
