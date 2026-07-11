package main

import (
	"context"
	"log/slog"
	"net/http"
	"pulse/chat/internal/consumer"
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

	c := &conn{ws: ws, send: make(chan []byte, 16), channelID: channelID, streamID: streamID}

	s.register(slug, c)         // add to registry
	s.emitViewerJoined(c)       // +1 turnstile click — gate already passed
	defer s.emitViewerLeft(c)   // −1, on ANY return below
	defer s.unregister(slug, c) // clean up on ANY exit
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

		s.broadcast(slug, c, data) // fan out to everyone else
	}
}

func (s *server) broadcast(slug string, sender *conn, msg []byte) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for c := range s.channels[slug] {
		if c == sender {
			continue // don't echo to the sender
		}

		select {
		case c.send <- msg: // queue in their send buffer
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

func (s *server) register(slug string, c *conn) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.channels[slug] == nil {
		s.channels[slug] = make(map[*conn]struct{})
	}

	s.channels[slug][c] = struct{}{}
}

func (s *server) unregister(slug string, c *conn) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.channels[slug], c)

	if len(s.channels[slug]) == 0 {
		delete(s.channels, slug)
	}
}

func (s *server) closeChannel(slug string) {
	s.mu.RLock()
	conns := make([]*conn, 0, len(s.channels[slug]))

	for c := range s.channels[slug] {
		conns = append(conns, c)
	}

	s.mu.RUnlock()
	s.log.Info("force-closing channel", "slug", slug, "conns", len(conns))

	for _, c := range conns {
		_ = c.ws.Close(websocket.StatusGoingAway, "stream ended")
	}
}
