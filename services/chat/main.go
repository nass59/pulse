package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"pulse/chat/internal/consumer"
	"pulse/chat/internal/fanout"
	"pulse/chat/internal/producer"
	"syscall"
	"time"

	"github.com/google/uuid"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	port := getenv("PORT", "8081") // config from env

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	brokers := getenv("KAFKA_BROKERS", "localhost:9092")
	registryURL := getenv("SCHEMA_REGISTRY_URL", "http://localhost:8080")

	host, err := os.Hostname()
	if err != nil {
		host = "unknown"
	}

	bootID, _ := uuid.NewV7()
	groupID := "chat-gateway-" + host + "-" + bootID.String()
	logger.Info("consumer group", "groupId", groupID)

	prod, err := producer.New(brokers, registryURL, logger)
	if err != nil {
		logger.Error("producer init failed", "err", err)
		os.Exit(1)
	}
	defer prod.Close()

	cons, err := consumer.New(brokers, groupID, registryURL, logger)
	if err != nil {
		logger.Error("consumer init failed", "err", err)
	}
	defer cons.Close()
	go cons.Run()

	redisURL := getenv("REDIS_URL", "redis://localhost:6379")

	fan, err := fanout.New(redisURL, logger)
	if err != nil {
		logger.Error("fan init failed", "err", err)
		os.Exit(1)
	}
	defer fan.Close()

	s := &server{channels: make(map[string]map[*conn]struct{}), log: logger, prod: prod, cons: cons, fan: fan}
	cons.OnEnded(s.closeChannel)
	fan.OnMessage(s.broadcast)
	go fan.Run()

	mux.HandleFunc("GET /ws/{channelSlug}", s.handleWS)

	srv := &http.Server{Addr: ":" + port, Handler: mux}

	// The go keyword launches a goroutine — concurrent, cheap.
	// Here it stops ListenAndServe (which blocks forever) from freezing main before we set up signal handling.
	go func() {
		logger.Info("listening", "port", port)

		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "err", err)
			os.Exit(1)
		}
	}()

	// Block until the OS tells us to stop (Ctrl-C locally, SIGTERM in Docker).
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	<-ctx.Done() // receive on the channel: blocks here

	logger.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("graceful shutdown failed", "err", err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	return fallback
}
