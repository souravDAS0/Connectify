package auth

import "github.com/gofiber/fiber/v2"

type AuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func RegisterRoutes(app *fiber.App, service *AuthService) {
	app.Post("/signup", func(c *fiber.Ctx) error {
		var req AuthRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request",
			})
		}

		user, err := service.SignUp(req.Email, req.Password)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(user)
	})

	app.Post("/login", func(c *fiber.Ctx) error {
		var req AuthRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid request",
			})
		}

		token, err := service.Login(req.Email, req.Password)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.JSON(fiber.Map{
			"token": token,
		})
	})

	// User management endpoints (admin)
	app.Get("/users", func(c *fiber.Ctx) error {
		users, err := service.GetAllUsers()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to get users",
			})
		}

		return c.JSON(users)
	})

	app.Get("/users/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		user, err := service.GetUserByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error": "User not found",
			})
		}

		return c.JSON(user)
	})

	app.Delete("/users/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		if err := service.DeleteUser(id); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to delete user",
			})
		}

		return c.SendStatus(204)
	})
}
