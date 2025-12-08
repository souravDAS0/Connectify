package storage

import (
	"fmt"
	"os"
	"path/filepath"
)

type StorageConfig struct {
	BasePath          string
	MaxFileSize       int64
	AllowedAudioTypes []string
	AllowedImageTypes []string
}

func DefaultConfig() *StorageConfig {
	basePath := os.Getenv("STORAGE_PATH")
	if basePath == "" {
		basePath = "./storage"
	}

	maxFileSize := int64(100 * 1024 * 1024) // 100MB default
	if envSize := os.Getenv("MAX_FILE_SIZE"); envSize != "" {
		// Parse env size if provided
		fmt.Sscanf(envSize, "%d", &maxFileSize)
	}

	return &StorageConfig{
		BasePath:    basePath,
		MaxFileSize: maxFileSize,
		AllowedAudioTypes: []string{
			"audio/mpeg",     // MP3
			"audio/wav",      // WAV
			"audio/x-wav",    // WAV alternative
			"audio/flac",     // FLAC
			"audio/ogg",      // OGG
			"audio/aac",      // AAC
			"audio/x-m4a",    // M4A
			"audio/mp4",      // M4A alternative
		},
		AllowedImageTypes: []string{
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/webp",
		},
	}
}

// InitDirectories creates the required storage directories
func (sc *StorageConfig) InitDirectories() error {
	dirs := []string{
		filepath.Join(sc.BasePath, "tracks"),
		filepath.Join(sc.BasePath, "album-art"),
		filepath.Join(sc.BasePath, "temp"),
	}

	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}

	return nil
}

// IsAudioTypeAllowed checks if the MIME type is allowed for audio files
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
