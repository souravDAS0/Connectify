class WebSocketMessage {
  final String type;
  final Map<String, dynamic> data;

  WebSocketMessage({
    required this.type,
    required this.data,
  });

  factory WebSocketMessage.fromJson(Map<String, dynamic> json) {
    return WebSocketMessage(
      type: json['type'] as String,
      data: json['data'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'data': data,
    };
  }
}

class PlaybackState {
  final String? trackId;
  final int? position;
  final bool? playing;
  final double? volume;
  final String? activeDeviceId;
  final bool? shuffle;
  final String? repeatMode;

  PlaybackState({
    this.trackId,
    this.position,
    this.playing,
    this.volume,
    this.activeDeviceId,
    this.shuffle,
    this.repeatMode,
  });

  factory PlaybackState.fromJson(Map<String, dynamic> json) {
    return PlaybackState(
      trackId: json['track_id'] as String?,
      position: json['position'] as int?,
      playing: json['playing'] as bool?,
      volume: (json['volume'] as num?)?.toDouble(),
      activeDeviceId: json['active_device_id'] as String?,
      shuffle: json['shuffle'] as bool?,
      repeatMode: json['repeat_mode'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (trackId != null) 'track_id': trackId,
      if (position != null) 'position': position,
      if (playing != null) 'playing': playing,
      if (volume != null) 'volume': volume,
      if (activeDeviceId != null) 'active_device_id': activeDeviceId,
      if (shuffle != null) 'shuffle': shuffle,
      if (repeatMode != null) 'repeat_mode': repeatMode,
    };
  }
}
