import 'package:freezed_annotation/freezed_annotation.dart';

part 'track.freezed.dart';
part 'track.g.dart';

@freezed
class Track with _$Track {
  const factory Track({
    required String id,
    required String title,
    required String artist,
    required String album,
    required String genre,
    required double duration,
    int? year,
    @JsonKey(name: 'file_name') required String fileName,
    @JsonKey(name: 'file_size') required int fileSize,
    @JsonKey(name: 'mime_type') required String mimeType,
    @JsonKey(name: 'album_art_url') String? albumArtUrl,
    @JsonKey(name: 'play_count') required int playCount,
    @JsonKey(name: 'created_at') required DateTime createdAt,
    @JsonKey(name: 'updated_at') required DateTime updatedAt,
    @JsonKey(name: 'last_played') DateTime? lastPlayed,
  }) = _Track;

  factory Track.fromJson(Map<String, dynamic> json) => _$TrackFromJson(json);
}
