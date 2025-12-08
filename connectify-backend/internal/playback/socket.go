package playback

import (
	"log"

	socketio "github.com/googollee/go-socket.io"
	"github.com/redis/go-redis/v9"
)

func RegisterPlaybackSocket(io *socketio.Server, rdb *redis.Client) {
	// Handle playback updates
	io.OnEvent("/", "playback:update", func(c socketio.Conn, msg PlaybackState) {
		log.Printf("Playback update from %s: %+v", c.ID(), msg)
		
		// Join the playback room if not already joined
		c.Join("playback")
		
		// Publish to Redis
		PublishState(rdb, msg)
		
		// Broadcast to all other clients in the room (except sender)
		io.BroadcastToRoom("/", "playback", "playback:sync", msg)
	})

	// Handle connection to playback namespace
	io.OnConnect("/", func(s socketio.Conn) error {
		log.Printf("Client %s connected to playback", s.ID())
		s.Join("playback")
		
		// Optionally send current state to newly connected client
		// You might want to get current state from Redis here
		
		return nil
	})

	// Subscribe to Redis and broadcast updates
	SubscribeAndBroadcast(rdb, func(state PlaybackState) {
		log.Printf("Broadcasting state from Redis: %+v", state)
		io.BroadcastToRoom("/", "playback", "playback:sync", state)
	})
}
