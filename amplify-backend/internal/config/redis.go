package config

import (
	"os"

	"github.com/redis/go-redis/v9"
)

func InitRedis() *redis.Client {
	opt, _ := redis.ParseURL(os.Getenv("REDIS_URL"))
	client := redis.NewClient(opt)

	return client
}
