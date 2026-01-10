import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';

class CustomAudioHandler extends BaseAudioHandler {
  final AudioPlayer _audioPlayer;

  CustomAudioHandler(this._audioPlayer) {
    _notifyAudioHandlerAboutPlaybackEvents();
    _listenForDurationChanges();
    _listenForCurrentSongIndexChanges();
  }

  void _notifyAudioHandlerAboutPlaybackEvents() {
    _audioPlayer.playbackEventStream.listen((PlaybackEvent event) {
      final playing = _audioPlayer.playing;

      // Build controls list dynamically based on available actions
      final controls = <MediaControl>[];

      // Only add previous if we actually have a previous track
      try {
        if (_audioPlayer.hasPrevious) {
          controls.add(MediaControl.skipToPrevious);
        }
      } catch (_) {}

      // Always add play/pause
      controls.add(playing ? MediaControl.pause : MediaControl.play);

      // Only add next if we actually have a next track
      try {
        if (_audioPlayer.hasNext) {
          controls.add(MediaControl.skipToNext);
        }
      } catch (_) {}

      // Build compact action indices based on how many controls we have
      final compactIndices = <int>[];
      for (int i = 0; i < controls.length && i < 3; i++) {
        compactIndices.add(i);
      }

      playbackState.add(playbackState.value.copyWith(
        controls: controls,
        systemActions: const {
          MediaAction.seek,
          MediaAction.seekForward,
          MediaAction.seekBackward,
        },
        androidCompactActionIndices: compactIndices,
        processingState: const {
          ProcessingState.idle: AudioProcessingState.idle,
          ProcessingState.loading: AudioProcessingState.loading,
          ProcessingState.buffering: AudioProcessingState.buffering,
          ProcessingState.ready: AudioProcessingState.ready,
          ProcessingState.completed: AudioProcessingState.completed,
        }[_audioPlayer.processingState]!,
        playing: playing,
        updatePosition: _audioPlayer.position,
        bufferedPosition: _audioPlayer.bufferedPosition,
        speed: _audioPlayer.speed,
        queueIndex: event.currentIndex,
      ));
    });
  }

  void _listenForDurationChanges() {
    _audioPlayer.durationStream.listen((duration) {
      var index = _audioPlayer.currentIndex;
      final newQueue = queue.value;
      if (index == null || newQueue.isEmpty) return;
      if (_audioPlayer.shuffleModeEnabled) {
        index = _audioPlayer.shuffleIndices![index];
      }
      final oldMediaItem = newQueue[index];
      final newMediaItem = oldMediaItem.copyWith(duration: duration);
      newQueue[index] = newMediaItem;
      queue.add(newQueue);
      mediaItem.add(newMediaItem);
    });
  }

  void _listenForCurrentSongIndexChanges() {
    _audioPlayer.currentIndexStream.listen((index) {
      final playlist = queue.value;
      if (index == null || playlist.isEmpty) return;

      int actualIndex = index;
      try {
        if (_audioPlayer.shuffleModeEnabled && _audioPlayer.shuffleIndices != null) {
          actualIndex = _audioPlayer.shuffleIndices![index];
        }
      } catch (_) {
        // Ignore shuffle index errors
      }

      if (actualIndex >= 0 && actualIndex < playlist.length) {
        mediaItem.add(playlist[actualIndex]);
      }
    });
  }

  @override
  Future<void> play() => _audioPlayer.play();

  @override
  Future<void> pause() => _audioPlayer.pause();

  @override
  Future<void> seek(Duration position) => _audioPlayer.seek(position);

  @override
  Future<void> skipToNext() => _audioPlayer.seekToNext();

  @override
  Future<void> skipToPrevious() => _audioPlayer.seekToPrevious();

  @override
  Future<void> skipToQueueItem(int index) async {
    if (index < 0 || index >= queue.value.length) return;
    if (_audioPlayer.shuffleModeEnabled) {
      index = _audioPlayer.shuffleIndices![index];
    }
    _audioPlayer.seek(Duration.zero, index: index);
  }

  @override
  Future<void> setShuffleMode(AudioServiceShuffleMode shuffleMode) async {
    final enabled = shuffleMode == AudioServiceShuffleMode.all;
    if (enabled) {
      await _audioPlayer.shuffle();
    }
    playbackState.add(playbackState.value.copyWith(shuffleMode: shuffleMode));
    await _audioPlayer.setShuffleModeEnabled(enabled);
  }

  @override
  Future<void> setRepeatMode(AudioServiceRepeatMode repeatMode) async {
    playbackState.add(playbackState.value.copyWith(repeatMode: repeatMode));
    await _audioPlayer.setLoopMode(LoopMode.values[repeatMode.index]);
  }

  @override
  Future<void> stop() async {
    await _audioPlayer.stop();
    await super.stop();
  }
}
