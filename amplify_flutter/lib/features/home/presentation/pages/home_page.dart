import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_logo.dart';
import '../../../authentication/presentation/providers/auth_provider.dart';

/// Temporary home page (will be replaced with Playlists page)
class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Amplify'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ref.read(authNotifierProvider.notifier).signOut();
            },
            tooltip: 'Sign Out',
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              const AppLogo(width: 120, height: 120, useFullLogo: false),

              const SizedBox(height: 32),

              // Welcome message
              authState.maybeWhen(
                authenticated: (user) => Column(
                  children: [
                    Text(
                      'Welcome, ${user.fullName}!',
                      style: Theme.of(context).textTheme.displaySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      user.email ?? 'No email',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                orElse: () => Text(
                  'Welcome to Amplify',
                  style: Theme.of(context).textTheme.displaySmall,
                ),
              ),

              const SizedBox(height: 48),

              // Feature status
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.gray800,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    _buildFeatureStatus('✅', 'Authentication', 'Complete'),
                    const SizedBox(height: 16),
                    _buildFeatureStatus('⏳', 'Playlists', 'Coming in Phase 3'),
                    const SizedBox(height: 16),
                    _buildFeatureStatus('⏳', 'Player', 'Coming in Phase 4'),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Info text
              Text(
                'Phase 2 Complete!\n\n'
                'Ready to implement Phase 3:\n'
                'Playlists & Track Management',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureStatus(String emoji, String feature, String status) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 24)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                feature,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              Text(
                status,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
