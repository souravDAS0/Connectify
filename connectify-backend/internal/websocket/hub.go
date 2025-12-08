package websocket

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"time"

	"github.com/fasthttp/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"github.com/valyala/fasthttp"
)

var fasthttpUpgrader = websocket.FastHTTPUpgrader{
	CheckOrigin: func(ctx *fasthttp.RequestCtx) bool {
		return true // Allow all origins in development
	},
}

type Hub struct {
	clients     map[*Client]bool
	register    chan *Client
	unregister  chan *Client
	broadcast   chan []byte
	redisClient *redis.Client
}

type Client struct {
	hub  *Hub
	conn *websocket.Conn
	send chan []byte
	id   string
}

type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type PlaybackState struct {
	TrackID  string  `json:"track_id"`
	Position int     `json:"position"`
	Playing  bool    `json:"playing"`
	Volume   float64 `json:"volume,omitempty"`   // 0.0 to 1.0
	Shuffle  bool    `json:"shuffle,omitempty"`  // Shuffle mode
	Repeat   string  `json:"repeat,omitempty"`   // "none", "one", "all"
}

// Control message data structures
type SeekCommand struct {
	Position int `json:"position"` // milliseconds
}

type VolumeCommand struct {
	Volume float64 `json:"volume"` // 0.0 to 1.0
}

type LoadTrackCommand struct {
	TrackID string `json:"track_id"`
}

const playbackChannel = "playback:events"

func NewHub(redisClient *redis.Client) *Hub {
	hub := &Hub{
		clients:     make(map[*Client]bool),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		broadcast:   make(chan []byte),
		redisClient: redisClient,
	}

	// Start Redis subscription
	go hub.subscribeToRedis()

	return hub
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			log.Printf("Client %s connected. Total clients: %d", client.id, len(h.clients))

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("Client %s disconnected. Total clients: %d", client.id, len(h.clients))
			}

		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

func (h *Hub) subscribeToRedis() {
	ctx := context.Background()
	sub := h.redisClient.Subscribe(ctx, playbackChannel)
	ch := sub.Channel()

	go func() {
		defer sub.Close()
		log.Println("Started Redis subscription for playback events")

		for msg := range ch {
			var state PlaybackState
			if err := json.Unmarshal([]byte(msg.Payload), &state); err != nil {
				log.Printf("Failed to unmarshal Redis message: %v", err)
				continue
			}

			log.Printf("Received state from Redis: %+v", state)

			// Broadcast to all connected clients
			response := Message{
				Type: "playback:sync",
				Data: state,
			}
			responseBytes, _ := json.Marshal(response)
			h.broadcast <- responseBytes
		}
	}()
}

func (h *Hub) publishToRedis(state PlaybackState) {
	ctx := context.Background()
	data, err := json.Marshal(state)
	if err != nil {
		log.Printf("Failed to marshal state: %v", err)
		return
	}

	if err := h.redisClient.Publish(ctx, playbackChannel, data).Err(); err != nil {
		log.Printf("Failed to publish state: %v", err)
	} else {
		log.Printf("Published state to Redis: %+v", state)
	}
}

