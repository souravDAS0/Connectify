import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String get environment => dotenv.env['ENVIRONMENT'] ?? 'development';

  static bool get isProduction => environment == 'production';

  static String get apiBaseUrl {
    if (isProduction) {
      return dotenv.env['PROD_API_URL'] ??
          'https://connectify-api.onrender.com';
    }
    return dotenv.env['API_BASE_URL'] ?? 'http://192.168.31.242:3000';
  }

  static String get wsUrl {
    if (isProduction) {
      return dotenv.env['PROD_WS_URL'] ?? 'ws://connectify-api.onrender.com/ws';
    }
    return dotenv.env['WS_URL'] ?? 'ws://192.168.31.242:3000/ws';
  }

  static String get supabaseUrl =>
      dotenv.env['SUPABASE_URL'] ?? '';

  static String get supabaseAnonKey =>
      dotenv.env['SUPABASE_ANON_KEY'] ?? '';
}
