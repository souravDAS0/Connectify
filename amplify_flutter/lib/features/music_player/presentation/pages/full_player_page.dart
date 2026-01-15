import 'package:amplify_flutter/core/constants/app_typography.dart';
import 'package:amplify_flutter/core/widgets/marquee_widget.dart';
import 'package:amplify_flutter/core/widgets/svg_icon.dart';
import 'package:amplify_flutter/features/authentication/presentation/providers/auth_provider.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/websocket_provider.dart';
import 'package:amplify_flutter/features/music_player/presentation/widgets/active_devices_bottom_sheet.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/player_controller.dart';
import 'package:amplify_flutter/features/music_player/application/audio_player_service.dart';
import 'package:just_audio/just_audio.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

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
    final authState = ref.watch(authNotifierProvider);
    final isConnected = ref.watch(webSocketServiceProvider).isConnected;

    // Listen to audio service streams for real-time updates
    final audioService = ref.watch(audioPlayerServiceProvider);

    if (track == null)
      return const Scaffold(body: Center(child: Text("No track playing")));

    // Check if user is authenticated
    final isAuthenticated = authState.maybeWhen(
      authenticated: (_) => true,
      orElse: () => false,
    );

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
        actions: [
          if (isAuthenticated) ...[
            InkWell(
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    LucideIcons.smartphone,
                    color: isConnected ? Colors.green : Colors.grey,
                  ),
                  // Connection indicator
                  if (isConnected)
                    Positioned(
                      right: -2,
                      top: -2,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: Colors.green,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF101826),
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  backgroundColor: Colors.transparent,
                  isScrollControlled: true,
                  builder: (context) => const ActiveDevicesBottomSheet(),
                );
              },
            ),
          ],
          const SizedBox(width: 16),
        ],
      ),
      extendBodyBehindAppBar: false,
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
            Hero(
              tag: track.id,
              child: AspectRatio(
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
            ),
            const SizedBox(height: 32),
            // Title & Artist
            SizedBox(
              width: double.maxFinite,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MarqueeWidget(
                    height: 35,
                    child: Text(
                      track.title,
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    track.artist,
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: Colors.grey),
                    textAlign: TextAlign.center,
                    maxLines: 1,
                  ),
                ],
              ),
            ),

            const Spacer(),
            // Progress Bar
            StreamBuilder<Duration>(
              stream: audioService.positionStream,
              builder: (context, snapshot) {
                // Use playerState.position when device is not active (watching other devices)
                // Use audioService position when device is active (playing locally)
                final isActiveDevice = ref.watch(isCurrentDeviceActiveProvider);
                final position = isActiveDevice
                    ? (snapshot.data ?? playerState.position)
                    : playerState.position;

                final duration = Duration(
                  milliseconds: (track.duration * 1000).toInt(),
                );
                return Column(
                  children: [
                    Slider(
                      padding: const EdgeInsets.all(0),
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
                      activeColor: const Color.fromARGB(255, 255, 255, 255),
                      inactiveColor: const Color.fromARGB(255, 44, 44, 44),
                      thumbColor: const Color.fromARGB(255, 255, 255, 255),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatDuration(position),
                          style: AppTypography.caption,
                        ),
                        Text(
                          _formatDuration(duration),
                          style: AppTypography.caption,
                        ),
                      ],
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
                Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    IconButton(
                      icon: Icon(
                        LucideIcons.shuffle,
                        color: playerState.isShuffleEnabled
                            ? Colors.green
                            : Colors.white,
                        size: 24,
                      ),
                      onPressed: () {
                        ref
                            .read(playerControllerProvider.notifier)
                            .toggleShuffle(!playerState.isShuffleEnabled);
                      },
                    ),
                    if (playerState.isShuffleEnabled)
                      Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: Colors.green,
                        ),
                      ),
                  ],
                ),
                IconButton(
                  icon: const Icon(LucideIcons.skipBack, size: 28),
                  onPressed: () {
                    ref.read(playerControllerProvider.notifier).prevTrack();
                  },
                ),
                FloatingActionButton(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  shape: CircleBorder(),
                  onPressed: () {
                    ref
                        .read(playerControllerProvider.notifier)
                        .togglePlayPause();
                  },
                  child: playerState.isPlaying
                      ? SvgIcon(
                          'assets/icons/pause_filled.svg',
                          color: Colors.black,
                        )
                      : SvgIcon(
                          'assets/icons/play_filled.svg',
                          color: Colors.black,
                        ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.skipForward, size: 28),
                  onPressed: () {
                    ref.read(playerControllerProvider.notifier).nextTrack();
                  },
                ),
                Column(
                  children: [
                    IconButton(
                      icon: Icon(
                        playerState.repeatMode == LoopMode.one
                            ? LucideIcons.repeat1
                            : LucideIcons.repeat,
                        color: playerState.repeatMode != LoopMode.off
                            ? Colors.green
                            : Colors.white,
                        size: 24,
                      ),
                      onPressed: () {
                        final nextMode = playerState.repeatMode == LoopMode.off
                            ? LoopMode.all
                            : playerState.repeatMode == LoopMode.all
                            ? LoopMode.one
                            : LoopMode.off;
                        ref
                            .read(playerControllerProvider.notifier)
                            .setRepeatMode(nextMode);
                      },
                    ),
                    if (playerState.repeatMode == LoopMode.one ||
                        playerState.repeatMode == LoopMode.all)
                      Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: Colors.green,
                        ),
                      ),
                  ],
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
