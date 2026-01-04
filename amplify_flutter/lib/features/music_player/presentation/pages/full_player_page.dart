import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/player_controller.dart';
import 'package:amplify_flutter/features/music_player/application/audio_player_service.dart';

class FullPlayerPage extends ConsumerWidget {
  const FullPlayerPage({super.key});

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    return "$twoDigitMinutes:$twoDigitSeconds";
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playerState = ref.watch(playerControllerProvider);
    final track = playerState.currentTrack;

    // Listen to audio service streams for real-time updates
    final audioService = ref.watch(audioPlayerServiceProvider);

    if (track == null)
      return const Scaffold(body: Center(child: Text("No track playing")));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.keyboard_arrow_down),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Now Playing'),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      extendBodyBehindAppBar: true,
      body: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.grey[900]!, Colors.black],
          ),
        ),
        child: Column(
          children: [
            const SizedBox(height: 100),
            // Album Art
            AspectRatio(
              aspectRatio: 1,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: track.albumArtUrl != null
                    ? CachedNetworkImage(
                        imageUrl: track.albumArtUrl!,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        color: Colors.grey[800],
                        child: const Icon(Icons.music_note, size: 80),
                      ),
              ),
            ),
            const SizedBox(height: 32),
            // Title & Artist
            Text(
              track.title,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Text(
              track.artist,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: Colors.grey),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            // Progress Bar
            StreamBuilder<Duration>(
              stream: audioService.positionStream,
              builder: (context, snapshot) {
                final position = snapshot.data ?? Duration.zero;
                final duration = Duration(
                  milliseconds: (track.duration * 1000).toInt(),
                );
                return Column(
                  children: [
                    Slider(
                      value: position.inMilliseconds.toDouble().clamp(
                        0,
                        duration.inMilliseconds.toDouble(),
                      ),
                      min: 0,
                      max: duration.inMilliseconds.toDouble(),
                      onChanged: (value) {
                        audioService.seek(
                          Duration(milliseconds: value.toInt()),
                        );
                      },
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(_formatDuration(position)),
                          Text(_formatDuration(duration)),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 16),
            // Controls
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  icon: const Icon(Icons.shuffle),
                  onPressed: () {
                    // TODO: Toggle shuffle
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.skip_previous, size: 36),
                  onPressed: () {
                    ref.read(playerControllerProvider.notifier).prevTrack();
                  },
                ),
                FloatingActionButton(
                  onPressed: () {
                    ref
                        .read(playerControllerProvider.notifier)
                        .togglePlayPause();
                  },
                  child: Icon(
                    playerState.isPlaying ? Icons.pause : Icons.play_arrow,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.skip_next, size: 36),
                  onPressed: () {
                    ref.read(playerControllerProvider.notifier).nextTrack();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.repeat),
                  onPressed: () {
                    // TODO: Toggle repeat
                  },
                ),
              ],
            ),
            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}
