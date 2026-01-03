/// Application-wide constants
class AppConstants {
  AppConstants._(); // Private constructor to prevent instantiation

  // App Information
  static const String appName = 'Amplify';
  static const String appVersion = '1.0.0';

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
