package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

type FileInfo struct {
	Path     string // Relative path from storage base
	FileName string // Original filename
	Size     int64
	MimeType string
}

type StorageService struct {
	config *StorageConfig
}

func NewStorageService(config *StorageConfig) *StorageService {
	return &StorageService{config: config}
}

// SaveAudioFile saves an uploaded audio file and returns storage info
func (s *StorageService) SaveAudioFile(fileHeader *multipart.FileHeader) (*FileInfo, error) {
	// Validate file size
	if fileHeader.Size > s.config.MaxFileSize {
		return nil, fmt.Errorf("file size %d exceeds maximum allowed size %d", fileHeader.Size, s.config.MaxFileSize)
	}

	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	// Detect MIME type from file content
	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil {
		return nil, fmt.Errorf("failed to read file for MIME detection: %w", err)
	}

	// Reset file pointer to beginning
	if _, err := file.Seek(0, 0); err != nil {
		return nil, fmt.Errorf("failed to reset file pointer: %w", err)
	}

	// For audio files, we'll trust the Content-Type header but validate it
	mimeType := fileHeader.Header.Get("Content-Type")
	if !s.config.IsAudioTypeAllowed(mimeType) {
		return nil, fmt.Errorf("file type %s is not allowed", mimeType)
	}

	// Generate unique filename with UUID
	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		// Try to determine extension from MIME type
		ext = getExtensionFromMimeType(mimeType)
	}
	uniqueFilename := uuid.New().String() + ext

	// Create year/month directory structure
	now := time.Now()
	relativePath := filepath.Join("tracks", fmt.Sprintf("%d", now.Year()), fmt.Sprintf("%02d", now.Month()), uniqueFilename)
	fullPath := filepath.Join(s.config.BasePath, relativePath)

	// Ensure directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	// Create destination file
	dst, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	// Copy file content
	size, err := io.Copy(dst, file)
	if err != nil {
		// Clean up on error
		os.Remove(fullPath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	return &FileInfo{
		Path:     relativePath,
		FileName: fileHeader.Filename,
		Size:     size,
		MimeType: mimeType,
	}, nil
}

// SaveAlbumArt saves an uploaded album artwork image and returns storage info
func (s *StorageService) SaveAlbumArt(fileHeader *multipart.FileHeader) (*FileInfo, error) {
	// Validate file size (use smaller limit for images)
	maxImageSize := int64(10 * 1024 * 1024) // 10MB for images
	if fileHeader.Size > maxImageSize {
		return nil, fmt.Errorf("image size %d exceeds maximum allowed size %d", fileHeader.Size, maxImageSize)
	}

	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	// Get MIME type
	mimeType := fileHeader.Header.Get("Content-Type")
	if !s.config.IsImageTypeAllowed(mimeType) {
		return nil, fmt.Errorf("image type %s is not allowed", mimeType)
	}

	// Generate unique filename
	ext := filepath.Ext(fileHeader.Filename)
	if ext == "" {
		ext = getExtensionFromMimeType(mimeType)
	}
	uniqueFilename := uuid.New().String() + ext

	// Create year/month directory structure
	now := time.Now()
	relativePath := filepath.Join("album-art", fmt.Sprintf("%d", now.Year()), fmt.Sprintf("%02d", now.Month()), uniqueFilename)
	fullPath := filepath.Join(s.config.BasePath, relativePath)

	// Ensure directory exists
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create directory: %w", err)
	}

	// Create destination file
	dst, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	// Copy file content
	size, err := io.Copy(dst, file)
	if err != nil {
		// Clean up on error
		os.Remove(fullPath)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	return &FileInfo{
		Path:     relativePath,
		FileName: fileHeader.Filename,
		Size:     size,
		MimeType: mimeType,
	}, nil
}

// DeleteFile removes a file from storage
func (s *StorageService) DeleteFile(relativePath string) error {
	if relativePath == "" {
		return nil // Nothing to delete
	}

	fullPath := filepath.Join(s.config.BasePath, relativePath)

	// Check if file exists
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return nil // File doesn't exist, nothing to do
	}

	// Delete the file
	if err := os.Remove(fullPath); err != nil {
		return fmt.Errorf("failed to delete file %s: %w", relativePath, err)
	}

	return nil
}

// GetFilePath returns the absolute path for a relative storage path
func (s *StorageService) GetFilePath(relativePath string) string {
	return filepath.Join(s.config.BasePath, relativePath)
}

// GetFileURL returns a URL path for serving the file (for future use)
func (s *StorageService) GetFileURL(relativePath string) string {
	// For now, return the relative path which can be served via /storage endpoint
	return filepath.ToSlash(relativePath)
}

// Helper function to get file extension from MIME type
func getExtensionFromMimeType(mimeType string) string {
	extensions := map[string]string{
		"audio/mpeg":  ".mp3",
		"audio/wav":   ".wav",
		"audio/x-wav": ".wav",
		"audio/flac":  ".flac",
		"audio/ogg":   ".ogg",
		"audio/aac":   ".aac",
		"audio/x-m4a": ".m4a",
		"audio/mp4":   ".m4a",
		"image/jpeg":  ".jpg",
		"image/jpg":   ".jpg",
		"image/png":   ".png",
		"image/webp":  ".webp",
	}

	if ext, ok := extensions[strings.ToLower(mimeType)]; ok {
		return ext
	}

	return "" // No extension found
}
