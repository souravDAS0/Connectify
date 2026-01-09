import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:amplify_flutter/features/music_player/domain/models/track.dart';
import 'package:amplify_flutter/features/music_player/application/audio_player_service.dart';
import 'package:amplify_flutter/features/music_player/data/repositories/music_repository.dart';
import 'package:amplify_flutter/features/authentication/presentation/providers/auth_provider.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/websocket_provider.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:just_audio/just_audio.dart' as ja;

part 'player_controller.g.dart';
part 'player_controller.freezed.dart';

@Riverpod(keepAlive: true)
class PlayerController extends _$PlayerController {
  StreamSubscription<ja.PlayerState>? _playerStateSubscription;
  StreamSubscription<int?>? _currentIndexSubscription;
  bool _suppressWebSocketUpdate = false;

  @override
  PlayerState build() {
    _listenToPlayerState();
    return PlayerState.initial();
  }

  AudioPlayerService get _audioService => ref.read(audioPlayerServiceProvider);
  MusicRepository get _musicRepository => ref.read(musicRepositoryProvider);

  // Helper to check if WebSocket should be used
  bool get _shouldSyncToWebSocket {
    if (_suppressWebSocketUpdate) return false;

    final authState = ref.read(authNotifierProvider);
    return authState.maybeWhen(authenticated: (_) => true, orElse: () => false);
  }

  // Helper to send WebSocket updates
  void _sendPlaybackUpdate() {
    if (!_shouldSyncToWebSocket) {
      debugPrint('[PlaybackSync] Skipping WebSocket update: not syncing');
      return;
    }

    try {
      final wsService = ref.read(webSocketServiceProvider);

      if (!wsService.isConnected) {
        debugPrint(
          '[PlaybackSync] Cannot send update: WebSocket not connected',
        );
        return;
      }

      final currentTrack = state.currentTrack;

      if (currentTrack != null) {
        final position = _audioService.audioPlayer.position;
        debugPrint(
          '[PlaybackSync] Sending update: track=${currentTrack.title}, position=${position.inSeconds}s, playing=${state.isPlaying}',
        );
        wsService.updatePlayback(
          trackId: currentTrack.id,
          position: position.inMilliseconds,
          playing: state.isPlaying,
        );
      } else {
        debugPrint('[PlaybackSync] No current track to sync');
      }
    } catch (e) {
      debugPrint('[PlaybackSync] Error sending update: $e');
    }
  }

  // Update state without triggering WebSocket updates
  void updateStateFromWebSocket(PlayerState newState) {
    _suppressWebSocketUpdate = true;
    state = newState;
    _suppressWebSocketUpdate = false;
  }

  // Listen to audio player state for notification control synchronization
  void _listenToPlayerState() {
    _playerStateSubscription = _audioService.playerStateStream.listen((
      playerState,
    ) {
      final isPlaying = playerState.playing;
      if (state.isPlaying != isPlaying) {
        state = state.copyWith(isPlaying: isPlaying);
      }
    });

    _currentIndexSubscription = _audioService.currentIndexStream.listen((
      index,
    ) {
      if (index != null &&
          state.tracks.isNotEmpty &&
          index < state.tracks.length) {
        final newTrack = state.tracks[index];
        if (state.currentTrack?.id != newTrack.id) {
          state = state.copyWith(currentTrack: newTrack);
        }
      }
    });
  }

  Future<void> loadTracks() async {
    state = state.copyWith(isLoading: true);
    try {
      final tracks = await _musicRepository.getTracks();
      state = state.copyWith(tracks: tracks, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> playTrack(Track track) async {
    // If track is in the list, set it as current source
    final tracks = state.tracks;
    final index = tracks.indexWhere((t) => t.id == track.id);

    if (index != -1) {
      state = state.copyWith(currentTrack: track, isPlaying: true);
      await _audioService.setPlaylist(tracks, initialIndex: index);
      await _audioService.play();

      // Send WebSocket update
      _sendPlaybackUpdate();
    }
  }

  Future<void> togglePlayPause() async {
    debugPrint(
      '[PlayerController] togglePlayPause called, current: ${state.isPlaying}',
    );

    if (state.isPlaying) {
      state = state.copyWith(isPlaying: false);
      debugPrint('[PlayerController] Pausing audio...');
      await _audioService.pause();
    } else {
      state = state.copyWith(isPlaying: true);
      debugPrint('[PlayerController] Playing audio...');
      await _audioService.play();
    }

    debugPrint(
      '[PlayerController] After toggle, isPlaying: ${state.isPlaying}',
    );
    // Send WebSocket update
    _sendPlaybackUpdate();
  }

  Future<void> stop() async {
    await _audioService.stop();
    state = state.copyWith(isPlaying: false, currentTrack: null);
  }

  Future<void> nextTrack() async {
    await _audioService.next();
    // State will be updated by currentIndexStream listener

    // Send WebSocket update after a short delay to allow track to change
    Future.delayed(const Duration(milliseconds: 200), () {
      _sendPlaybackUpdate();
    });
  }

  Future<void> prevTrack() async {
    await _audioService.previous();
    // State will be updated by currentIndexStream listener

    // Send WebSocket update after a short delay to allow track to change
    Future.delayed(const Duration(milliseconds: 200), () {
      _sendPlaybackUpdate();
    });
  }

  Future<void> seek(Duration position) async {
    await _audioService.seek(position);

    // Send WebSocket update
    _sendPlaybackUpdate();
  }

  Future<void> toggleShuffle(bool enabled) async {
    await _audioService.setShuffleMode(enabled);
    state = state.copyWith(isShuffleEnabled: enabled);

    // Send WebSocket update for shuffle
    if (_shouldSyncToWebSocket) {
      try {
        final wsService = ref.read(webSocketServiceProvider);
        wsService.toggleShuffle(enabled);
      } catch (e) {
        // Ignore WebSocket errors
      }
    }
  }

  Future<void> setRepeatMode(ja.LoopMode mode) async {
    await _audioService.setLoopMode(mode);
    state = state.copyWith(repeatMode: mode);

    // Send WebSocket update for repeat
    if (_shouldSyncToWebSocket) {
      try {
        final wsService = ref.read(webSocketServiceProvider);
        String repeatMode = 'off';
        if (mode == ja.LoopMode.all) {
          repeatMode = 'all';
        } else if (mode == ja.LoopMode.one) {
          repeatMode = 'one';
        }
        wsService.toggleRepeat(repeatMode);
      } catch (e) {
        // Ignore WebSocket errors
      }
    }
  }
}

@freezed
class PlayerState with _$PlayerState {
  const factory PlayerState({
    @Default([]) List<Track> tracks,
    Track? currentTrack,
    @Default(false) bool isPlaying,
    @Default(false) bool isLoading,
    String? error,
    @Default(Duration.zero) Duration position,
    @Default(Duration.zero) Duration duration,
    @Default(false) bool isShuffleEnabled,
    @Default(ja.LoopMode.off) ja.LoopMode repeatMode,
  }) = _PlayerState;

  factory PlayerState.initial() => const PlayerState();
}
