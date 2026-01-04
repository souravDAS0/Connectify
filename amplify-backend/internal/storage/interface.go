package storage

import "mime/multipart"

// StorageProvider defines the interface for storage services
// Both local filesystem and cloud storage (Cloudinary) implement this interface
type StorageProvider interface {
	SaveAudioFile(*multipart.FileHeader) (*FileInfo, error)
	SaveAlbumArt(*multipart.FileHeader) (*FileInfo, error)
	DeleteFile(string) error
	GetFilePath(string) string
	GetFileURL(string) string
}

type FileInfo struct {
	Path     string // Relative path from storage base
	FileName string // Original filename
	Size     int64
	MimeType string
}

type StorageService struct {
	config *StorageConfig
}
