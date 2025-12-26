package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	UserCollection *mongo.Collection
}

func NewAuthService(db *mongo.Database) *AuthService {
	return &AuthService{
		UserCollection: db.Collection("users"),
	}
}

func (s *AuthService) SignUp(email, password string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existing User
	err := s.UserCollection.FindOne(ctx, bson.M{"email": email}).Decode(&existing)
	if err == nil {
		return nil, errors.New("email already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &User{
		Email:        email,
		PasswordHash: string(hash),
	}

	res, err := s.UserCollection.InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}

	user.ID = res.InsertedID.(primitive.ObjectID)

	return user, nil

}

func (s *AuthService) Login(email, password string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user User
	err := s.UserCollection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"exp":     time.Now().Add(time.Hour * 72).Unix(),
	})

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "secret"
	}

	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// GetAllUsers returns all users from Clerk (for admin)
func (s *AuthService) GetAllUsers() ([]ClerkUser, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Use frontend secret key to fetch app users
	frontendSecretKey := os.Getenv("CLERK_SECRET_KEY")
	if frontendSecretKey == "" {
		return nil, errors.New("CLERK_SECRET_KEY not configured")
	}

	// Make direct HTTP request to Clerk API
	var allUsers []ClerkUser
	limit := 500
	offset := 0

	for {
		url := fmt.Sprintf("https://api.clerk.com/v1/users?limit=%d&offset=%d", limit, offset)

		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			return nil, err
		}

		req.Header.Set("Authorization", "Bearer "+frontendSecretKey)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("clerk API error: %d - %s", resp.StatusCode, string(body))
		}

		var result []struct {
			ID                    string `json:"id"`
			FirstName             string `json:"first_name"`
			LastName              string `json:"last_name"`
			PrimaryEmailAddressID string `json:"primary_email_address_id"`
			ImageURL              string `json:"image_url"`
			CreatedAt             int64  `json:"created_at"`
			UpdatedAt             int64  `json:"updated_at"`
			LastSignInAt          *int64 `json:"last_sign_in_at"`
			EmailAddresses        []struct {
				ID           string `json:"id"`
				EmailAddress string `json:"email_address"`
				Verification struct {
					Status string `json:"status"`
				} `json:"verification"`
			} `json:"email_addresses"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return nil, err
		}

		// Convert to ClerkUser
		for _, u := range result {
			cu := ClerkUser{
				ID:             u.ID,
				FirstName:      u.FirstName,
				LastName:       u.LastName,
				PrimaryEmailID: u.PrimaryEmailAddressID,
				ImageURL:       u.ImageURL,
				CreatedAt:      u.CreatedAt,
				UpdatedAt:      u.UpdatedAt,
				LastSignInAt:   u.LastSignInAt,
			}

			for _, email := range u.EmailAddresses {
				cu.EmailAddresses = append(cu.EmailAddresses, ClerkEmailAddress{
					ID:           email.ID,
					EmailAddress: email.EmailAddress,
					Verification: struct {
						Status string `json:"status"`
					}{
						Status: email.Verification.Status,
					},
				})
			}

			allUsers = append(allUsers, cu)
		}

		// Check if there are more users
		if len(result) < limit {
			break
		}
		offset += limit
	}

	return allUsers, nil
}

// stringValue safely dereferences a string pointer
func stringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// GetUserByID retrieves a single user by ID
func (s *AuthService) GetUserByID(id string) (*User, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user User
	err = s.UserCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// DeleteUser removes a user
func (s *AuthService) DeleteUser(id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = s.UserCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}

// GetTotalUserCount returns the total number of users from Clerk
func (s *AuthService) GetTotalUserCount() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Use Clerk API to get total user count
	result, err := user.Count(ctx, &user.ListParams{})
	if err != nil {
		return 0, err
	}

	return result.TotalCount, nil
}

// ValidateToken parses and validates a JWT token
func (s *AuthService) ValidateToken(tokenString string) (string, error) {
	// Parse token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "secret"
		}
		return []byte(secret), nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["user_id"].(string)
		if !ok {
			return "", errors.New("invalid token: missing user_id")
		}
		return userID, nil
	}

	return "", errors.New("invalid token")
}
