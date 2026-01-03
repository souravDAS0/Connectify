import 'package:flutter/material.dart';
import '../../../../core/widgets/app_logo.dart';
import '../../../../core/widgets/loading_animation.dart';
import '../../../../core/constants/app_colors.dart';

/// Splash screen with logo and loading animation
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    _navigateToNext();
  }

  Future<void> _navigateToNext() async {
    // Wait for 2 seconds to show splash screen
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    // Navigation is handled by GoRouter redirect logic based on auth state
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray900,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Pulsing logo
            const PulsingLogo(width: 200, height: 200, useFullLogo: true),

            const SizedBox(height: 48),

            // Loading animation
            const LoadingAnimation(
              width: 80,
              height: 80,
              showBackground: false,
            ),

            const SizedBox(height: 24),

            // App name or tagline (optional)
            Text(
              'Amplify',
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
