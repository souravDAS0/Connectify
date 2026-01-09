import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:just_audio/just_audio.dart';
import '../../../authentication/presentation/providers/auth_provider.dart';
import 'websocket_provider.dart';
import 'player_controller.dart';
import '../../application/audio_player_service.dart';

/// Manager that initializes WebSocket based on auth state and handles remote control
final websocketManagerProvider = Provider<WebSocketManager>((ref) {
  final manager = WebSocketManager(ref);
  return manager;
});

class WebSocketManager {
  final Ref _ref;
  StreamSubscription? _messageSubscription;
  StreamSubscription? _playbackStateSubscription;
  ProviderSubscription? _authSubscription;
  bool _isInitialized = false;

  WebSocketManager(this._ref) {
    _init();
  }

  void _init() {
    // Listen to auth state changes
    _authSubscription = _ref.listen(authNotifierProvider, (previous, next) {
      next.when(
        authenticated: (_) async {
          await _initializeWebSocket();
        },
        unauthenticated: () {
          _cleanup();
        },
        initial: () {},
        loading: () {},
        error: (_) {
          _cleanup();
        },
      );
    });

    // Check current auth state
    final authState = _ref.read(authNotifierProvider);
    authState.whenOrNull(
      authenticated: (_) async {
        await _initializeWebSocket();
      },
    );
  }

  Future<void> _initializeWebSocket() async {
    if (_isInitialized) return;

    try {
      final supabase = Supabase.instance.client;
      final session = supabase.auth.currentSession;

      if (session?.accessToken == null) {
        debugPrint('No access token available');
        return;
      }

      final wsService = _ref.read(webSocketServiceProvider);
      await wsService.initialize(session!.accessToken);

      _isInitialized = true;
      _setupMessageListeners();

      debugPrint('WebSocket initialized successfully');
    } catch (e) {
      debugPrint('Error initializing WebSocket: $e');
    }
  }

