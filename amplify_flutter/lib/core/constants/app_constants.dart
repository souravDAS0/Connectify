/// Application-wide constants
class AppConstants {
  AppConstants._(); // Private constructor to prevent instantiation

  // App Information
  static const String appName = 'Amplify';
  static const String appVersion = '1.0.0';

  // Clerk Configuration
  static const String clerkPublishableKey =
      'pk_test_bW9kZXJuLXdhbHJ1cy0xMC5jbGVyay5hY2NvdW50cy5kZXYk';

  // API Configuration
  static const String baseUrl = 'http://localhost:3000';

  static const String wsUrl = 'ws://localhost:3000/ws';

  // Production URLs (for when you deploy)
  static const String prodApiUrl = 'https://connectify-api.onrender.com';
  static const String prodWsUrl = 'ws://connectify-api.onrender.com/ws';

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);

  // Cache
  static const Duration cacheMaxAge = Duration(hours: 1);

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // Audio
  static const Duration seekStepDuration = Duration(seconds: 10);
  static const Duration positionUpdateInterval = Duration(milliseconds: 200);
}
