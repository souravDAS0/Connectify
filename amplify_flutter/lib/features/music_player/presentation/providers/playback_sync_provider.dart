import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'websocket_provider.dart';
import 'player_controller.dart';
import '../../application/audio_player_service.dart';

/// Provider that periodically syncs playback state to the server when this device is active
final playbackSyncProvider = Provider<PlaybackSyncService>((ref) {
  final service = PlaybackSyncService(ref);
  ref.onDispose(() => service.dispose());
  return service;
});

class PlaybackSyncService {
  final Ref _ref;
  Timer? _syncTimer;
  DateTime? _lastBroadcast;

  PlaybackSyncService(this._ref) {
    _init();
  }

  void _init() {
    // Start periodic sync timer (every 2 seconds for responsive position updates)
    _syncTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _syncPlayback();
    });
  }

  void _syncPlayback() {
    try {
      // Only sync if this device is active
      final isActiveDevice = _ref.read(isCurrentDeviceActiveProvider);
      if (!isActiveDevice) {
        return;
      }

      final playerState = _ref.read(playerControllerProvider);
      final audioService = _ref.read(audioPlayerServiceProvider);
      final wsService = _ref.read(webSocketServiceProvider);

      final currentTrack = playerState.currentTrack;
      if (currentTrack == null) {
        return;
      }

      // Get current position from audio player
      final position = audioService.audioPlayer.position;
      final isPlaying = playerState.isPlaying;

      // Send update every 2 seconds when playing
      final now = DateTime.now();
      final timeSinceLastBroadcast = _lastBroadcast != null
          ? now.difference(_lastBroadcast!).inMilliseconds
          : 2000;

      if (timeSinceLastBroadcast >= 2000) {
        wsService.updatePlayback(
          trackId: currentTrack.id,
          position: position.inMilliseconds,
          playing: isPlaying,
        );

        _lastBroadcast = now;
        debugPrint(
          '[PlaybackSync] Periodic sync: ${currentTrack.title} @ ${position.inSeconds}s, playing=$isPlaying',
        );
      }
    } catch (e) {
      debugPrint('[PlaybackSync] Error syncing playback: $e');
    }
  }

  void dispose() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }
}
