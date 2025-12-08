package sockets

import (
	"log"
	"net/http"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	socketio "github.com/googollee/go-socket.io"
)

func NewSocketServer() *socketio.Server {
	// Create server with proper options
	server := socketio.NewServer(nil)

	server.OnConnect("/", func(c socketio.Conn) error {
		log.Printf("Socket connected: %s", c.ID())
		return nil
	})

	server.OnDisconnect("/", func(c socketio.Conn, reason string) {
		log.Printf("Socket disconnected: %s, reason: %s", c.ID(), reason)
	})

	server.OnError("/", func(c socketio.Conn, err error) {
		log.Printf("Socket error for %s: %v", c.ID(), err)
	})

	return server
}

func SocketAdapter(server *socketio.Server) func(*fiber.Ctx) error {
	return adaptor.HTTPHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add proper headers for Socket.IO
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "*")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		server.ServeHTTP(w, r)
	}))
}
