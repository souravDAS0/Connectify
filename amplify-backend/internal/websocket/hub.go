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
	// Map of UserID -> Map of *Client -> bool
	clients map[string]map[*Client]bool

	// Register requests
	register chan *Client

	// Unregister requests
	unregister chan *Client

	// Broadcast to specific user: Message struct needs UserID
	broadcast chan *UserMessage

	redisClient *redis.Client
}

type Client struct {
	hub        *Hub
	conn       *websocket.Conn
	send       chan []byte
	ID         string
	UserID     string
	DeviceID   string
	DeviceName string
}

type UserMessage struct {
	UserID  string
	Message []byte
}

type Message struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type PlaybackState struct {
	TrackID        string  `json:"track_id"`
	Position       *int    `json:"position,omitempty"`
	Playing        *bool   `json:"playing,omitempty"`
	Volume         float64 `json:"volume,omitempty"`
	Shuffle        bool    `json:"shuffle,omitempty"`
	Repeat         string  `json:"repeat,omitempty"`
	ActiveDeviceID string  `json:"active_device_id,omitempty"`
}

// Control message data structures
type SeekCommand struct {
	Position int `json:"position"`
}

type VolumeCommand struct {
	Volume float64 `json:"volume"`
}

type LoadTrackCommand struct {
	TrackID string `json:"track_id"`
}

// Device management messages
type DeviceInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"` // "player" or "controller"
}

type SetActiveDeviceCommand struct {
	DeviceID string `json:"device_id"`
	Position int    `json:"position"`
}

type DeviceListUpdate struct {
	Devices        []DeviceWithStatus `json:"devices"`
	ActiveDeviceID string             `json:"active_device_id"`
}

type DeviceWithStatus struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	IsActive bool   `json:"is_active"`
}

func getPlaybackChannel(userID string) string {
	return "playback:user:" + userID
}

func NewHub(redisClient *redis.Client) *Hub {
	return &Hub{
		clients:     make(map[string]map[*Client]bool),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		broadcast:   make(chan *UserMessage),
		redisClient: redisClient,
	}
}

