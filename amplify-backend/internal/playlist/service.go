package playlist

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type PlaylistService struct {
	PlaylistCollection *mongo.Collection
}

func NewPlaylistService(db *mongo.Database) *PlaylistService {
	return &PlaylistService{
		PlaylistCollection: db.Collection("playlists"),
	}
}

// CreatePlaylist creates a new playlist
func (s *PlaylistService) CreatePlaylist(p Playlist) (*Playlist, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Set timestamps
	now := time.Now()
	p.CreatedAt = now
	p.UpdatedAt = now

	// Initialize TrackIDs if nil
	if p.TrackIDs == nil {
		p.TrackIDs = []primitive.ObjectID{}
	}

	res, err := s.PlaylistCollection.InsertOne(ctx, p)
	if err != nil {
		return nil, err
	}

	p.ID = res.InsertedID.(primitive.ObjectID)
	return &p, nil
}

// GetAllPlaylists returns all playlists
func (s *PlaylistService) GetAllPlaylists() ([]Playlist, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := s.PlaylistCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var playlists []Playlist
	if err := cursor.All(ctx, &playlists); err != nil {
		return nil, err
	}

	return playlists, nil
}

// GetPlaylistByID retrieves a single playlist by ID
func (s *PlaylistService) GetPlaylistByID(id string) (*Playlist, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var playlist Playlist
	err = s.PlaylistCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&playlist)
	if err != nil {
		return nil, err
	}

	return &playlist, nil
}

// UpdatePlaylist updates playlist metadata
func (s *PlaylistService) UpdatePlaylist(id string, updates bson.M) (*Playlist, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updates["updated_at"] = time.Now()

	_, err = s.PlaylistCollection.UpdateOne(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": updates},
	)
	if err != nil {
		return nil, err
	}

	return s.GetPlaylistByID(id)
}

// DeletePlaylist removes a playlist
func (s *PlaylistService) DeletePlaylist(id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = s.PlaylistCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	return err
}

// AddTrackToPlaylist adds a track to the playlist's track array
func (s *PlaylistService) AddTrackToPlaylist(playlistID, trackID string) error {
	playlistObjID, err := primitive.ObjectIDFromHex(playlistID)
	if err != nil {
		return err
	}

	trackObjID, err := primitive.ObjectIDFromHex(trackID)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = s.PlaylistCollection.UpdateOne(
		ctx,
		bson.M{"_id": playlistObjID},
		bson.M{
			"$addToSet": bson.M{"track_ids": trackObjID}, // addToSet prevents duplicates
			"$set":      bson.M{"updated_at": time.Now()},
		},
	)

	return err
}

// RemoveTrackFromPlaylist removes a track from the playlist
func (s *PlaylistService) RemoveTrackFromPlaylist(playlistID, trackID string) error {
	playlistObjID, err := primitive.ObjectIDFromHex(playlistID)
	if err != nil {
		return err
	}

	trackObjID, err := primitive.ObjectIDFromHex(trackID)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = s.PlaylistCollection.UpdateOne(
		ctx,
		bson.M{"_id": playlistObjID},
		bson.M{
			"$pull": bson.M{"track_ids": trackObjID},
			"$set":  bson.M{"updated_at": time.Now()},
		},
	)

	return err
}

// GetTotalPlaylistCount returns the total number of playlists
func (s *PlaylistService) GetTotalPlaylistCount() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := s.PlaylistCollection.CountDocuments(ctx, bson.M{})
	return count, err
}
