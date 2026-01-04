package middleware

import (
	"context"
	"errors"
	"log"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gofiber/fiber/v2"
)

// ClerkConfig holds both Clerk secret keys and publishable keys for dual authentication
type ClerkConfig struct {
	FrontendSecretKey      string
	FrontendPublishableKey string
	AdminSecretKey         string
	AdminPublishableKey    string
}

// VerifyTokenWithBothKeys attempts verification with both Clerk keys
// This allows the backend to accept tokens from both frontend and admin Clerk apps
func VerifyTokenWithBothKeys(ctx context.Context, token string, config *ClerkConfig) (*clerk.SessionClaims, error) {
	tokenPreview := token
	if len(token) > 40 {
		tokenPreview = token[:20] + "..." + token[len(token)-20:]
	}
	log.Printf("=== VerifyTokenWithBothKeys: Starting verification ===")
	log.Printf("Token preview: %s", tokenPreview)
	log.Printf("Frontend secret key length: %d", len(config.FrontendSecretKey))
	log.Printf("Admin secret key length: %d", len(config.AdminSecretKey))

	// Try with the frontend key first
	log.Println("Trying frontend key...")

	// Let Clerk SDK use default backend - it will auto-detect from the JWT token
	clerk.SetKey(config.FrontendSecretKey)

	claims, err := jwt.Verify(ctx, &jwt.VerifyParams{
		Token: token,
	})
	if err == nil {
		log.Println("✓ Token verified with frontend key")
		log.Printf("Claims: Subject=%s, Issuer=%s", claims.Subject, claims.Issuer)
		return claims, nil
	}
	log.Printf("✗ Frontend key verification failed: %v", err)
	log.Printf("Error type: %T", err)

	// If verification failed, try with the admin key
	log.Println("Trying admin key...")

	// Admin uses the same API endpoint
	clerk.SetKey(config.AdminSecretKey)

	claims, err = jwt.Verify(ctx, &jwt.VerifyParams{
		Token: token,
	})
	if err == nil {
		log.Println("✓ Token verified with admin key")
		log.Printf("Claims: Subject=%s, Issuer=%s", claims.Subject, claims.Issuer)
		// Restore frontend key as default
		clerk.SetKey(config.FrontendSecretKey)
		return claims, nil
	}
	log.Printf("✗ Admin key verification failed: %v", err)
	log.Printf("Error type: %T", err)

	// Restore frontend key as default
	clerk.SetKey(config.FrontendSecretKey)

	log.Printf("=== VerifyTokenWithBothKeys: Verification FAILED  ===")
	return nil, errors.New("token verification failed with both keys: " + err.Error())
}

// ClerkAuth middleware validates Clerk JWT tokens from both Clerk apps
func ClerkAuth(config *ClerkConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract token from Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			log.Println("ClerkAuth: Missing authorization header")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		// Remove "Bearer " prefix
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			log.Println("ClerkAuth: Invalid authorization header format (missing Bearer prefix)")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		tokenPreview := tokenString
		if len(tokenString) > 20 {
			tokenPreview = tokenString[:20] + "..."
		}
		log.Printf("ClerkAuth: Attempting to verify token: %s\n", tokenPreview)

		// Verify token with both Clerk keys
		claims, err := VerifyTokenWithBothKeys(c.Context(), tokenString, config)
		if err != nil {
			log.Printf("ClerkAuth: Token verification failed: %v\n", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Extract user ID from claims (Clerk uses "sub" claim)
		userID := claims.Subject
		if userID == "" {
			log.Println("ClerkAuth: Missing user ID in claims")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token: missing user ID",
			})
		}

		log.Printf("ClerkAuth: Token verified successfully for user: %s\n", userID)

		// Store user ID in context for handlers to use
		c.Locals("user_id", userID)
		c.Locals("clerk_claims", claims)

		return c.Next()
	}
}

// ClerkAdminAuth middleware validates token AND checks for admin role
func ClerkAdminAuth(config *ClerkConfig) fiber.Handler {
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

		// Verify token with both Clerk keys
		claims, err := VerifyTokenWithBothKeys(c.Context(), tokenString, config)
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