func (h *Hub) Run() {
	// Helper to save state
	savePlaybackState := func(userID string, newState PlaybackState) {
		ctx := context.Background()
		key := "user:" + userID + ":playback"

		// Get existing state
		var currentState PlaybackState
		val, err := h.redisClient.Get(ctx, key).Result()
		if err == nil {
			json.Unmarshal([]byte(val), &currentState)
		}

		// Merge updates
		if newState.TrackID != "" {
			currentState.TrackID = newState.TrackID
		}
		if newState.Position != nil {
			currentState.Position = newState.Position
		}
		if newState.Playing != nil {
			currentState.Playing = newState.Playing
		}
		if newState.Volume != 0 {
			currentState.Volume = newState.Volume
		}
		if newState.ActiveDeviceID != "" {
			currentState.ActiveDeviceID = newState.ActiveDeviceID
		}
		// Sync shuffle state (explicit boolean check)
		if newState.Shuffle != currentState.Shuffle {
			currentState.Shuffle = newState.Shuffle
		}
		// Sync repeat mode
		if newState.Repeat != "" {
			currentState.Repeat = newState.Repeat
		}

		// Save back
		data, _ := json.Marshal(currentState)
		h.redisClient.Set(ctx, key, data, 24*time.Hour)
	}

	for {
		select {
		case client := <-h.register:
			// Initialize user map if needed
			if _, ok := h.clients[client.UserID]; !ok {
				h.clients[client.UserID] = make(map[*Client]bool)
				// Start subscription for this user if it's the first client
				go h.subscribeToUser(client.UserID)
			}

			h.clients[client.UserID][client] = true
			log.Printf("Client %s connected for user %s. Device: %s", client.ID, client.UserID, client.DeviceName)

			// Register device in Redis
			h.registerDevice(client)

			// Send initial state if exists
			ctx := context.Background()
			key := "user:" + client.UserID + ":playback"
			val, err := h.redisClient.Get(ctx, key).Result()
			if err == nil {
				var state PlaybackState
				if err := json.Unmarshal([]byte(val), &state); err == nil {
					// Use standard message format for initial sync
					msg := Message{
						Type: "playback:sync",
						Data: state,
					}
					data, _ := json.Marshal(msg)
					client.send <- data
				}
			}

			// Broadcast updated device list to all user's clients
			h.broadcastDeviceList(client.UserID)

		case client := <-h.unregister:
			if userClients, ok := h.clients[client.UserID]; ok {
				if _, ok := userClients[client]; ok {
					delete(userClients, client)
					close(client.send)
					log.Printf("Client %s disconnected (Device: %s)", client.ID, client.DeviceID)

					// Remove device from Redis
					h.removeDevice(client.UserID, client.DeviceID)

					// Check if the disconnecting device was the active device
					ctx := context.Background()
					key := "user:" + client.UserID + ":playback"
					val, err := h.redisClient.Get(ctx, key).Result()

					var wasActiveDevice bool
					var currentState PlaybackState

					if err == nil {
						if err := json.Unmarshal([]byte(val), &currentState); err == nil {
							wasActiveDevice = currentState.ActiveDeviceID == client.DeviceID
						}
					}

					if wasActiveDevice {
						log.Printf("Active device %s disconnected, handling device switch", client.DeviceID)

						// Get remaining devices
						remainingDevices, err := h.getActiveDevices(client.UserID)
						if err == nil && len(remainingDevices) > 0 {
							// Set first remaining device as active, but stop playback
							playing := false
							currentState.Playing = &playing
							currentState.ActiveDeviceID = remainingDevices[0].ID
							log.Printf("Switched active device to %s (playback stopped)", remainingDevices[0].ID)
						} else {
							// No remaining devices, clear active device
							playing := false
							currentState.Playing = &playing
							currentState.ActiveDeviceID = ""
							log.Printf("No remaining devices, cleared active device")
						}

						// Save updated state
						data, _ := json.Marshal(currentState)
						h.redisClient.Set(ctx, key, data, 24*time.Hour)

						// Broadcast updated playback state
						msg := Message{
							Type: "playback:sync",
							Data: currentState,
						}
						h.publishToRedis(client.UserID, msg)
					}

					// Broadcast updated device list to remaining clients
					h.broadcastDeviceList(client.UserID)

					// If no more clients for this user, clean up map
					if len(userClients) == 0 {
						delete(h.clients, client.UserID)
					}
				}
			}

		case userMsg := <-h.broadcast:
			// Intercept broadcast to save state if it's a playback sync
			var msg Message
			if err := json.Unmarshal(userMsg.Message, &msg); err == nil {
				switch msg.Type {
				case "playback:sync":
					// Extract state from message data map/struct
					// This is tricky because Data is interface{}.
					// We need to re-marshal/unmarshal or type assert if possible.
					// Since it came from Redis string, it's likely a map[string]interface{}.

					// Use a fresh unmarshal for safety
					var state PlaybackState
					dataBytes, _ := json.Marshal(msg.Data)
					if err := json.Unmarshal(dataBytes, &state); err == nil {
						savePlaybackState(userMsg.UserID, state)
					}
				case "control:seek":
					// Also save state for seek commands
					var seekCmd SeekCommand
					dataBytes, _ := json.Marshal(msg.Data)
					if err := json.Unmarshal(dataBytes, &seekCmd); err == nil {
						state := PlaybackState{Position: &seekCmd.Position}
						savePlaybackState(userMsg.UserID, state)
					}
				}
			}

			if clients, ok := h.clients[userMsg.UserID]; ok {
				for client := range clients {
					select {
					case client.send <- userMsg.Message:
					default:
						close(client.send)
						delete(clients, client)
					}
				}
			}
		}
	}
}

