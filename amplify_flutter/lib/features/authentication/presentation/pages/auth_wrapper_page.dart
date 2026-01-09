import 'package:amplify_flutter/core/constants/app_assets.dart';
import 'package:amplify_flutter/core/constants/app_typography.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../routes/route_constants.dart';
import '../providers/auth_provider.dart';

/// Authentication page with Google Sign-In
class AuthWrapperPage extends ConsumerWidget {
  const AuthWrapperPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);

    // Listen to auth state changes
    ref.listen(authNotifierProvider, (previous, next) {
      next.when(
        initial: () {},
        loading: () {},
        authenticated: (_) {
          // Navigate to home when authenticated
          context.go(RouteConstants.home);
        },
        unauthenticated: () {},
        error: (message) {
          // Show error snackbar
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        },
      );
    });

    return Scaffold(
      backgroundColor: AppColors.gray900,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),

              // App Logo or Icon
              Container(
                height: MediaQuery.of(context).size.width * 0.25,
                child: Image.asset(AppAssets.logoFull),
              ),
              const SizedBox(height: 12),

              // Welcome Text
              Text(
                'Your collaborative music streaming experience',
                style: AppTypography.body1.copyWith(color: AppColors.gray400),
                textAlign: TextAlign.center,
              ),

              const Spacer(),

              // Google Sign-In Button
              authState.when(
                initial: () => _buildGoogleSignInButton(context, ref, false),
                loading: () => _buildLoadingButton(),
                authenticated: (_) =>
                    _buildGoogleSignInButton(context, ref, false),
                unauthenticated: () =>
                    _buildGoogleSignInButton(context, ref, false),
                error: (_) => _buildGoogleSignInButton(context, ref, false),
              ),

              const SizedBox(height: 16),

              // Continue as Guest Button
              OutlinedButton.icon(
                onPressed: () {
                  context.go(RouteConstants.home);
                },
                icon: const Icon(Icons.person_outline),
                label: const Text('Continue as Guest'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.white,
                  side: BorderSide(color: AppColors.gray600),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Terms and Privacy
              Text(
                'By continuing, you agree to our Terms of Service and Privacy Policy',
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppColors.gray500),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGoogleSignInButton(
    BuildContext context,
    WidgetRef ref,
    bool isLoading,
  ) {
    return ElevatedButton.icon(
      onPressed: isLoading
          ? null
          : () {
              ref.read(authNotifierProvider.notifier).signInWithGoogle();
            },
      icon: Container(
        width: 24,
        height: 24,
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
        child: const Center(
          child: Text(
            'G',
            style: TextStyle(
              color: Colors.red,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ),
      ),
      label: const Text('Continue with Google'),
      style: ElevatedButton.styleFrom(
        foregroundColor: AppColors.white,
        backgroundColor: AppColors.blue500,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildLoadingButton() {
    return ElevatedButton(
      onPressed: null,
      style: ElevatedButton.styleFrom(
        foregroundColor: AppColors.white,
        backgroundColor: AppColors.blue500,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: const SizedBox(
        height: 24,
        width: 24,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
        ),
      ),
    );
  }
}
