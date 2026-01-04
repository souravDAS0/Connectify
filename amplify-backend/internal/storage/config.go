package storage

import (
	"fmt"
	"os"
)

type StorageConfig struct {
	MaxFileSize       int64
	AllowedAudioTypes []string
	AllowedImageTypes []string
}

func DefaultConfig() *StorageConfig {

	maxFileSize := int64(10 * 1024 * 1024) // 10MB default
	if envSize := os.Getenv("MAX_FILE_SIZE"); envSize != "" {
		// Parse env size if provided
		fmt.Sscanf(envSize, "%d", &maxFileSize)
	}

	return &StorageConfig{
		MaxFileSize: maxFileSize,
		AllowedAudioTypes: []string{
			"audio/mpeg",  // MP3
			"audio/wav",   // WAV
			"audio/x-wav", // WAV alternative
			"audio/flac",  // FLAC
			"audio/ogg",   // OGG
			"audio/aac",   // AAC
			"audio/x-m4a", // M4A
			"audio/mp4",   // M4A alternative
		},
		AllowedImageTypes: []string{
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
		},
	}
}

func (sc *StorageConfig) IsAudioTypeAllowed(mimeType string) bool {
	for _, allowed := range sc.AllowedAudioTypes {
		if allowed == mimeType {
			return true
		}
	}
	return false
}

// IsImageTypeAllowed checks if the MIME type is allowed for images
func (sc *StorageConfig) IsImageTypeAllowed(mimeType string) bool {
	for _, allowed := range sc.AllowedImageTypes {
		if allowed == mimeType {
			return true
		}
	}
	return false
}
