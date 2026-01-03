import 'package:flutter/material.dart';

/// Application color constants based on the web app design
class AppColors {
  AppColors._(); // Private constructor to prevent instantiation

  // Background Colors
  static const Color background = Color(0xFF242424);
  static const Color backgroundLight = Color(0xFFFFFFFF);

  // Gray Scale
  static const Color gray900 = Color(0xFF111827);
  static const Color gray800 = Color(0xFF1F2937);
  static const Color gray700 = Color(0xFF374151);
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray500 = Color(0xFF6B7280);
  static const Color gray400 = Color(0xFF9CA3AF);
  static const Color gray300 = Color(0xFFD1D5DB);
  static const Color gray200 = Color(0xFFE5E7EB);

  // Accent Colors
  static const Color blue500 = Color(0xFF3B82F6);
  static const Color blue400 = Color(0xFF60A5FA);
  static const Color green500 = Color(0xFF10B981);
  static const Color green400 = Color(0xFF34D399);
  static const Color red500 = Color(0xFFEF4444);

  // Text Colors
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xDEFFFFFF); // 87% opacity
  static const Color textTertiary = Color(0x99FFFFFF); // 60% opacity
  static const Color textDisabled = Color(0x61FFFFFF); // 38% opacity

  // Special Colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color transparent = Colors.transparent;
}
