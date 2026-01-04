import 'package:amplify_flutter/core/constants/app_typography.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/player_controller.dart';
import 'package:amplify_flutter/features/music_player/presentation/widgets/track_grid_item.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class LibraryPage extends ConsumerStatefulWidget {
  const LibraryPage({super.key});

  @override
  ConsumerState<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends ConsumerState<LibraryPage> {
  @override
  void initState() {
    super.initState();
    // Load tracks when page initializes
    Future.microtask(
      () => ref.read(playerControllerProvider.notifier).loadTracks(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final playerState = ref.watch(playerControllerProvider);

    return Container(
      color: Colors.black,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Text('Our Library', style: AppTypography.headline2),
              ),
              if (playerState.isLoading)
                const Expanded(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (playerState.error != null)
                Expanded(
                  child: Center(child: Text('Error: ${playerState.error}')),
                )
              else if (playerState.tracks.isEmpty)
                const Expanded(child: Center(child: Text('No tracks found')))
              else
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.only(
                      bottom: 100,
                    ), // Space for MiniPlayer
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.75,
                        ),
                    itemCount: playerState.tracks.length,
                    itemBuilder: (context, index) {
                      final track = playerState.tracks[index];
                      return TrackGridItem(
                        track: track,
                        onTap: () {
                          ref
                              .read(playerControllerProvider.notifier)
                              .playTrack(track);
                        },
                      );
                    },
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
