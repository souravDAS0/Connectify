package websocket

import (
	"amplify-backend/internal/middleware"
	"log"

	"github.com/gofiber/fiber/v2"
)

// RegisterWebSocketRoutesWithSupabase handles WebSocket with Supabase auth
func RegisterWebSocketRoutesWithSupabase(app *fiber.App, hub *Hub, config *middleware.SupabaseConfig) {
	app.Get("/ws", func(c *fiber.Ctx) error {
		log.Println("[WebSocket] Connection attempt received")

		// Get token from query params
		token := c.Query("token")
		if token == "" {
			log.Println("[WebSocket] ERROR: Missing token")
			return c.Status(401).JSON(fiber.Map{"error": "Missing token"})
		}

		log.Printf("[WebSocket] Token received (first 50 chars): %s...\n", token[:min(50, len(token))])

		// Verify with Supabase
		claims, err := middleware.VerifySupabaseToken(c.Context(), token, config)
		if err != nil {
			log.Printf("[WebSocket] ERROR: Token verification failed: %v\n", err)
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
		}

		// Extract user ID
		userID := claims.Subject
		if userID == "" {
			log.Println("[WebSocket] ERROR: Invalid token - missing user ID")
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token: missing user ID"})
		}

		log.Printf("[WebSocket] Auth successful for user: %s\n", userID)

		// Store userID in locals for the handler to use
		c.Locals("user_id", userID)

		log.Println("[WebSocket] Attempting WebSocket upgrade...")
		return hub.HandleWebSocketFiber(c)
	})
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
