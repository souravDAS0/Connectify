import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/authentication/presentation/pages/auth_wrapper_page.dart';
import '../features/authentication/presentation/providers/auth_provider.dart';
import '../features/home/presentation/pages/home_page.dart';
import '../features/splash/presentation/pages/splash_page.dart';
import 'route_constants.dart';

/// Application router configuration using GoRouter
class AppRouter {
  AppRouter._(); // Private constructor to prevent instantiation

  static final _rootNavigatorKey = GlobalKey<NavigatorState>();

  static GoRouter router(WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);

    return GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: RouteConstants.splash,
      debugLogDiagnostics: true,

      // Redirect logic for authentication
      redirect: (context, state) {
        final isOnSplash = state.matchedLocation == RouteConstants.splash;
        final isOnAuth = state.matchedLocation == RouteConstants.auth;

        return authState.when(
          initial: () => isOnSplash ? null : RouteConstants.splash,
          loading: () => isOnSplash ? null : RouteConstants.splash,
          authenticated: (_) {
            // If authenticated and on auth/splash, go to home
            if (isOnAuth || isOnSplash) {
              return RouteConstants.home;
            }
            return null; // Stay on current route
          },
          unauthenticated: () {
            // If not authenticated and not on auth/splash, go to auth
            if (!isOnAuth && !isOnSplash) {
              return RouteConstants.auth;
            }
            return null;
          },
          error: (_) => RouteConstants.auth,
        );
      },

      routes: [
        // Splash Route
        GoRoute(
          path: RouteConstants.splash,
          name: RouteConstants.splashName,
          builder: (context, state) => const SplashPage(),
        ),

        // Auth Route
        GoRoute(
          path: RouteConstants.auth,
          name: RouteConstants.authName,
          builder: (context, state) => const AuthWrapperPage(),
        ),

        // Home Route (will show playlists)
        GoRoute(
          path: RouteConstants.home,
          name: RouteConstants.homeName,
          builder: (context, state) => const HomePage(),
          routes: [
            // Playlist Detail Route
            GoRoute(
              path: 'playlist/:id',
              name: RouteConstants.playlistDetailName,
              builder: (context, state) {
                final id = state.pathParameters['id'] ?? '';
                // TODO: Pass id to PlaylistDetailPage when implemented
                return Scaffold(
                  appBar: AppBar(title: Text('Playlist $id')),
                  body: const Center(
                    child: Text('Playlist Detail Page - Coming Soon'),
                  ),
                );
              },
            ),
          ],
        ),

        // Now Playing Route
        GoRoute(
          path: RouteConstants.nowPlaying,
          name: RouteConstants.nowPlayingName,
          builder: (context, state) {
            // TODO: Implement NowPlayingPage
            return Scaffold(
              appBar: AppBar(title: const Text('Now Playing')),
              body: const Center(child: Text('Now Playing Page - Coming Soon')),
            );
          },
        ),
      ],

      // Error page
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'Page not found',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                state.uri.toString(),
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.go(RouteConstants.home),
                child: const Text('Go Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
