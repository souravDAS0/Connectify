package websocket

import (
	"amplify-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

// RegisterWebSocketRoutesWithSupabase handles WebSocket with Supabase auth
func RegisterWebSocketRoutesWithSupabase(app *fiber.App, hub *Hub, config *middleware.SupabaseConfig) {
	app.Get("/ws", func(c *fiber.Ctx) error {
		// Get token from query params
		token := c.Query("token")
		if token == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Missing token"})
		}

		// Verify with Supabase
		claims, err := middleware.VerifySupabaseToken(c.Context(), token, config)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
		}

		// Extract user ID
		userID := claims.Subject
		if userID == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token: missing user ID"})
		}

		// Store userID in locals for the handler to use
		c.Locals("user_id", userID)

		return hub.HandleWebSocketFiber(c)
	})
}