func (h *Hub) subscribeToUser(userID string) {
	ctx := context.Background()
	channel := getPlaybackChannel(userID)
	sub := h.redisClient.Subscribe(ctx, channel)
	ch := sub.Channel()

	log.Printf("Started Redis subscription for %s", channel)

	// This goroutine runs until the hub stops or subscription fails
	// In a production app, we'd need better lifecycle management here
	for msg := range ch {
		// Forward message to user's clients
		h.broadcast <- &UserMessage{
			UserID:  userID,
			Message: []byte(msg.Payload),
		}
	}
}

func (h *Hub) registerDevice(c *Client) {
	ctx := context.Background()
	key := "user:" + c.UserID + ":devices"

	deviceData := map[string]string{
		"id":   c.DeviceID,
		"name": c.DeviceName,
	}

	bytes, _ := json.Marshal(deviceData)

	// Add to set of devices
	h.redisClient.SAdd(ctx, key, string(bytes))
	// Set expiry for the set to auto-cleanup inactive users' device lists
	h.redisClient.Expire(ctx, key, 24*time.Hour)
}

// getActiveDevices fetches all active devices for a user from Redis
func (h *Hub) getActiveDevices(userID string) ([]DeviceInfo, error) {
	ctx := context.Background()
	key := "user:" + userID + ":devices"

	deviceStrings, err := h.redisClient.SMembers(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	devices := make([]DeviceInfo, 0, len(deviceStrings))
	for _, deviceStr := range deviceStrings {
		var deviceData map[string]string
		if err := json.Unmarshal([]byte(deviceStr), &deviceData); err != nil {
			continue
		}

		devices = append(devices, DeviceInfo{
			ID:   deviceData["id"],
			Name: deviceData["name"],
		})
	}

	return devices, nil
}

// removeDevice removes a specific device from Redis by device ID
func (h *Hub) removeDevice(userID, deviceID string) error {
	ctx := context.Background()
	key := "user:" + userID + ":devices"

	// Get all devices
	deviceStrings, err := h.redisClient.SMembers(ctx, key).Result()
	if err != nil {
		return err
	}

	// Find and remove the matching device
	for _, deviceStr := range deviceStrings {
		var deviceData map[string]string
		if err := json.Unmarshal([]byte(deviceStr), &deviceData); err != nil {
			continue
		}

		if deviceData["id"] == deviceID {
			h.redisClient.SRem(ctx, key, deviceStr)
			break
		}
	}

	return nil
}

// broadcastDeviceList sends updated device list to all connected clients for a user
func (h *Hub) broadcastDeviceList(userID string) {
	// Get current active device from playback state
	ctx := context.Background()
	key := "user:" + userID + ":playback"
	var activeDeviceID string

	val, err := h.redisClient.Get(ctx, key).Result()
	if err == nil {
		var state PlaybackState
		if err := json.Unmarshal([]byte(val), &state); err == nil {
			activeDeviceID = state.ActiveDeviceID
		}
	}

	// Get all active devices
	devices, err := h.getActiveDevices(userID)
	if err != nil {
		log.Printf("Failed to get active devices: %v", err)
		return
	}

	// Build device list with status
	devicesWithStatus := make([]DeviceWithStatus, 0, len(devices))
	for _, device := range devices {
		devicesWithStatus = append(devicesWithStatus, DeviceWithStatus{
			ID:       device.ID,
			Name:     device.Name,
			IsActive: device.ID == activeDeviceID,
		})
	}

	// Create and publish message
	update := DeviceListUpdate{
		Devices:        devicesWithStatus,
		ActiveDeviceID: activeDeviceID,
	}

	msg := Message{
		Type: "device:list_update",
		Data: update,
	}

	h.publishToRedis(userID, msg)
}

func (h *Hub) publishToRedis(userID string, msg interface{}) {
	ctx := context.Background()

	// If it's a playback state, ensure we're publishing to the right channel
	// Or wrap it in a standard message format

	// Here we assume msg is already the full JSON message object or we construct it
	// If msg is PlaybackState, we wrap it in 'playback:sync' message

	var data []byte
	var err error

	if state, ok := msg.(PlaybackState); ok {
		wrapper := Message{
			Type: "playback:sync",
			Data: state,
		}
		data, err = json.Marshal(wrapper)
	} else if message, ok := msg.(Message); ok {
		data, err = json.Marshal(message)
	} else {
		data, err = json.Marshal(msg)
	}

	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}

	if err := h.redisClient.Publish(ctx, getPlaybackChannel(userID), data).Err(); err != nil {
		log.Printf("Failed to publish to Redis: %v", err)
	}
}

