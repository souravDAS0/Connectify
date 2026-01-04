package config

import (
	"os"

	"github.com/redis/go-redis/v9"
)

func InitRedis() *redis.Client {
	addr := os.Getenv("REDIS_ADDR")

	if addr == "" {
		addr = "localhost:6379"
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: "",
		DB:       0,
	})

	return rdb
}
