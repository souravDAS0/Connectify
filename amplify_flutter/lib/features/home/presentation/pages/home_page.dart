import 'package:amplify_flutter/core/widgets/custom_app_bar.dart';
import 'package:amplify_flutter/core/widgets/custom_tab_bar.dart';
import 'package:amplify_flutter/features/authentication/presentation/providers/auth_provider.dart';
import 'package:amplify_flutter/features/music_player/presentation/pages/library_page.dart';
import 'package:amplify_flutter/features/music_player/presentation/providers/player_controller.dart';
import 'package:amplify_flutter/features/music_player/presentation/widgets/mini_player.dart';
import 'package:amplify_flutter/features/playlists/presentation/pages/playlists_page.dart';
import 'package:amplify_flutter/routes/route_constants.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playerState = ref.watch(playerControllerProvider);
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                const CustomAppBar(),
                // Guest mode banner
                authState.maybeWhen(
                  unauthenticated: () => Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 0,
                    ),
                    color: Colors.blue.shade900.withValues(alpha: 0.3),
                    child: Row(
                      children: [
                        Icon(
                          LucideIcons.info,
                          size: 18,
                          color: Colors.blue.shade200,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Sign in to sync across devices',
                            style: TextStyle(
                              color: Colors.blue.shade100,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.go(RouteConstants.auth),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.blue.shade100,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                          ),
                          child: const Text('Sign In'),
                        ),
                      ],
                    ),
                  ),
                  orElse: () => const SizedBox.shrink(),
                ),
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
