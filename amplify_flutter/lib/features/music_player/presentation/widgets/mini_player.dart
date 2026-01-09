import 'package:amplify_flutter/features/music_player/application/audio_player_service.dart';
import 'package:amplify_flutter/features/music_player/presentation/pages/full_player_page.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/player_controller.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/websocket_provider.dart';
import 'package:amplify_flutter/features/music_player/presentation/widgets/active_devices_bottom_sheet.dart';
import 'package:amplify_flutter/features/authentication/presentation/providers/auth_provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class MiniPlayer extends ConsumerWidget {
  const MiniPlayer({super.key});

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String twoDigitMinutes = duration.inMinutes.remainder(60).toString();
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

    if (track == null) return const SizedBox.shrink();

    // Check if user is authenticated
    final isAuthenticated = authState.maybeWhen(
      authenticated: (_) => true,
      orElse: () => false,
    );

    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const FullPlayerPage(),
            fullscreenDialog: true,
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          // color: Colors.amberAccent,
          color: const Color(0xFF101826),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: track.albumArtUrl != null
                      ? CachedNetworkImage(
                          imageUrl: track.albumArtUrl!,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                        )
                      : Container(
                          width: 48,
                          height: 48,
                          color: Colors.grey[800],
                          child: const Icon(Icons.music_note),
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        track.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        track.artist,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  padding: EdgeInsets.all(12),
                  style: ButtonStyle(
                    backgroundColor: WidgetStatePropertyAll(Colors.white),
                    foregroundColor: WidgetStatePropertyAll(Colors.black),
                    shape: WidgetStatePropertyAll(
                      playerState.isPlaying
                          ? RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            )
                          : CircleBorder(),
                    ),
                  ),
                  icon: Icon(
                    playerState.isPlaying
                        ? LucideIcons.pause
                        : LucideIcons.play,
                    fill: 1,
                    color: Colors.black,
                  ),
                  onPressed: () {
                    ref
                        .read(playerControllerProvider.notifier)
                        .togglePlayPause();
                  },
                ),
                const SizedBox(width: 12),
                InkWell(
                  child: Icon(LucideIcons.skipForward, fill: 1),
                  onTap: () {
                    ref.read(playerControllerProvider.notifier).nextTrack();
                  },
                ),
                // Show active devices button only when authenticated
                if (isAuthenticated) ...[
                  const SizedBox(width: 12),
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
              ],
            ),
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
                return Padding(
                  padding: const EdgeInsets.only(top: 12.0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Slider(
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
                          activeColor: const Color.fromARGB(255, 44, 44, 44),
                          inactiveColor: const Color.fromARGB(255, 44, 44, 44),
                          thumbColor: const Color.fromARGB(255, 255, 255, 255),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.only(left: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(_formatDuration(position)),
                            Text(' / '),
                            Text(_formatDuration(duration)),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
