package main

import (
	"amplify-backend/internal/auth"
	"amplify-backend/internal/config"
	"amplify-backend/internal/middleware"
	"amplify-backend/internal/music"
	"amplify-backend/internal/playlist"
	"amplify-backend/internal/storage"
	"amplify-backend/internal/websocket"
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

	// Initialize Supabase configuration
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseAnonKey := os.Getenv("SUPABASE_ANON_KEY")
	supabaseJWTSecret := os.Getenv("SUPABASE_JWT_SECRET")

	if supabaseURL == "" {
		log.Fatal("SUPABASE_URL environment variable is required")
	}
	if supabaseAnonKey == "" {
		log.Fatal("SUPABASE_ANON_KEY environment variable is required")
	}
	if supabaseJWTSecret == "" {
		log.Fatal("SUPABASE_JWT_SECRET environment variable is required")
	}

	// Create Supabase config for middleware
	supabaseConfig := &middleware.SupabaseConfig{
		URL:       supabaseURL,
		AnonKey:   supabaseAnonKey,
		JWTSecret: supabaseJWTSecret,
	}
	fmt.Println("Supabase authentication initialized")

	// Initialize storage based on environment
	var storageService storage.StorageProvider

	// Initialize Cloudinary
	cloudName := os.Getenv("CLOUDINARY_CLOUD_NAME")
	apiKey := os.Getenv("CLOUDINARY_API_KEY")
	apiSecret := os.Getenv("CLOUDINARY_API_SECRET")

	if cloudName == "" || apiKey == "" || apiSecret == "" {
		log.Fatal("Cloudinary credentials required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET")
	}

	storageConfig := storage.DefaultConfig()
	cloudinaryService, err := storage.NewCloudinaryService(cloudName, apiKey, apiSecret, storageConfig)
	if err != nil {
		log.Fatal("Failed to initialize Cloudinary:", err)
	}
	storageService = cloudinaryService
	fmt.Println("Cloudinary storage initialized")

	// Initialize WebSocket hub
	hub := websocket.NewHub(redisClient)
	go hub.Run()

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		DisableStartupMessage: false,
		BodyLimit:             15 * 1024 * 1024, // 15MB
	})

	// Register WebSocket routes BEFORE CORS middleware
	// WebSocket doesn't use CORS and CORS middleware can interfere with upgrades
	websocket.RegisterWebSocketRoutesWithSupabase(app, hub, supabaseConfig)

	// Add CORS middleware (after WebSocket routes)
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

	// Register music routes with analytics services (PUBLIC - no auth required for streaming)
	music.RegisterRoutesWithAnalytics(app, musicService, storageService, &music.AnalyticsServices{
		MusicService:    musicService,
		PlaylistService: playlistService,
		AuthService:     authService,
	})

	// Register playlist routes (PUBLIC - guest users can view, auth required to create/edit)
	// Note: Auth enforcement happens at the application logic level, not middleware
	playlist.RegisterRoutes(app, playlistService)

	// User management endpoint (TEMPORARILY WITHOUT AUTH FOR TESTING)
	app.Get("/users", func(c *fiber.Ctx) error {
		log.Println("GET /users endpoint hit")
		users, err := authService.GetAllUsers()
		if err != nil {
			log.Printf("Error getting users: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to get users"})
		}
		log.Printf("Successfully retrieved %d users", len(users))
		return c.JSON(users)
	})

	// Admin routes for user management (protected with admin middleware)
	adminRoutes := app.Group("/admin", middleware.SupabaseAdminAuth(supabaseConfig))
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
