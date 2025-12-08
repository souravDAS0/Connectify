package main

import (
	"connectify-backend/internal/auth"
	"connectify-backend/internal/config"
	"connectify-backend/internal/music"
	"connectify-backend/internal/playlist"
	"connectify-backend/internal/storage"
	"connectify-backend/internal/websocket"
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	mongoClient, err := config.InitMongo()
	if err != nil {
		log.Fatal("Mongo init failed:", err)
	}
	defer mongoClient.Disconnect(context.TODO())
	fmt.Println("MongoDB connected")

	db := mongoClient.Database("connectify")

	redisClient := config.InitRedis()
	defer redisClient.Close()
	fmt.Println("Redis connected")

	// Initialize storage
	storageConfig := storage.DefaultConfig()
	if err := storageConfig.InitDirectories(); err != nil {
		log.Fatal("Failed to initialize storage:", err)
	}
	fmt.Printf("Storage initialized at: %s\n", storageConfig.BasePath)
	storageService := storage.NewStorageService(storageConfig)

	// Initialize WebSocket hub
	hub := websocket.NewHub(redisClient)
	go hub.Run()

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		DisableStartupMessage: false,
	})

	// Add CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "*",
	}))

	// Register other routes
	authService := auth.NewAuthService(db)
	auth.RegisterRoutes(app, authService)

	// Register WebSocket routes with auth
	websocket.RegisterWebSocketRoutes(app, hub, authService)

	musicService := music.NewMusicService(db)
	playlistService := playlist.NewPlaylistService(db)

	// Register music routes with analytics services for complete stats
	music.RegisterRoutesWithAnalytics(app, musicService, storageService, &music.AnalyticsServices{
		MusicService:    musicService,
		PlaylistService: playlistService,
		AuthService:     authService,
	})

	playlist.RegisterRoutes(app, playlistService)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("Server starting on port %s\n", port)
	fmt.Printf("WebSocket endpoint: ws://localhost:%s/ws\n", port)
	log.Fatal(app.Listen(":" + port))
}
