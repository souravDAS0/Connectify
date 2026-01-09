import 'package:amplify_flutter/core/config/app_config.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio();

  // Set base URL
  dio.options.baseUrl = AppConfig.apiBaseUrl;

  // Add timeouts
  dio.options.connectTimeout = const Duration(seconds: 5);
  dio.options.receiveTimeout = const Duration(seconds: 3);

  // Add auth interceptor for Supabase
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        try {
          // Get current Supabase session
          final session = Supabase.instance.client.auth.currentSession;

          if (session != null) {
            // Add authorization header with access token
            options.headers['Authorization'] = 'Bearer ${session.accessToken}';
            print('[DioProvider] Added auth header for ${options.path}');
          } else {
            print('[DioProvider] No session, request will be sent without auth');
          }
        } catch (e) {
          print('[DioProvider] Error adding auth header: $e');
        }

        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 errors (unauthorized)
        if (error.response?.statusCode == 401) {
          print('[DioProvider] Received 401, attempting to refresh session...');

          try {
            // Try to refresh the session
            final response = await Supabase.instance.client.auth.refreshSession();

            if (response.session != null) {
              print('[DioProvider] Session refreshed successfully');

              // Retry the request with new token
              final options = error.requestOptions;
              options.headers['Authorization'] =
                  'Bearer ${response.session!.accessToken}';

              final retryResponse = await dio.fetch(options);
              return handler.resolve(retryResponse);
            }
          } catch (e) {
            print('[DioProvider] Session refresh failed: $e');
            // Session refresh failed, user needs to re-authenticate
          }
        }

        return handler.next(error);
      },
    ),
  );

  return dio;
});