func (h *Hub) HandleWebSocketFiber(c *fiber.Ctx) error {
	// Extract Info from Query Params
	deviceID := c.Query("device_id")
	deviceName := c.Query("device_name")

	if deviceID == "" {
		deviceID = generateClientID() // Fallback
	}
	if deviceName == "" {
		deviceName = "Web Player"
	}

	// Validate Token (We need acccess to auth service here, mostly we'd inject it or middleware)
	// For simplicity, we'll assume we pass the userID via a middleware context locally or
	// we just rely on the fact that if we got here, we might validation inside the callback?
	// Actually fasthttpUpgrader takes over.

	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		// This should be caught by middleware, but safe guard
		return fiber.NewError(fiber.StatusUnauthorized, "Details missing")
	}

	return fasthttpUpgrader.Upgrade(c.Context(), func(conn *websocket.Conn) {
		client := &Client{
			hub:        h,
			conn:       conn,
			send:       make(chan []byte, 256),
			ID:         generateClientID(),
			UserID:     userID,
			DeviceID:   deviceID,
			DeviceName: deviceName,
		}

		h.register <- client

		go client.writePump()
		client.readPump()
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

		log.Printf("Received message from %s (User %s): %s", c.ID, c.UserID, msg.Type)

		// Handle different message types
		switch msg.Type {
		case "playback:update":
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			if err := json.Unmarshal(stateData, &state); err != nil {
				log.Printf("Failed to unmarshal playback:update from client %s: %v", c.ID, err)
				continue
			}
			state.ActiveDeviceID = c.DeviceID // Mark this device as active sender
			c.hub.publishToRedis(c.UserID, state)

		case "control:play":
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			json.Unmarshal(stateData, &state)
			playing := true
			state.Playing = &playing
			if state.ActiveDeviceID == "" {
				state.ActiveDeviceID = c.DeviceID
			}
			c.hub.publishToRedis(c.UserID, state)

		case "control:pause":
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			json.Unmarshal(stateData, &state)
			playing := false
			state.Playing = &playing
			c.hub.publishToRedis(c.UserID, state)

		case "control:stop":
			stateData, _ := json.Marshal(msg.Data)
			var state PlaybackState
			json.Unmarshal(stateData, &state)
			playing := false
			position := 0
			state.Playing = &playing
			state.Position = &position
			c.hub.publishToRedis(c.UserID, state)

		case "control:seek":
			stateData, _ := json.Marshal(msg.Data)
			var seekCmd SeekCommand
			if err := json.Unmarshal(stateData, &seekCmd); err != nil {
				log.Printf("Failed to unmarshal seek command: %v", err)
				continue
			}

			// Broadcast the specific control command so active devices can handle it
			// We send the command as-is, instead of converting to playback:sync
			// This triggers the 'control:seek' handler on the frontend which sets seekTarget
			cmd := Message{
				Type: "control:seek",
				Data: seekCmd,
			}
			c.hub.publishToRedis(c.UserID, cmd)

		case "control:volume":
			stateData, _ := json.Marshal(msg.Data)
			var volCmd VolumeCommand
			json.Unmarshal(stateData, &volCmd)
			state := PlaybackState{Volume: volCmd.Volume}
			c.hub.publishToRedis(c.UserID, state)

		case "control:load":
			stateData, _ := json.Marshal(msg.Data)
			var loadCmd LoadTrackCommand
			json.Unmarshal(stateData, &loadCmd)
			// Fetch current state to check if there is an active device
			ctx := context.Background()
			key := "user:" + c.UserID + ":playback"
			val, err := c.hub.redisClient.Get(ctx, key).Result()

			var currentState PlaybackState
			if err == nil {
				json.Unmarshal([]byte(val), &currentState)
			}

			playing := true
			position := 0
			state := PlaybackState{
				TrackID:  loadCmd.TrackID,
				Position: &position,
				Playing:  &playing,
			}

			// Only set active device if none is currently active
			if currentState.ActiveDeviceID == "" && c.DeviceID != "" {
				state.ActiveDeviceID = c.DeviceID
			}

			c.hub.publishToRedis(c.UserID, state)

		case "control:next":
			wrapper := Message{Type: "control:next", Data: nil}
			c.hub.publishToRedis(c.UserID, wrapper)

		case "control:previous":
			wrapper := Message{Type: "control:previous", Data: nil}
			c.hub.publishToRedis(c.UserID, wrapper)

		case "control:shuffle":
			// Extract shuffle state and save to Redis
			stateData, _ := json.Marshal(msg.Data)
			var shuffleData map[string]interface{}
			json.Unmarshal(stateData, &shuffleData)

			if shuffle, ok := shuffleData["shuffle"].(bool); ok {
				// Save to playback state
				state := PlaybackState{Shuffle: shuffle}
				c.hub.publishToRedis(c.UserID, state)
			}

			// Also broadcast the control message for immediate UI update
			wrapper := Message{Type: "control:shuffle", Data: msg.Data}
			c.hub.publishToRedis(c.UserID, wrapper)

		case "control:repeat":
			// Extract repeat mode and save to Redis
			stateData, _ := json.Marshal(msg.Data)
			var repeatData map[string]interface{}
			json.Unmarshal(stateData, &repeatData)

			if mode, ok := repeatData["mode"].(string); ok {
				// Save to playback state
				state := PlaybackState{Repeat: mode}
				c.hub.publishToRedis(c.UserID, state)
			}

			// Also broadcast the control message for immediate UI update
			wrapper := Message{Type: "control:repeat", Data: msg.Data}
			c.hub.publishToRedis(c.UserID, wrapper)

		case "device:set_active":
			stateData, _ := json.Marshal(msg.Data)
			var cmd SetActiveDeviceCommand
			json.Unmarshal(stateData, &cmd)

			state := PlaybackState{
				ActiveDeviceID: cmd.DeviceID,
				Position:       &cmd.Position,
			}
			c.hub.publishToRedis(c.UserID, state)

		case "ping":
			response := Message{Type: "pong", Data: nil}
			responseBytes, _ := json.Marshal(response)
			select {
			case c.send <- responseBytes:
			default:
				close(c.send)
				return
			}

		case "device:get_list":
			// Get current active device from playback state
			ctx := context.Background()
			key := "user:" + c.UserID + ":playback"
			var activeDeviceID string

			val, err := c.hub.redisClient.Get(ctx, key).Result()
			if err == nil {
				var state PlaybackState
				if err := json.Unmarshal([]byte(val), &state); err == nil {
					activeDeviceID = state.ActiveDeviceID
				}
			}

			// Get all active devices
			devices, err := c.hub.getActiveDevices(c.UserID)
			if err != nil {
				log.Printf("Failed to get active devices: %v", err)
				continue
			}

			// Build device list with status
			devicesWithStatus := make([]DeviceWithStatus, 0, len(devices))
			for _, device := range devices {
				devicesWithStatus = append(devicesWithStatus, DeviceWithStatus{
					ID:       device.ID,
					Name:     device.Name,
					IsActive: device.ID == activeDeviceID,
				})
			}

			// Send response directly to requesting client
			response := Message{
				Type: "device:list_update",
				Data: DeviceListUpdate{
					Devices:        devicesWithStatus,
					ActiveDeviceID: activeDeviceID,
				},
			}
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
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in writePump: %v", r)
		}
	}()

	for {
		select {
		case message, ok := <-c.send:
			if c.conn == nil {
				return
			}
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
