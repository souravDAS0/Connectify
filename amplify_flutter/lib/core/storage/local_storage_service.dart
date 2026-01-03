import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Local storage service using Hive and Secure Storage
class LocalStorageService {
  static const String _authBoxName = 'auth_box';
  static const String _userBoxName = 'user_box';
  static const String _settingsBoxName = 'settings_box';

  // Secure storage for sensitive data
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  // Hive boxes
  static Box? _authBox;
  static Box? _userBox;
  static Box? _settingsBox;

  /// Initialize Hive and open boxes
  static Future<void> init() async {
    await Hive.initFlutter();

    _authBox = await Hive.openBox(_authBoxName);
    _userBox = await Hive.openBox(_userBoxName);
    _settingsBox = await Hive.openBox(_settingsBoxName);
  }

  /// Close all boxes
  static Future<void> dispose() async {
    await _authBox?.close();
    await _userBox?.close();
    await _settingsBox?.close();
  }

  /// Clear all data
  static Future<void> clearAll() async {
    await _authBox?.clear();
    await _userBox?.clear();
    await _settingsBox?.clear();
    await _secureStorage.deleteAll();
  }

  // ===== Auth Storage =====

  /// Save auth token securely
  static Future<void> saveAuthToken(String token) async {
    await _secureStorage.write(key: 'auth_token', value: token);
  }

  /// Get auth token
  static Future<String?> getAuthToken() async {
    return await _secureStorage.read(key: 'auth_token');
  }

  /// Delete auth token
  static Future<void> deleteAuthToken() async {
    await _secureStorage.delete(key: 'auth_token');
  }

  /// Save user ID
  static Future<void> saveUserId(String userId) async {
    await _authBox?.put('user_id', userId);
  }

  /// Get user ID
  static String? getUserId() {
    return _authBox?.get('user_id') as String?;
  }

  /// Delete user ID
  static Future<void> deleteUserId() async {
    await _authBox?.delete('user_id');
  }

  /// Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await getAuthToken();
    return token != null && token.isNotEmpty;
  }

  // ===== User Data Storage =====

  /// Save user data
  static Future<void> saveUserData(String key, dynamic value) async {
    await _userBox?.put(key, value);
  }

  /// Get user data
  static dynamic getUserData(String key) {
    return _userBox?.get(key);
  }

  /// Delete user data
  static Future<void> deleteUserData(String key) async {
    await _userBox?.delete(key);
  }

  /// Save user object as JSON
  static Future<void> saveUserObject(Map<String, dynamic> userData) async {
    await _userBox?.put('user_data', userData);
  }

  /// Get user object
  static Map<String, dynamic>? getUserObject() {
    final data = _userBox?.get('user_data');
    if (data != null && data is Map) {
      return Map<String, dynamic>.from(data);
    }
    return null;
  }

  // ===== Settings Storage =====

  /// Save setting
  static Future<void> saveSetting(String key, dynamic value) async {
    await _settingsBox?.put(key, value);
  }

  /// Get setting
  static dynamic getSetting(String key, {dynamic defaultValue}) {
    return _settingsBox?.get(key, defaultValue: defaultValue);
  }

  /// Save theme mode
  static Future<void> saveThemeMode(String mode) async {
    await _settingsBox?.put('theme_mode', mode);
  }

  /// Get theme mode
  static String getThemeMode() {
    return _settingsBox?.get('theme_mode', defaultValue: 'dark') as String;
  }
}
