import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:amplify_flutter/features/music_player/domain/models/track.dart';

class TrackListItem extends StatelessWidget {
  final Track track;
  final VoidCallback onTap;
  final bool isPlaying;
  final bool isCurrent;

  const TrackListItem({
    super.key,
    required this.track,
    required this.onTap,
    this.isPlaying = false,
    this.isCurrent = false,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: track.albumArtUrl != null
            ? CachedNetworkImage(
                imageUrl: track.albumArtUrl!,
                width: 48,
                height: 48,
                fit: BoxFit.cover,
                placeholder: (context, url) =>
                    Container(color: Colors.grey[800]),
                errorWidget: (context, url, error) =>
                    const Icon(Icons.music_note),
              )
            : Container(
                width: 48,
                height: 48,
                color: Colors.grey[800],
                child: const Icon(Icons.music_note),
              ),
      ),
      title: Text(
        track.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: isCurrent ? Colors.green : null,
          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      subtitle: Text(
        '${track.artist}${track.album.isNotEmpty ? ' • ${track.album}' : ''}',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: IconButton(
        icon: const Icon(Icons.more_vert),
        onPressed: () {
          // TODO: Show context menu
        },
      ),
    );
  }
}
