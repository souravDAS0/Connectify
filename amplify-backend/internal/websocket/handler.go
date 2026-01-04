package websocket

import (
	"amplify-backend/internal/middleware"

	"github.com/gofiber/fiber/v2"
)

// RegisterWebSocketRoutesWithClerk handles WebSocket with Clerk auth
func RegisterWebSocketRoutesWithClerk(app *fiber.App, hub *Hub, config *middleware.ClerkConfig) {
	app.Get("/ws", func(c *fiber.Ctx) error {
		// Get token from query params
		token := c.Query("token")
		if token == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Missing token"})
		}

		// Verify with both Clerk keys
		claims, err := middleware.VerifyTokenWithBothKeys(c.Context(), token, config)
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
