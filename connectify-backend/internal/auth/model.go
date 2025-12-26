package auth

import "go.mongodb.org/mongo-driver/bson/primitive"

type User struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email        string             `bson:"email" json:"email"`
	PasswordHash string             `bson:"password_hash" json:"-"`
}

// ClerkUser represents a user from Clerk API
type ClerkUser struct {
	ID             string              `json:"id"`
	FirstName      string              `json:"first_name,omitempty"`
	LastName       string              `json:"last_name,omitempty"`
	EmailAddresses []ClerkEmailAddress `json:"email_addresses"`
	PrimaryEmailID string              `json:"primary_email_address_id,omitempty"`
	ImageURL       string              `json:"image_url,omitempty"`
	CreatedAt      int64               `json:"created_at"`
	UpdatedAt      int64               `json:"updated_at"`
	LastSignInAt   *int64              `json:"last_sign_in_at,omitempty"`
}

type ClerkEmailAddress struct {
	ID           string `json:"id"`
	EmailAddress string `json:"email_address"`
	Verification struct {
		Status string `json:"status"`
	} `json:"verification"`
}
