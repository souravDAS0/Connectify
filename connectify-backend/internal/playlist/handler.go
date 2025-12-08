package playlist

import (
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
)

func RegisterRoutes(app *fiber.App, service *PlaylistService) {
	// Create playlist
	app.Post("/playlists", func(c *fiber.Ctx) error {
		var playlist Playlist
		if err := c.BodyParser(&playlist); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid request",
			})
		}

		// Validate required fields
		if playlist.Name == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": "Playlist name is required",
			})
		}

		created, err := service.CreatePlaylist(playlist)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to create playlist",
			})
		}

		return c.Status(201).JSON(created)
	})

	// Get all playlists
	app.Get("/playlists", func(c *fiber.Ctx) error {
		playlists, err := service.GetAllPlaylists()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to get playlists",
			})
		}

		return c.JSON(playlists)
	})

	// Get single playlist
	app.Get("/playlists/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		playlist, err := service.GetPlaylistByID(id)
		if err != nil {
			return c.Status(404).JSON(fiber.Map{
				"error": "Playlist not found",
			})
		}

		return c.JSON(playlist)
	})

	// Update playlist
	app.Put("/playlists/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		var updates bson.M
		if err := c.BodyParser(&updates); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid request",
			})
		}

		// Don't allow updating system fields
		delete(updates, "_id")
		delete(updates, "id")
		delete(updates, "track_ids") // Use dedicated endpoints for managing tracks
		delete(updates, "created_at")

		updated, err := service.UpdatePlaylist(id, updates)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to update playlist",
			})
		}

		return c.JSON(updated)
	})

	// Delete playlist
	app.Delete("/playlists/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")

		if err := service.DeletePlaylist(id); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to delete playlist",
			})
		}

		return c.SendStatus(204)
	})

	// Add track to playlist
	app.Post("/playlists/:id/tracks", func(c *fiber.Ctx) error {
		playlistID := c.Params("id")

		var body struct {
			TrackID string `json:"track_id"`
		}

		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).JSON(fiber.Map{
				"error": "Invalid request",
			})
		}

		if body.TrackID == "" {
			return c.Status(400).JSON(fiber.Map{
				"error": "track_id is required",
			})
		}

		if err := service.AddTrackToPlaylist(playlistID, body.TrackID); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to add track to playlist",
			})
		}

		return c.SendStatus(204)
	})

	// Remove track from playlist
	app.Delete("/playlists/:id/tracks/:trackId", func(c *fiber.Ctx) error {
		playlistID := c.Params("id")
		trackID := c.Params("trackId")

		if err := service.RemoveTrackFromPlaylist(playlistID, trackID); err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "Failed to remove track from playlist",
			})
		}

		return c.SendStatus(204)
	})
}
