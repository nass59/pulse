package main

import (
	"context"
	"log/slog"
	"net/http"
	"sync"

	"github.com/coder/websocket"
)

type conn struct {
	ws   *websocket.Conn
	send chan []byte // this viewer's send buffer (drops when full -- ADR-0018)
}

type server struct {
	mu       sync.RWMutex                  // guards the registry
	channels map[string]map[*conn]struct{} // slug -> set of conns
	log      *slog.Logger
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

	// READ loop -- this goroutine. Never do slow work in here.
	for {
		_, data, err := ws.Read(ctx)
		if err != nil { // client gone / closed
			return // -> defer unregister fires
		}

		// produce to Kafka here, then...
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
