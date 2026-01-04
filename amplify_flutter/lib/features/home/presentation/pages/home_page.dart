import 'package:amplify_flutter/core/widgets/custom_app_bar.dart';
import 'package:amplify_flutter/core/widgets/custom_tab_bar.dart';
import 'package:amplify_flutter/features/music_player/presentation/pages/library_page.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/player_controller.dart';
import 'package:amplify_flutter/features/music_player/presentation/widgets/mini_player.dart';
import 'package:amplify_flutter/features/playlists/presentation/pages/playlists_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playerState = ref.watch(playerControllerProvider);

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                const CustomAppBar(),
                Expanded(
                  child: CustomTabBar(
                    tabs: [
                      TabItem(label: 'Library', icon: LucideIcons.music),
                      TabItem(label: 'Playlists', icon: LucideIcons.listMusic),
                    ],
                    children: [LibraryPage(), PlaylistsPage()],
                  ),
                ),
              ],
            ),
            if (playerState.currentTrack != null)
              const Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: MiniPlayer(),
              ),
          ],
        ),
      ),
    );
  }
}
