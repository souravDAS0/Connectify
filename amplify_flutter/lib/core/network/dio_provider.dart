import 'package:amplify_flutter/core/config/app_config.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio();

  // Set base URL
  // Set base URL
  dio.options.baseUrl = AppConfig.apiBaseUrl;

  // Add timeouts
  dio.options.connectTimeout = const Duration(seconds: 5);
  dio.options.receiveTimeout = const Duration(seconds: 3);

  // Add interceptors here if needed (e.g. auth token)

  return dio;
});
