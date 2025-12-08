package websocket

import (
	"connectify-backend/internal/auth"

	"github.com/gofiber/fiber/v2"
)

func RegisterWebSocketRoutes(app *fiber.App, hub *Hub, authService *auth.AuthService) {
	app.Get("/ws", func(c *fiber.Ctx) error {
		// Middleware logic inline for WebSocket upgrade
		token := c.Query("token")
		if token == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Missing token"})
		}

		userID, err := authService.ValidateToken(token)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
		}

		// Store userID in locals for the handler to find
		c.Locals("user_id", userID)

		return hub.HandleWebSocketFiber(c)
	})
}
