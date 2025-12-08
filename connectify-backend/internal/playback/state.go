// internal/playback/state.go
package playback

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"
)

const playbackChannel = "playback:events"

func PublishState(rdb *redis.Client, state PlaybackState) {
	ctx := context.Background()

	data, err := json.Marshal(state)
	if err != nil {
		log.Printf("Failed to marshal state: %v", err)
		return
	}

	if err := rdb.Publish(ctx, playbackChannel, data).Err(); err != nil {
		log.Printf("Failed to publish state: %v", err)
	} else {
		log.Printf("Published state to Redis: %+v", state)
	}
}

func SubscribeAndBroadcast(rdb *redis.Client, onUpdate func(PlaybackState)) {
	ctx := context.Background()

	sub := rdb.Subscribe(ctx, playbackChannel)
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
			onUpdate(state)
		}
	}()
}