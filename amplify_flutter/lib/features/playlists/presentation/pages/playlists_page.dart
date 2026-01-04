import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlaylistsPage extends ConsumerWidget {
  const PlaylistsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      color: Colors.black,
      child: const Center(
        child: Text(
          'Playlists Coming Soon',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}
