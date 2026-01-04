import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:amplify_flutter/features/music_player/domain/models/track.dart';
import 'package:amplify_flutter/core/config/app_config.dart';

final audioPlayerServiceProvider = Provider<AudioPlayerService>((ref) {
  return AudioPlayerService();
});

class AudioPlayerService {
  final AudioPlayer _audioPlayer = AudioPlayer();

  AudioPlayer get audioPlayer => _audioPlayer;

  Stream<PlayerState> get playerStateStream => _audioPlayer.playerStateStream;
  Stream<Duration> get positionStream => _audioPlayer.positionStream;
  Stream<Duration?> get durationStream => _audioPlayer.durationStream;
  Stream<int?> get currentIndexStream => _audioPlayer.currentIndexStream;

  Future<void> init() async {
    // Initialize background audio handled in main.dart usually,
    // but we can ensure pipeline is ready here.
  }

  Future<void> setPlaylist(List<Track> tracks, {int initialIndex = 0}) async {
    // Get base URL from config
    final baseUrl = AppConfig.apiBaseUrl;

    final playlist = ConcatenatingAudioSource(
      children: tracks.map((track) {
        return AudioSource.uri(
          Uri.parse('$baseUrl/stream/${track.id}'),
          tag: MediaItem(
            id: track.id,
            artist: track.artist,
            title: track.title,
            artUri: track.albumArtUrl != null
                ? Uri.parse(track.albumArtUrl!)
                : null,
          ),
        );
      }).toList(),
    );

    await _audioPlayer.setAudioSource(
      playlist,
      initialIndex: initialIndex,
      initialPosition: Duration.zero,
    );
  }

  Future<void> play() => _audioPlayer.play();
  Future<void> pause() => _audioPlayer.pause();
  Future<void> stop() => _audioPlayer.stop();
  Future<void> seek(Duration position) => _audioPlayer.seek(position);
  Future<void> next() => _audioPlayer.seekToNext();
  Future<void> previous() => _audioPlayer.seekToPrevious();

  Future<void> setShuffleMode(bool enabled) async {
    await _audioPlayer.setShuffleModeEnabled(enabled);
  }

  Future<void> setLoopMode(LoopMode mode) async {
    await _audioPlayer.setLoopMode(mode);
  }

  void dispose() {
    _audioPlayer.dispose();
  }
}
