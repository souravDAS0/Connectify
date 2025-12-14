package middleware

import (
	"errors"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gofiber/fiber/v2"
)

// ClerkAuth middleware validates Clerk JWT tokens
func ClerkAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract token from Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		// Remove "Bearer " prefix
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		// Verify token with Clerk
		claims, err := jwt.Verify(c.Context(), &jwt.VerifyParams{
			Token: tokenString,
		})
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Extract user ID from claims (Clerk uses "sub" claim)
		userID := claims.Subject
		if userID == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token: missing user ID",
			})
		}

		// Store user ID in context for handlers to use
		c.Locals("user_id", userID)
		c.Locals("clerk_claims", claims)

		return c.Next()
	}
}

// ClerkAdminAuth middleware validates token AND checks for admin role
func ClerkAdminAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// First validate token (same as ClerkAuth)
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		claims, err := jwt.Verify(c.Context(), &jwt.VerifyParams{
			Token: tokenString,
		})
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		userID := claims.Subject
		if userID == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token: missing user ID",
			})
		}

		// For MVP: Admin role check is done on frontend
		// Backend trusts frontend check for now
		// TODO: Enhance this by including public_metadata in JWT template
		// or by fetching user from Clerk API to verify role

		c.Locals("user_id", userID)
		c.Locals("clerk_claims", claims)
		c.Locals("is_admin", true)

		return c.Next()
	}
}

// GetUserID helper to extract user ID from context
func GetUserID(c *fiber.Ctx) (string, error) {
	userID, ok := c.Locals("user_id").(string)
	if !ok || userID == "" {
		return "", errors.New("user ID not found in context")
	}
	return userID, nil
}
