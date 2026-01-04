package music

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Track struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title    string             `bson:"title" json:"title"`
	Artist   string             `bson:"artist" json:"artist"`
	Album    string             `bson:"album" json:"album"`
	Genre    string             `bson:"genre" json:"genre"`
	Duration int                `bson:"duration" json:"duration"` // seconds
	Year     int                `bson:"year,omitempty" json:"year,omitempty"`

	// File storage fields
	FilePath string `bson:"file_path" json:"-"`              // Hidden from JSON
	FileName string `bson:"file_name" json:"file_name"`
	FileSize int64  `bson:"file_size" json:"file_size"`      // bytes
	MimeType string `bson:"mime_type" json:"mime_type"`      // audio/mpeg, etc.

	// Album art
	AlbumArtURL  string `bson:"album_art_url,omitempty" json:"album_art_url,omitempty"` // Stored in DB and returned in API

	// Legacy support for external URLs
	URL string `bson:"url,omitempty" json:"url,omitempty"` // External URL (optional)

	// Metadata
	CreatedAt  time.Time  `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time  `bson:"updated_at" json:"updated_at"`
	PlayCount  int        `bson:"play_count" json:"play_count"`
	LastPlayed *time.Time `bson:"last_played,omitempty" json:"last_played,omitempty"`
}
	