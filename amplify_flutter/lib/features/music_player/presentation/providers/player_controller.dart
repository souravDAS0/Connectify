import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:amplify_flutter/features/music_player/domain/models/track.dart';
import 'package:amplify_flutter/features/music_player/application/audio_player_service.dart';
import 'package:amplify_flutter/features/music_player/data/repositories/music_repository.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'player_controller.g.dart';
part 'player_controller.freezed.dart';

@Riverpod(keepAlive: true)
class PlayerController extends _$PlayerController {
  @override
  PlayerState build() {
    return PlayerState.initial();
  }

  AudioPlayerService get _audioService => ref.read(audioPlayerServiceProvider);
  MusicRepository get _musicRepository => ref.read(musicRepositoryProvider);

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
      await _audioService.pause();
      state = state.copyWith(isPlaying: false);
    } else {
      await _audioService.play();
      state = state.copyWith(isPlaying: true);
    }
  }

  Future<void> stop() async {
    await _audioService.stop();
    state = state.copyWith(isPlaying: false, currentTrack: null);
  }

  Future<void> nextTrack() async {
    // Basic implementation: find current index and increment
    final tracks = state.tracks;
    final current = state.currentTrack;
    if (current == null || tracks.isEmpty) return;

    final index = tracks.indexWhere((t) => t.id == current.id);
    if (index != -1 && index < tracks.length - 1) {
      await playTrack(tracks[index + 1]);
    }
  }

  Future<void> prevTrack() async {
    final tracks = state.tracks;
    final current = state.currentTrack;
    if (current == null || tracks.isEmpty) return;

    final index = tracks.indexWhere((t) => t.id == current.id);
    if (index > 0) {
      await playTrack(tracks[index - 1]);
    }
  }

  Future<void> seek(Duration position) async {
    await _audioService.seek(position);
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
  }) = _PlayerState;

  factory PlayerState.initial() => const PlayerState();
}
