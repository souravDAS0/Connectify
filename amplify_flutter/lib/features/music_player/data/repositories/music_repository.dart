import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:amplify_flutter/features/music_player/domain/models/track.dart';
import 'package:amplify_flutter/core/network/dio_provider.dart';

final musicRepositoryProvider = Provider<MusicRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return MusicRepository(dio);
});

class MusicRepository {
  final Dio _dio;

  MusicRepository(this._dio);

  Future<List<Track>> getTracks() async {
    try {
      final response = await _dio.get('/tracks');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Track.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load tracks');
      }
    } catch (e) {
      throw Exception('Failed to load tracks: $e');
    }
  }

  Future<List<Track>> getQueue() async {
    // Implement if server-side queue logic exists, otherwise handle locally
    return [];
  }
}