  void _setupMessageListeners() {
    final wsService = _ref.read(webSocketServiceProvider);
    final playerController = _ref.read(playerControllerProvider.notifier);
    final audioService = _ref.read(audioPlayerServiceProvider);

    // Listen to WebSocket messages for remote control
    _messageSubscription = wsService.messageStream.listen((message) {
      debugPrint('Received WebSocket message: ${message.type}');

      switch (message.type) {
        case 'control:play':
          _handlePlayCommand(message.data);
          break;
        case 'control:pause':
          final isPlaying = _ref.read(playerControllerProvider).isPlaying;
          if (isPlaying) {
            playerController.togglePlayPause();
          }
          break;
        case 'control:next':
          playerController.nextTrack();
          break;
        case 'control:previous':
          playerController.prevTrack();
          break;
        case 'control:seek':
          final position = message.data['position'] as int?;
          if (position != null) {
            playerController.seek(Duration(milliseconds: position));
          }
          break;
        case 'control:shuffle':
          final shuffle = message.data['shuffle'] as bool?;
          if (shuffle != null) {
            playerController.toggleShuffle(shuffle);
          }
          break;
        case 'control:repeat':
          final mode = message.data['mode'] as String?;
          if (mode != null) {
            final loopMode = _getLoopMode(mode);
            playerController.setRepeatMode(loopMode);
          }
          break;
      }
    });

    // Listen to playback state sync
    _playbackStateSubscription = wsService.playbackStateStream.listen((
      playbackState,
    ) {
      debugPrint(
        'Received playback state sync: trackId=${playbackState.trackId}, playing=${playbackState.playing}',
      );

      // Always update the UI to show what's playing (even if on another device)
      if (playbackState.trackId != null) {
        final currentTrack = _ref.read(playerControllerProvider).currentTrack;
        final tracks = _ref.read(playerControllerProvider).tracks;

        // If different track, update the UI
        if (currentTrack?.id != playbackState.trackId) {
          final track = tracks.cast<dynamic>().firstWhere(
            (t) => t.id == playbackState.trackId,
            orElse: () => null,
          );

          if (track != null) {
            // Update the player state to show the current track (without triggering WebSocket update)
            final playerState = _ref.read(playerControllerProvider);
            _ref
                .read(playerControllerProvider.notifier)
                .updateStateFromWebSocket(
                  playerState.copyWith(currentTrack: track),
                );
          }
        }
      }

      // Check if this device is the active device
      final isCurrentDeviceActive = _ref.read(isCurrentDeviceActiveProvider);

      if (isCurrentDeviceActive) {
        // This device should be playing audio
        if (playbackState.trackId != null) {
          final currentTrack = _ref.read(playerControllerProvider).currentTrack;

          // If different track, load and play it
          if (currentTrack?.id != playbackState.trackId) {
            final tracks = _ref.read(playerControllerProvider).tracks;
            final track = tracks.cast<dynamic>().firstWhere(
              (t) => t.id == playbackState.trackId,
              orElse: () => null,
            );

            if (track != null) {
              playerController.playTrack(track);
            }
          }

          // Sync position if there's significant drift
          if (playbackState.position != null) {
            final currentPosition = audioService.audioPlayer.position;
            final targetPosition = Duration(
              milliseconds: playbackState.position!,
            );
            final drift = (currentPosition - targetPosition).abs();

            if (drift > const Duration(seconds: 2)) {
              playerController.seek(targetPosition);
            }
          }

          // Sync play state
          if (playbackState.playing != null) {
            final isPlaying = _ref.read(playerControllerProvider).isPlaying;
            if (isPlaying != playbackState.playing) {
              playerController.togglePlayPause();
            }
          }
        }
      } else {
        // This device is not active, just update UI but don't play audio
        final playerState = _ref.read(playerControllerProvider);

        // Update UI state (playing status and position) without triggering WebSocket update
        _ref
            .read(playerControllerProvider.notifier)
            .updateStateFromWebSocket(
              playerState.copyWith(
                isPlaying: playbackState.playing ?? playerState.isPlaying,
                position: playbackState.position != null
                    ? Duration(milliseconds: playbackState.position!)
                    : playerState.position,
              ),
            );

        // Make sure audio is paused on this device
        final audioPlayerIsPlaying = audioService.audioPlayer.playing;
        if (audioPlayerIsPlaying) {
          audioService.pause();
        }
      }
    });
  }

  void _handlePlayCommand(Map<String, dynamic> data) {
    debugPrint('[WebSocketManager] Received control:play');
    final trackId = data['track_id'] as String?;
    final playerController = _ref.read(playerControllerProvider.notifier);
    final audioService = _ref.read(audioPlayerServiceProvider);

    if (trackId != null) {
      // Find and play the track
      final tracks = _ref.read(playerControllerProvider).tracks;
      final track = tracks.firstWhere(
        (t) => t.id == trackId,
        orElse: () => tracks.first,
      );
      debugPrint('[WebSocketManager] Playing track: ${track.title}');
      playerController.playTrack(track);
    } else {
      // Resume playback - check actual audio player state, not UI state
      final audioPlayerIsPlaying = audioService.audioPlayer.playing;
      debugPrint(
        '[WebSocketManager] Resume playback, currently playing: $audioPlayerIsPlaying',
      );
      if (!audioPlayerIsPlaying) {
        debugPrint('[WebSocketManager] Starting playback...');
        audioService.play();
        // Update UI state
        final playerState = _ref.read(playerControllerProvider);
        playerController.updateStateFromWebSocket(
          playerState.copyWith(isPlaying: true),
        );
      }
    }
  }

  LoopMode _getLoopMode(String mode) {
    switch (mode) {
      case 'one':
        return LoopMode.one;
      case 'all':
        return LoopMode.all;
      default:
        return LoopMode.off;
    }
  }

  void _cleanup() {
    _messageSubscription?.cancel();
    _playbackStateSubscription?.cancel();
    _isInitialized = false;
    debugPrint('WebSocket cleaned up');
  }

  void dispose() {
    _cleanup();
    _authSubscription?.close();
  }
}
