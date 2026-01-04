package storage

import (
	"context"
	"fmt"
	"mime/multipart"
	"path/filepath"
	"strings"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/google/uuid"
)

type CloudinaryService struct {
	cld    *cloudinary.Cloudinary
	config *StorageConfig
}

func NewCloudinaryService(cloudName, apiKey, apiSecret string, config *StorageConfig) (*CloudinaryService, error) {
	cld, err := cloudinary.NewFromParams(cloudName, apiKey, apiSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Cloudinary: %w", err)
	}

	return &CloudinaryService{
		cld:    cld,
		config: config,
	}, nil
}

// SaveAudioFile uploads an audio file to Cloudinary and returns storage info
func (s *CloudinaryService) SaveAudioFile(fileHeader *multipart.FileHeader) (*FileInfo, error) {
	// Validate file size
	if fileHeader.Size > s.config.MaxFileSize {
		return nil, fmt.Errorf("file size %d exceeds maximum allowed size %d", fileHeader.Size, s.config.MaxFileSize)
	}

	// Validate MIME type
	mimeType := fileHeader.Header.Get("Content-Type")
	if !s.config.IsAudioTypeAllowed(mimeType) {
		return nil, fmt.Errorf("file type %s is not allowed", mimeType)
	}

	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	// Generate unique public ID
	ext := filepath.Ext(fileHeader.Filename)
	publicID := "amplify/audio/" + uuid.New().String()

	// Upload to Cloudinary
	ctx := context.Background()
	uploadResult, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID:     publicID,
		ResourceType: "video", // Cloudinary uses "video" for audio files
		Format:       strings.TrimPrefix(ext, "."),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to upload to Cloudinary: %w", err)
	}

	return &FileInfo{
		Path:     uploadResult.PublicID, // Store Cloudinary public ID
		FileName: fileHeader.Filename,
		Size:     fileHeader.Size,
		MimeType: mimeType,
	}, nil
}

// SaveAlbumArt uploads an album artwork image to Cloudinary and returns storage info
func (s *CloudinaryService) SaveAlbumArt(fileHeader *multipart.FileHeader) (*FileInfo, error) {
	// Validate file size (10MB for images)
	maxImageSize := int64(10 * 1024 * 1024)
	if fileHeader.Size > maxImageSize {
		return nil, fmt.Errorf("image size %d exceeds maximum allowed size %d", fileHeader.Size, maxImageSize)
	}

	// Validate MIME type
	mimeType := fileHeader.Header.Get("Content-Type")
	if !s.config.IsImageTypeAllowed(mimeType) {
		return nil, fmt.Errorf("image type %s is not allowed", mimeType)
	}

	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	// Generate unique public ID
	publicID := "amplify/album-art/" + uuid.New().String()

	// Upload to Cloudinary
	ctx := context.Background()
	uploadResult, err := s.cld.Upload.Upload(ctx, file, uploader.UploadParams{
		PublicID:     publicID,
		ResourceType: "image",
	})

	if err != nil {
		return nil, fmt.Errorf("failed to upload to Cloudinary: %w", err)
	}

	return &FileInfo{
		Path:     uploadResult.PublicID,
		FileName: fileHeader.Filename,
		Size:     fileHeader.Size,
		MimeType: mimeType,
	}, nil
}

// DeleteFile removes a file from Cloudinary
func (s *CloudinaryService) DeleteFile(publicID string) error {
	if publicID == "" {
		return nil // Nothing to delete
	}

	ctx := context.Background()

	// Determine resource type from public ID
	resourceType := "video" // Default for audio
	if strings.HasPrefix(publicID, "amplify/album-art/") {
		resourceType = "image"
	}

	_, err := s.cld.Upload.Destroy(ctx, uploader.DestroyParams{
		PublicID:     publicID,
		ResourceType: resourceType,
	})

	if err != nil {
		return fmt.Errorf("failed to delete from Cloudinary: %w", err)
	}

	return nil
}

// GetFilePath returns the Cloudinary URL for the resource
func (s *CloudinaryService) GetFilePath(publicID string) string {
	// For audio files, return the secure URL
	if strings.HasPrefix(publicID, "amplify/audio/") {
		asset, err := s.cld.Video(publicID)
		if err != nil {
			return ""
		}
		url, _ := asset.String()
		return url
	}

	// For images
	asset, err := s.cld.Image(publicID)
	if err != nil {
		return ""
	}
	url, _ := asset.String()
	return url
}

// GetFileURL returns a URL path for serving the file
func (s *CloudinaryService) GetFileURL(publicID string) string {
	return s.GetFilePath(publicID)
}
