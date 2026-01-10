import 'package:just_audio/just_audio.dart';
import 'package:audio_service/audio_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:amplify_flutter/features/music_player/domain/models/track.dart';
import 'package:amplify_flutter/core/config/app_config.dart';
import 'package:amplify_flutter/features/music_player/application/custom_audio_handler.dart';

final audioPlayerServiceProvider = Provider<AudioPlayerService>((ref) {
  final service = AudioPlayerService();
  return service;
});

class AudioPlayerService {
  final AudioPlayer _audioPlayer = AudioPlayer();
  CustomAudioHandler? _audioHandler;

  AudioPlayer get audioPlayer => _audioPlayer;
  CustomAudioHandler? get audioHandler => _audioHandler;

  Stream<PlayerState> get playerStateStream => _audioPlayer.playerStateStream;
  Stream<Duration> get positionStream => _audioPlayer.positionStream;
  Stream<Duration?> get durationStream => _audioPlayer.durationStream;
  Stream<int?> get currentIndexStream => _audioPlayer.currentIndexStream;

  Future<void> init() async {
    _audioHandler = await AudioService.init(
      builder: () => CustomAudioHandler(_audioPlayer),
      config: const AudioServiceConfig(
        androidNotificationChannelId: 'com.amplify.app.audio',
        androidNotificationChannelName: 'Audio Playback',
        androidNotificationChannelDescription: 'Playing music in the background',
        androidNotificationOngoing: false,
        androidShowNotificationBadge: false,
        androidNotificationIcon: 'drawable/ic_notification',
        androidStopForegroundOnPause: false,
      ),
    );
  }

  Future<void> setPlaylist(List<Track> tracks, {int initialIndex = 0}) async {
    // Get base URL from config
    final baseUrl = AppConfig.apiBaseUrl;

    // Create MediaItem list for audio handler
    final mediaItems = tracks.map((track) {
      return MediaItem(
        id: track.id,
        artist: track.artist,
        title: track.title,
        album: track.album,
        duration: Duration(milliseconds: (track.duration * 1000).toInt()),
        artUri: track.albumArtUrl != null
            ? Uri.parse(track.albumArtUrl!)
            : null,
      );
    }).toList();

    final playlist = ConcatenatingAudioSource(
      children: tracks.map((track) {
        return AudioSource.uri(
          Uri.parse('$baseUrl/stream/${track.id}'),
          tag: mediaItems.firstWhere((item) => item.id == track.id),
        );
      }).toList(),
    );

    // Set audio source first
    await _audioPlayer.setAudioSource(
      playlist,
      initialIndex: initialIndex,
      initialPosition: Duration.zero,
    );

    // Update audio handler queue and current media item after audio source is set
    if (_audioHandler != null) {
      _audioHandler!.queue.add(mediaItems);
      if (initialIndex >= 0 && initialIndex < mediaItems.length) {
        _audioHandler!.mediaItem.add(mediaItems[initialIndex]);
      }
    }
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

  Future<void> shutdown() async {
    try {
      await _audioPlayer.stop();
      await _audioPlayer.dispose();
    } catch (e) {
      // Ignore errors during shutdown
    }
  }

  void dispose() {
    _audioPlayer.dispose();
  }
}
