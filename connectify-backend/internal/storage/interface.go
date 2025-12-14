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
