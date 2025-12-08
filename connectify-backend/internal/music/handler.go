package music

import (
	"connectify-backend/internal/storage"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

// AnalyticsServices holds references to services needed for analytics
type AnalyticsServices struct {
	MusicService    *MusicService
	PlaylistService interface {
		GetTotalPlaylistCount() (int64, error)
	}
	AuthService interface {
		GetTotalUserCount() (int64, error)
	}
}

func RegisterRoutes(app *fiber.App, service *MusicService, storageService *storage.StorageService) {
	RegisterRoutesWithAnalytics(app, service, storageService, nil)
}

func RegisterRoutesWithAnalytics(app *fiber.App, service *MusicService, storageService *storage.StorageService, analyticsServices *AnalyticsServices) {
	// Legacy endpoint for adding tracks with JSON (kept for backward compatibility)
	app.Post("/tracks", func(c *fiber.Ctx) error {
		var track Track
		if err := c.BodyParser(&track); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid request",
			})
		}

		// Set timestamps
		now := time.Now()
		track.CreatedAt = now
		track.UpdatedAt = now
		track.PlayCount = 0

		added, err := service.AddTrack(track)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to add track",
			})
		}

		return c.JSON(added)
	})

	// New file upload endpoint
	app.Post("/upload", func(c *fiber.Ctx) error {
		// Parse multipart form
		form, err := c.MultipartForm()
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid form data",
			})
		}

		// Get audio file
		audioFiles := form.File["audio"]
		if len(audioFiles) == 0 {
			return c.Status(400).JSON(fiber.Map{
				"error": "No audio file provided",
			})
		}
		audioFile := audioFiles[0]

		// Get optional album art
		var albumArtFile *multipart.FileHeader = nil
		if artFiles := form.File["album_art"]; len(artFiles) > 0 {
			albumArtFile = artFiles[0]
		}

		// Parse metadata from form values
		title := c.FormValue("title")
		artist := c.FormValue("artist")
		album := c.FormValue("album")
		genre := c.FormValue("genre")
		yearStr := c.FormValue("year")
		durationStr := c.FormValue("duration")

		// Validate required fields
		if title == "" || artist == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": "Title and artist are required",
			})
		}

		if durationStr == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": "Duration is required",
			})
		}

		// Parse duration
		duration, err := strconv.Atoi(durationStr)
		if err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid duration value",
			})
		}

		// Parse year (optional)
		var year int
		if yearStr != "" {
			year, _ = strconv.Atoi(yearStr)
		}

		// Save audio file
		audioInfo, err := storageService.SaveAudioFile(audioFile)
		if err != nil {
			log.Printf("Failed to save audio file: %v", err)
			return c.Status(500).JSON(fiber.Map{
				"error": fmt.Sprintf("Failed to save audio file: %v", err),
			})
		}

		// Save album art if provided
		var albumArtInfo *storage.FileInfo
		if albumArtFile != nil {
			albumArtInfo, err = storageService.SaveAlbumArt(albumArtFile)
			if err != nil {
				// Log error but don't fail - album art is optional
				log.Printf("Failed to save album art: %v", err)
			}
		}

		// Create track record
		now := time.Now()
		track := Track{
			Title:     title,
			Artist:    artist,
			Album:     album,
			Genre:     genre,
			Duration:  duration,
			Year:      year,
			FilePath:  audioInfo.Path,
			FileName:  audioInfo.FileName,
			FileSize:  audioInfo.Size,
			MimeType:  audioInfo.MimeType,
			CreatedAt: now,
			UpdatedAt: now,
			PlayCount: 0,
		}

		if albumArtInfo != nil {
			track.AlbumArtPath = albumArtInfo.Path
		}

		// Save to database
		saved, err := service.AddTrack(track)
		if err != nil {
			// Cleanup uploaded files on database error
			storageService.DeleteFile(audioInfo.Path)
			if albumArtInfo != nil {
				storageService.DeleteFile(albumArtInfo.Path)
			}
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to save track to database",
			})
		}

		return c.Status(201).JSON(saved)
	})

	// Get all tracks
	app.Get("/tracks", func(c *fiber.Ctx) error {
		tracks, err := service.GetAllTracks()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to get tracks",
			})
		}

		return c.JSON(tracks)
	})

	// Get single track by ID
	app.Get("/tracks/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		track, err := service.GetTrackByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error": "Track not found",
			})
		}

		return c.JSON(track)
	})

	// Update track metadata
	app.Put("/tracks/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		var updates bson.M
		if err := c.BodyParser(&updates); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid request",
			})
		}

		// Don't allow updating file paths or system fields
		delete(updates, "_id")
		delete(updates, "id")
		delete(updates, "file_path")
		delete(updates, "file_name")
		delete(updates, "file_size")
		delete(updates, "mime_type")
		delete(updates, "created_at")
		delete(updates, "play_count")
		delete(updates, "last_played")

		updated, err := service.UpdateTrack(id, updates)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to update track",
			})
		}

		return c.JSON(updated)
	})

	// Delete track
	app.Delete("/tracks/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		// Delete from database and get track info for file cleanup
		track, err := service.DeleteTrack(id)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to delete track",
			})
		}

		// Delete associated files
		if track.FilePath != "" {
			if err := storageService.DeleteFile(track.FilePath); err != nil {
				log.Printf("Failed to delete audio file: %v", err)
			}
		}

		if track.AlbumArtPath != "" {
			if err := storageService.DeleteFile(track.AlbumArtPath); err != nil {
				log.Printf("Failed to delete album art: %v", err)
			}
		}

		return c.SendStatus(204)
	})

	// Stream audio file with range request support
	app.Get("/stream/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		// Get track from database
		track, err := service.GetTrackByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error": "Track not found",
			})
		}

		// Determine file path
		var filePath string
		if track.FilePath != "" {
			filePath = storageService.GetFilePath(track.FilePath)
		} else if track.URL != "" {
			// For external URLs, redirect to the URL
			return c.Redirect(track.URL)
		} else {
			return c.Status(404).JSON(fiber.Map{
				"error": "No audio source available",
			})
		}

		// Check if file exists
		fileInfo, err := os.Stat(filePath)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error": "Audio file not found",
			})
		}

		fileSize := fileInfo.Size()

		// Set content type
		c.Set("Content-Type", track.MimeType)
		c.Set("Accept-Ranges", "bytes")

		// Handle range requests for seeking
		rangeHeader := c.Get("Range")
		if rangeHeader == "" {
			// No range request, send full file
			c.Set("Content-Length", fmt.Sprintf("%d", fileSize))
			return c.SendFile(filePath)
		}

		// Parse range header (format: "bytes=start-end")
		rangeHeader = strings.TrimPrefix(rangeHeader, "bytes=")
		rangeParts := strings.Split(rangeHeader, "-")
		if len(rangeParts) != 2 {
			return c.Status(416).JSON(fiber.Map{
				"error": "Invalid range",
			})
		}

		start, err := strconv.ParseInt(rangeParts[0], 10, 64)
		if err != nil || start < 0 || start >= fileSize {
			return c.Status(416).JSON(fiber.Map{
				"error": "Invalid range start",
			})
		}

		// End is optional
		var end int64
		if rangeParts[1] == "" {
			end = fileSize - 1
		} else {
			end, err = strconv.ParseInt(rangeParts[1], 10, 64)
			if err != nil || end >= fileSize {
				end = fileSize - 1
			}
		}

		if start > end {
			return c.Status(416).JSON(fiber.Map{
				"error": "Invalid range",
			})
		}

		contentLength := end - start + 1

		// Open file
		file, err := os.Open(filePath)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to open file",
			})
		}
		defer file.Close()

		// Seek to start position
		_, err = file.Seek(start, 0)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to seek file",
			})
		}

		// Set headers for partial content
		c.Status(206) // Partial Content
		c.Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
		c.Set("Content-Length", fmt.Sprintf("%d", contentLength))

		// Send the range of bytes
		limitedReader := io.LimitReader(file, contentLength)
		return c.SendStream(limitedReader)
	})

	// Get album art
	app.Get("/album-art/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		track, err := service.GetTrackByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error": "Track not found",
			})
		}

		if track.AlbumArtPath == "" {
			return c.Status(404).JSON(fiber.Map{
				"error": "No album art available",
			})
		}

		filePath := storageService.GetFilePath(track.AlbumArtPath)

		// Check if file exists
		if _, err := os.Stat(filePath); err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error": "Album art file not found",
			})
		}

		return c.SendFile(filePath)
	})

	// Record play event
	app.Post("/tracks/:id/play", func(c *fiber.Ctx) error {
		id := c.Params("id")

		if err := service.IncrementPlayCount(id); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to record play",
			})
		}

		return c.SendStatus(204)
	})

	// Analytics endpoints
	app.Get("/analytics/popular", func(c *fiber.Ctx) error {
		limit := 10 // Default limit
		if limitParam := c.Query("limit"); limitParam != "" {
			if parsedLimit, err := strconv.Atoi(limitParam); err == nil {
				limit = parsedLimit
			}
		}

		tracks, err := service.GetPopularTracks(limit)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to get popular tracks",
			})
		}

		return c.JSON(tracks)
	})

	app.Get("/analytics/recent", func(c *fiber.Ctx) error {
		limit := 10 // Default limit
		if limitParam := c.Query("limit"); limitParam != "" {
			if parsedLimit, err := strconv.Atoi(limitParam); err == nil {
				limit = parsedLimit
			}
		}

		tracks, err := service.GetRecentTracks(limit)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to get recent tracks",
			})
		}

		return c.JSON(tracks)
	})

	app.Get("/analytics/stats", func(c *fiber.Ctx) error {
		totalTracks, err := service.GetTotalTrackCount()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to get track count",
			})
		}

		totalPlays, err := service.GetTotalPlayCount()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to get play count",
			})
		}

		stats := fiber.Map{
			"total_tracks": totalTracks,
			"total_plays":  totalPlays,
		}

		// Add playlist and user counts if services are provided
		if analyticsServices != nil {
			if analyticsServices.PlaylistService != nil {
				if count, err := analyticsServices.PlaylistService.GetTotalPlaylistCount(); err == nil {
					stats["total_playlists"] = count
				}
			}
			if analyticsServices.AuthService != nil {
				if count, err := analyticsServices.AuthService.GetTotalUserCount(); err == nil {
					stats["total_users"] = count
				}
			}
		}

		return c.JSON(stats)
	})
}
