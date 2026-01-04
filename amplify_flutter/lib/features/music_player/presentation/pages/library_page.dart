import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/player_controller.dart';
import 'package:amplify_flutter/features/music_player/presentation/widgets/track_list_item.dart';
import 'package:amplify_flutter/features/music_player/presentation/widgets/mini_player.dart';

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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Library'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Stack(
        children: [
          if (playerState.isLoading)
            const Center(child: CircularProgressIndicator())
          else if (playerState.error != null)
            Center(child: Text('Error: ${playerState.error}'))
          else if (playerState.tracks.isEmpty)
            const Center(child: Text('No tracks found'))
          else
            ListView.builder(
              padding: const EdgeInsets.only(
                bottom: 100,
              ), // Space for MiniPlayer
              itemCount: playerState.tracks.length,
              itemBuilder: (context, index) {
                final track = playerState.tracks[index];
                return TrackListItem(
                  track: track,
                  onTap: () {
                    ref
                        .read(playerControllerProvider.notifier)
                        .playTrack(track);
                  },
                );
              },
            ),

          if (playerState.currentTrack != null)
            const Positioned(left: 0, right: 0, bottom: 0, child: MiniPlayer()),
        ],
      ),
    );
  }
}
