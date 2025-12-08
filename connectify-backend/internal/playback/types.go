package playback

type PlaybackState struct {
	TrackID  string `json:"track_id"`
	Position int    `json:"position"` // milliseconds
	Playing  bool   `json:"playing"`
}
