package main

import (
	"context"
	"log/slog"
	"net/http"
	"pulse/chat/internal/producer"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/google/uuid"
)

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
}

func (s *server) handleWS(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("channelSlug") // from /ws/{channelSlug}

	ws, err := websocket.Accept(w, r, nil) // the HTTP 101 upgrade
	if err != nil {
		return
	}

	defer func() {
		_ = ws.CloseNow()
	}()

	s.log.Info("ws connect", "channel", slug, "userId", "u_demo")

	c := &conn{ws: ws, send: make(chan []byte, 16)}

	s.register(slug, c)         // add to registry
	defer s.unregister(slug, c) // clean up on ANY exit
	defer s.log.Info("ws disconnect", "channel", slug, "userId", "u_demo")

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

	// TODO(issue 05): capture the real channelId/streamId from the stream-lifecycle
	// log (the wristband, read at the liveness gate). Until then these are
	// UUIDv5(slug) placeholders — deterministic so a channel co-partitions with
	// itself, but they DO NOT match identity's real channelIds. No consumer may
	// join chat.messages.v1 on channelId before issue 05 lands, or it joins on ids
	// identity has never minted.
	c.channelID = uuid.NewSHA1(uuid.NameSpaceURL, []byte(slug)).String()
	c.streamID = uuid.NewSHA1(uuid.NameSpaceURL, []byte("stream:"+slug)).String()

	// READ loop -- this goroutine. Never do slow work in here.
	for {
		_, data, err := ws.Read(ctx)
		if err != nil { // client gone / closed
			return // -> defer unregister fires
		}

		id, _ := uuid.NewV7() // server-minted UUIDv7 (time-ordered)

		msg := producer.ChatMessageSent{
			MessageID: id.String(),
			ChannelID: c.channelID,      // ← the WRISTBAND (placeholder for now)
			StreamID:  c.streamID,       // ← the WRISTBAND (placeholder for now)
			UserID:    "u_demo",         // hardcoded MVP
			Body:      string(data),     // the ONLY client input
			SentAt:    time.Now().UTC(), // server receipt time
		}

		if err := s.prod.Produce(ctx, c.channelID, msg); err != nil {
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
