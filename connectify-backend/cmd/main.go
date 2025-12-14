package main

import (
	"connectify-backend/internal/auth"
	"connectify-backend/internal/config"
	"connectify-backend/internal/middleware"
	"connectify-backend/internal/music"
	"connectify-backend/internal/playlist"
	"connectify-backend/internal/storage"
	"connectify-backend/internal/websocket"
	"context"
	"fmt"
	"log"
	"os"

	"github.com/clerk/clerk-sdk-go/v2"
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

	// Initialize Clerk
	clerkSecretKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkSecretKey == "" {
		log.Fatal("CLERK_SECRET_KEY environment variable is required")
	}
	clerk.SetKey(clerkSecretKey)
	fmt.Println("Clerk initialized")

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
		BodyLimit:             15 * 1024 * 1024, // 15MB
	})

	// Add CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "*",
	}))

	// Initialize services
	authService := auth.NewAuthService(db)
	musicService := music.NewMusicService(db)
	playlistService := playlist.NewPlaylistService(db)

	// Register health check endpoint (public)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Register WebSocket routes with Clerk auth
	websocket.RegisterWebSocketRoutesWithClerk(app, hub)

	// Register public music routes (tracks listing, streaming)
	app.Get("/tracks", func(c *fiber.Ctx) error {
		tracks, err := musicService.GetAllTracks()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to get tracks"})
		}
		return c.JSON(tracks)
	})

	app.Get("/tracks/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		track, err := musicService.GetTrackByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "Track not found"})
		}
		return c.JSON(track)
	})

	// Register music routes with analytics services (Clerk protected)
	music.RegisterRoutesWithAnalytics(app, musicService, storageService, &music.AnalyticsServices{
		MusicService:    musicService,
		PlaylistService: playlistService,
		AuthService:     authService,
	})

	// Register playlist routes (Clerk protected)
	playlist.RegisterRoutes(app, playlistService)

	// Admin routes for user management (protected with admin middleware)
	adminRoutes := app.Group("/admin", middleware.ClerkAdminAuth())
	adminRoutes.Get("/users", func(c *fiber.Ctx) error {
		users, err := authService.GetAllUsers()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to get users"})
		}
		return c.JSON(users)
	})
	adminRoutes.Get("/users/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		user, err := authService.GetUserByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}
		return c.JSON(user)
	})
	adminRoutes.Delete("/users/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		if err := authService.DeleteUser(id); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to delete user"})
		}
		return c.SendStatus(204)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	fmt.Printf("Server starting on port %s\n", port)
	fmt.Printf("WebSocket endpoint: ws://localhost:%s/ws\n", port)
	log.Fatal(app.Listen(":" + port))
}
