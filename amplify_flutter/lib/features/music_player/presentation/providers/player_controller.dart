import 'dart:async';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:amplify_flutter/features/music_player/domain/models/track.dart';
import 'package:amplify_flutter/features/music_player/application/audio_player_service.dart';
import 'package:amplify_flutter/features/music_player/data/repositories/music_repository.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:just_audio/just_audio.dart' as ja;

part 'player_controller.g.dart';
part 'player_controller.freezed.dart';

@Riverpod(keepAlive: true)
class PlayerController extends _$PlayerController {
  StreamSubscription<ja.PlayerState>? _playerStateSubscription;
  StreamSubscription<int?>? _currentIndexSubscription;

  @override
  PlayerState build() {
    _listenToPlayerState();
    return PlayerState.initial();
  }

  AudioPlayerService get _audioService => ref.read(audioPlayerServiceProvider);
  MusicRepository get _musicRepository => ref.read(musicRepositoryProvider);

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
    }
  }

  Future<void> togglePlayPause() async {
    if (state.isPlaying) {
      state = state.copyWith(isPlaying: false);
      await _audioService.pause();
    } else {
      state = state.copyWith(isPlaying: true);
      await _audioService.play();
    }
  }

  Future<void> stop() async {
    await _audioService.stop();
    state = state.copyWith(isPlaying: false, currentTrack: null);
  }

  Future<void> nextTrack() async {
    await _audioService.next();
    // State will be updated by currentIndexStream listener
  }

  Future<void> prevTrack() async {
    await _audioService.previous();
    // State will be updated by currentIndexStream listener
  }

  Future<void> seek(Duration position) async {
    await _audioService.seek(position);
  }

  // @override
  // void dispose() {
  //   _playerStateSubscription?.cancel();
  //   _currentIndexSubscription?.cancel();
  //   super.dispose();
  // }
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
  }) = _PlayerState;

  factory PlayerState.initial() => const PlayerState();
}
