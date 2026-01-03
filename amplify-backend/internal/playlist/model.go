package playlist

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Playlist struct {
	ID          primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Name        string               `bson:"name" json:"name"`
	Description string               `bson:"description,omitempty" json:"description,omitempty"`
	TrackIDs    []primitive.ObjectID `bson:"track_ids" json:"track_ids"`
	CoverArt    string               `bson:"cover_art,omitempty" json:"cover_art,omitempty"`
	IsPublic    bool                 `bson:"is_public" json:"is_public"`
	CreatedBy   string               `bson:"created_by,omitempty" json:"created_by,omitempty"` // Clerk User ID
	CreatedAt   time.Time            `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time            `bson:"updated_at" json:"updated_at"`
}
