package middleware

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gofiber/fiber/v2"
)

type SupabaseConfig struct {
	URL       string
	AnonKey   string
	JWTSecret string
}

type SupabaseClaims struct {
	jwt.RegisteredClaims
	Email        string                 `json:"email"`
	Phone        string                 `json:"phone"`
	AppMetadata  map[string]interface{} `json:"app_metadata"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
	Role         string                 `json:"role"`
	SessionID    string                 `json:"session_id"`
}

// VerifySupabaseToken verifies a Supabase JWT token
func VerifySupabaseToken(ctx context.Context, tokenString string, config *SupabaseConfig) (*SupabaseClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &SupabaseClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing algorithm
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Decode JWT secret (it's base64 encoded)
		secret, err := base64.StdEncoding.DecodeString(config.JWTSecret)
		if err != nil {
			// If not base64, use as-is
			return []byte(config.JWTSecret), nil
		}
		return secret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*SupabaseClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	// Verify issuer matches Supabase URL
	expectedIssuer := config.URL + "/auth/v1"
	if claims.Issuer != expectedIssuer {
		return nil, fmt.Errorf("invalid issuer: expected %s, got %s", expectedIssuer, claims.Issuer)
	}

	return claims, nil
}

// SupabaseAuth middleware validates Supabase JWT tokens
func SupabaseAuth(config *SupabaseConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			log.Println("SupabaseAuth: Missing authorization header")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			log.Println("SupabaseAuth: Invalid authorization header format")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		claims, err := VerifySupabaseToken(c.Context(), tokenString, config)
		if err != nil {
			log.Printf("SupabaseAuth: Token verification failed: %v\n", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		userID := claims.Subject
		if userID == "" {
			log.Println("SupabaseAuth: Missing user ID in claims")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token: missing user ID",
			})
		}

		log.Printf("SupabaseAuth: Token verified successfully for user: %s\n", userID)

		// Store user info in context
		c.Locals("user_id", userID)
		c.Locals("supabase_claims", claims)
		c.Locals("user_email", claims.Email)

		return c.Next()
	}
}

// SupabaseAdminAuth middleware validates token AND checks for admin role
func SupabaseAdminAuth(config *SupabaseConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
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

		claims, err := VerifySupabaseToken(c.Context(), tokenString, config)
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

		// Fetch user role from Supabase profiles table
		role, err := FetchUserRole(c.Context(), userID, config)
		if err != nil {
			log.Printf("SupabaseAdminAuth: Failed to fetch user role: %v\n", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to verify admin status",
			})
		}

		if role != "admin" {
			log.Printf("SupabaseAdminAuth: User %s lacks admin role (role: %s)\n", userID, role)
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Admin access required",
			})
		}

		log.Printf("SupabaseAdminAuth: Admin access granted for user: %s\n", userID)

		c.Locals("user_id", userID)
		c.Locals("supabase_claims", claims)
		c.Locals("user_email", claims.Email)
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

// FetchUserRole fetches role from Supabase profiles table
func FetchUserRole(ctx context.Context, userID string, config *SupabaseConfig) (string, error) {
	// Make HTTP request to Supabase REST API
	url := fmt.Sprintf("%s/rest/v1/profiles?id=eq.%s&select=role", config.URL, userID)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("apikey", config.AnonKey)
	req.Header.Set("Authorization", "Bearer "+config.AnonKey)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("failed to fetch user role: status %d", resp.StatusCode)
	}

	var profiles []struct {
		Role string `json:"role"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&profiles); err != nil {
		return "", err
	}

	if len(profiles) == 0 {
		return "user", nil // Default role
	}

	return profiles[0].Role, nil
}