func (h *Hub) HandleWebSocketFiber(c *fiber.Ctx) error {
	// Use fasthttp upgrader for Fiber
	return fasthttpUpgrader.Upgrade(c.Context(), func(conn *websocket.Conn) {
		client := &Client{
			hub:  h,
			conn: conn,
			send: make(chan []byte, 256),
			id:   generateClientID(),
		}

		h.register <- client

		// Start goroutines for this client
		go client.writePump()
		client.readPump() // Run in current goroutine, blocks until connection closes
	})
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	// Set read deadline and pong handler for keepalive
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			log.Printf("Failed to unmarshal message: %v", err)
			continue
		}

		log.Printf("Received message from %s: %s", c.id, msg.Type)

		// Handle different message types
		switch msg.Type {
		case "playback:update":
			// Parse playback state
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			if err := json.Unmarshal(stateData, &state); err != nil {
				log.Printf("Failed to parse playback state: %v", err)
				continue
			}

			log.Printf("Processing playback update from %s: %+v", c.id, state)

			// Publish to Redis (which will broadcast to all clients including other servers)
			c.hub.publishToRedis(state)

		case "control:play":
			// Resume playback
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			if err := json.Unmarshal(stateData, &state); err != nil {
				log.Printf("Failed to parse play command: %v", err)
				continue
			}
			state.Playing = true
			log.Printf("Control: Play from %s", c.id)
			c.hub.publishToRedis(state)

		case "control:pause":
			// Pause playback
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			if err := json.Unmarshal(stateData, &state); err != nil {
				log.Printf("Failed to parse pause command: %v", err)
				continue
			}
			state.Playing = false
			log.Printf("Control: Pause from %s", c.id)
			c.hub.publishToRedis(state)

		case "control:stop":
			// Stop playback and reset position
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			if err := json.Unmarshal(stateData, &state); err != nil {
				log.Printf("Failed to parse stop command: %v", err)
				continue
			}
			state.Playing = false
			state.Position = 0
			log.Printf("Control: Stop from %s", c.id)
			c.hub.publishToRedis(state)

		case "control:seek":
			// Seek to position
			stateData, _ := json.Marshal(msg.Data)
			var seekCmd SeekCommand
			if err := json.Unmarshal(stateData, &seekCmd); err != nil {
				log.Printf("Failed to parse seek command: %v", err)
				continue
			}
			// Need current state to update position
			state := PlaybackState{Position: seekCmd.Position}
			log.Printf("Control: Seek to %d from %s", seekCmd.Position, c.id)
			c.hub.publishToRedis(state)

		case "control:volume":
			// Set volume
			stateData, _ := json.Marshal(msg.Data)
			var volCmd VolumeCommand
			if err := json.Unmarshal(stateData, &volCmd); err != nil {
				log.Printf("Failed to parse volume command: %v", err)
				continue
			}
			state := PlaybackState{Volume: volCmd.Volume}
			log.Printf("Control: Volume %.2f from %s", volCmd.Volume, c.id)
			c.hub.publishToRedis(state)

		case "control:load":
			// Load a new track
			stateData, _ := json.Marshal(msg.Data)
			var loadCmd LoadTrackCommand
			if err := json.Unmarshal(stateData, &loadCmd); err != nil {
				log.Printf("Failed to parse load command: %v", err)
				continue
			}
			state := PlaybackState{
				TrackID:  loadCmd.TrackID,
				Position: 0,
				Playing:  false,
			}
			log.Printf("Control: Load track %s from %s", loadCmd.TrackID, c.id)
			c.hub.publishToRedis(state)

		case "control:next":
			// Skip to next track (client should handle queue logic)
			log.Printf("Control: Next from %s", c.id)
			// Broadcast the command to all clients
			response := Message{Type: "control:next", Data: nil}
			responseBytes, _ := json.Marshal(response)
			c.hub.broadcast <- responseBytes

		case "control:previous":
			// Go to previous track (client should handle queue logic)
			log.Printf("Control: Previous from %s", c.id)
			// Broadcast the command to all clients
			response := Message{Type: "control:previous", Data: nil}
			responseBytes, _ := json.Marshal(response)
			c.hub.broadcast <- responseBytes

		case "control:shuffle":
			// Toggle shuffle mode
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			if err := json.Unmarshal(stateData, &state); err != nil {
				log.Printf("Failed to parse shuffle command: %v", err)
				continue
			}
			log.Printf("Control: Shuffle %v from %s", state.Shuffle, c.id)
			c.hub.publishToRedis(state)

		case "control:repeat":
			// Set repeat mode
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			if err := json.Unmarshal(stateData, &state); err != nil {
				log.Printf("Failed to parse repeat command: %v", err)
				continue
			}
			log.Printf("Control: Repeat %s from %s", state.Repeat, c.id)
			c.hub.publishToRedis(state)

		case "ping":
			// Respond to ping with pong
			response := Message{Type: "pong", Data: nil}
			responseBytes, _ := json.Marshal(response)
			select {
			case c.send <- responseBytes:
			default:
				close(c.send)
				return
			}
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second) // Send ping every 54 seconds
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func generateClientID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
