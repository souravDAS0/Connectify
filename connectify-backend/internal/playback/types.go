package playback

type PlaybackState struct {
	TrackID        string  `json:"track_id"`
	Position       int     `json:"position"`
	Playing        bool    `json:"playing"`
	Volume         float64 `json:"volume,omitempty"`
	Shuffle        bool    `json:"shuffle,omitempty"`
	Repeat         string  `json:"repeat,omitempty"`
	ActiveDeviceID string  `json:"active_device_id,omitempty"`
}
