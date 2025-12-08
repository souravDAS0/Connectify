package music

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MusicService struct {
	TrackCollection *mongo.Collection
}

func NewMusicService(db *mongo.Database) *MusicService {
	return &MusicService{
		TrackCollection: db.Collection("tracks"),
	}
}

func (s *MusicService) AddTrack(t Track) (*Track, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := s.TrackCollection.InsertOne(ctx, t)
	if err != nil {
		return nil, err
	}
	t.ID = res.InsertedID.(primitive.ObjectID)
	return &t, nil
}

func (s *MusicService) GetAllTracks() ([]Track, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := s.TrackCollection.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tracks []Track
	if err := cursor.All(ctx, &tracks); err != nil {
		return nil, err
	}

	// Populate Album Art URL
	for i := range tracks {
		if tracks[i].AlbumArtPath != "" {
			tracks[i].AlbumArtURL = "/album-art/" + tracks[i].ID.Hex()
		}
	}

	return tracks, nil
}

// GetTrackByID retrieves a single track by ID
func (s *MusicService) GetTrackByID(id string) (*Track, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var track Track
	err = s.TrackCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&track)
	if err != nil {
		return nil, err
	}

	if track.AlbumArtPath != "" {
		track.AlbumArtURL = "/album-art/" + track.ID.Hex()
	}

	return &track, nil
}

// UpdateTrack updates track metadata
func (s *MusicService) UpdateTrack(id string, updates bson.M) (*Track, error) {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updates["updated_at"] = time.Now()

	_, err = s.TrackCollection.UpdateOne(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": updates},
	)
	if err != nil {
		return nil, err
	}

	// Note: GetTrackByID already populates AlbumArtURL
	return s.GetTrackByID(id)
}

// DeleteTrack removes track from DB and returns the track for file cleanup
func (s *MusicService) DeleteTrack(id string) (*Track, error) {
	// First get the track to return file paths for cleanup
	track, err := s.GetTrackByID(id)
	if err != nil {
		return nil, err
	}

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = s.TrackCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		return nil, err
	}

	return track, nil
}

// IncrementPlayCount increments play count and updates last played
func (s *MusicService) IncrementPlayCount(id string) error {
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	now := time.Now()
	_, err = s.TrackCollection.UpdateOne(
		ctx,
		bson.M{"_id": objectID},
		bson.M{
			"$inc": bson.M{"play_count": 1},
			"$set": bson.M{"last_played": now},
		},
	)
	return err
}

// GetPopularTracks returns most played tracks
func (s *MusicService) GetPopularTracks(limit int) ([]Track, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := s.TrackCollection.Find(
		ctx,
		bson.M{},
		options.Find().SetSort(bson.D{{Key: "play_count", Value: -1}}).SetLimit(int64(limit)),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tracks []Track
	if err := cursor.All(ctx, &tracks); err != nil {
		return nil, err
	}

	// Populate Album Art URL
	for i := range tracks {
		if tracks[i].AlbumArtPath != "" {
			tracks[i].AlbumArtURL = "/album-art/" + tracks[i].ID.Hex()
		}
	}

	return tracks, nil
}

// GetRecentTracks returns recently added tracks
func (s *MusicService) GetRecentTracks(limit int) ([]Track, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := s.TrackCollection.Find(
		ctx,
		bson.M{},
		options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}).SetLimit(int64(limit)),
	)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var tracks []Track
	if err := cursor.All(ctx, &tracks); err != nil {
		return nil, err
	}

	// Populate Album Art URL
	for i := range tracks {
		if tracks[i].AlbumArtPath != "" {
			tracks[i].AlbumArtURL = "/album-art/" + tracks[i].ID.Hex()
		}
	}

	return tracks, nil
}

// GetTotalTrackCount returns the total number of tracks
func (s *MusicService) GetTotalTrackCount() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := s.TrackCollection.CountDocuments(ctx, bson.M{})
	return count, err
}

// GetTotalPlayCount returns the sum of all play counts
func (s *MusicService) GetTotalPlayCount() (int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pipeline := []bson.M{
		{
			"$group": bson.M{
				"_id":   nil,
				"total": bson.M{"$sum": "$play_count"},
			},
		},
	}

	cursor, err := s.TrackCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return 0, err
	}
	defer cursor.Close(ctx)

	var result []struct {
		Total int64 `bson:"total"`
	}
	if err := cursor.All(ctx, &result); err != nil {
		return 0, err
	}

	if len(result) == 0 {
		return 0, nil
	}

	return result[0].Total, nil
}
