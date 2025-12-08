package websocket

import (
	"github.com/gofiber/fiber/v2"
)

func RegisterWebSocketRoutes(app *fiber.App, hub *Hub) {
	app.Get("/ws", hub.HandleWebSocketFiber)
}
