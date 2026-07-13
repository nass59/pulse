package main

import (
	"context"
	"log/slog"
	"net/http"
	"pulse/chat/internal/consumer"
	"pulse/chat/internal/fanout"
	"pulse/chat/internal/producer"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/google/uuid"
)

// demoUserID stands in for a real authenticated viewer until identity issues
// userIds (Phase 3). It MUST be a valid UUID: the userId field is an Avro `uuid`
// logical type (ViewerJoined/ViewerLeft/ChatMessageSent .avsc), and JVM consumers
// (analytics) enforce that strictly on read -- a non-UUID string like "u_demo" is
// a poison pill that shuts the consumer down. Presence is session-grained, so one
// shared demo identity is correct for the MVP (CONTEXT.md -> Viewer session).
const demoUserID = "00000000-0000-0000-0000-000000000001"

type conn struct {
	id        string // per-connection, minted by this node — the fan-out skip handle
	ws        *websocket.Conn
	send      chan []byte // this viewer's send buffer (drops when full -- ADR-0018)
	channelID string
	streamID  string
}

type server struct {
	mu       sync.RWMutex                  // guards the registry
	channels map[string]map[*conn]struct{} // slug -> set of conns
	log      *slog.Logger
	prod     *producer.Producer
	cons     *consumer.Consumer
	fan      *fanout.Fanout
}

func (s *server) handleWS(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("channelSlug") // from /ws/{channelSlug}

	ws, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		// The browser dev server is a different origin (:3000 → :8081), so the
		// gateway must allow it explicitly. coder/websocket rejects cross-origin
		// upgrades by default — that default is CSWSH (cross-site WebSocket
		// hijacking) protection, so we opt into an allowlist, we don't disable it.
		// getenv keeps it configurable per env, matching the PORT/config idiom.
		OriginPatterns: []string{getenv("WEB_ORIGIN", "localhost:3000")},
	}) // the HTTP 101 upgrade
	if err != nil {
		return
	}

	defer func() {
		_ = ws.CloseNow()
	}()

	channelID, streamID, ok := s.cons.Resolve(slug)
	if !ok {
		_ = ws.Close(websocket.StatusPolicyViolation, "channel not live")
		return
	}

	s.log.Info("ws connect", "channel", slug, "userId", demoUserID)

	connID, _ := uuid.NewV7()
	c := &conn{id: connID.String(), ws: ws, send: make(chan []byte, 16), channelID: channelID, streamID: streamID}

	/*
	 * The registry doubles as the subscription's reference count: this node only
	 * needs a channel's Redis fan-out while it has viewers on it. context.Background()
	 * (not the request ctx) because the unsubscribe fires from a defer, after the
	 * request context is already cancelled.
	 */
	if first := s.register(c); first {
		if err := s.fan.Subscribe(context.Background(), c.channelID); err != nil {
			s.log.Error("fanout subscribe failed", "err", err, "channelID", c.channelID)
		}
	}

	defer func() {
		if last := s.unregister(c); last {
			if err := s.fan.Unsubscribe(context.Background(), c.channelID); err != nil {
				s.log.Error("fanout unsubscribe failed", "err", err, "channelID", c.channelID)
			}
		}
	}()

	s.emitViewerJoined(c)     // +1 turnstile click — gate already passed
	defer s.emitViewerLeft(c) // −1, on ANY return below
	defer s.log.Info("ws disconnect", "channel", slug, "userId", demoUserID)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// WRITE pump -- the only goroutine that writes this socket.
	go func() {
		for {
			select {
			case msg := <-c.send:
				_ = ws.Write(ctx, websocket.MessageText, msg)
			case <-ctx.Done():
				return
			}
		}
	}()

	// READ loop -- this goroutine. Never do slow work in here.
	for {
		_, data, err := ws.Read(ctx)
		if err != nil { // client gone / closed
			return // -> defer unregister fires
		}

		id, _ := uuid.NewV7() // server-minted UUIDv7 (time-ordered)

		msg := producer.ChatMessageSent{
			MessageID: id.String(),
			ChannelID: c.channelID,      // ← the WRISTBAND
			StreamID:  c.streamID,       // ← the WRISTBAND
			UserID:    demoUserID,       // hardcoded MVP
			Body:      string(data),     // the ONLY client input
			SentAt:    time.Now().UTC(), // server receipt time
		}

		if err := s.prod.ProduceMessage(c.channelID, msg); err != nil {
			s.log.Error("produce failed", "err", err)
		}

		/*
		 * Publish, never broadcast locally. This node's own viewers get the message
		 * back through its Redis subscription like everyone else's — one fan-out
		 * path, no origin-node special case, no loopback suppression.
		 */
		env := fanout.Envelope{SenderID: c.id, Body: string(data)}
		if err := s.fan.Publish(ctx, c.channelID, env); err != nil {
			s.log.Error("fanout publish failed", "err", err)
		}
	}
}

// broadcast is now the ONLY fan-out path, driven by the Redis subscription.
func (s *server) broadcast(channelID string, env fanout.Envelope) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for c := range s.channels[channelID] {
		/*
		 * Only the origin node holds the sender's socket; other nodes find no match
		 * and fan out to everyone. The sender's client already showed the message
		 * optimistically (chat-mvp/04), so echoing it back would duplicate it.
		 */
		if c.id == env.SenderID {
			continue
		}

		select {
		case c.send <- []byte(env.Body): // queue in their send buffer
		default: // send buffer FULL = slow client -> drop (ADR-0018)
		}
	}
}

func (s *server) emitViewerJoined(c *conn) {
	ev := producer.ViewerJoined{
		ChannelID: c.channelID,
		StreamID:  c.streamID,
		UserID:    demoUserID,
		JoinedAt:  time.Now().UTC(),
	}

	if err := s.prod.ProduceViewerJoined(c.channelID, ev); err != nil {
		s.log.Error("produce ViewerJoined failed", "err", err)
	}
}

func (s *server) emitViewerLeft(c *conn) {
	ev := producer.ViewerLeft{
		ChannelID: c.channelID,
		StreamID:  c.streamID,
		UserID:    demoUserID,
		LeftAt:    time.Now().UTC(),
	}

	if err := s.prod.ProduceViewerLeft(c.channelID, ev); err != nil {
		s.log.Error("produce ViewerLeft failed", "err", err)
	}
}

func (s *server) register(c *conn) (first bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.channels[c.channelID] == nil {
		s.channels[c.channelID] = make(map[*conn]struct{})
		first = true
	}

	s.channels[c.channelID][c] = struct{}{}

	return first
}

func (s *server) unregister(c *conn) (last bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.channels[c.channelID], c)

	if len(s.channels[c.channelID]) == 0 {
		delete(s.channels, c.channelID)
		return true
	}

	return false
}

func (s *server) closeChannel(channelID string) {
	s.mu.RLock()
	conns := make([]*conn, 0, len(s.channels[channelID]))

	for c := range s.channels[channelID] {
		conns = append(conns, c)
	}

	s.mu.RUnlock()
	s.log.Info("force-closing channel", "channelID", channelID, "conns", len(conns))

	for _, c := range conns {
		_ = c.ws.Close(websocket.StatusGoingAway, "stream ended")
	}
}
