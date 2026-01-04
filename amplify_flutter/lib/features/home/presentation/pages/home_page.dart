import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:amplify_flutter/features/music_player/presentation/pages/library_page.dart';

/// Temporary home page (will be replaced with Playlists page)
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const LibraryPage();
  }
}
