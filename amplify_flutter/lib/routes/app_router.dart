import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/authentication/presentation/pages/auth_wrapper_page.dart';
import '../features/authentication/presentation/providers/auth_provider.dart';
import '../features/authentication/presentation/providers/auth_state.dart';
import '../features/home/presentation/pages/home_page.dart';
import '../features/splash/presentation/pages/splash_page.dart';
import 'route_constants.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

/// Application router provider
final goRouterProvider = Provider<GoRouter>((ref) {
  // Create a ValueNotifier to listen to auth changes
  final authStateNotifier = ValueNotifier<AuthState>(const AuthState.initial());

  // Update the notifier when auth state changes
  ref.listen(authNotifierProvider, (_, next) {
    authStateNotifier.value = next;
  });

  // Dispose the notifier when the provider is disposed
  ref.onDispose(authStateNotifier.dispose);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: RouteConstants.splash,
    refreshListenable: authStateNotifier,
    debugLogDiagnostics: true,

    // Redirect logic for authentication
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);
      final isOnSplash = state.matchedLocation == RouteConstants.splash;
      final isOnAuth = state.matchedLocation == RouteConstants.auth;

      print('[Router] Current location: ${state.matchedLocation}');
      print('[Router] Auth state: ${authState.toString()}');

      return authState.when(
        initial: () {
          print('[Router] State: initial, staying on splash');
          return isOnSplash ? null : RouteConstants.splash;
        },
        loading: () {
          print('[Router] State: loading, staying on splash');
          return isOnSplash ? null : RouteConstants.splash;
        },
        authenticated: (_) {
          print('[Router] State: authenticated, redirecting to home');
          // If authenticated and on auth/splash, go to home
          if (isOnAuth || isOnSplash) {
            return RouteConstants.home;
          }
          return null; // Stay on current route
        },
        unauthenticated: () {
          print('[Router] State: unauthenticated');
          // If not authenticated, always go to auth (except if already there)
          if (isOnAuth) {
            print('[Router] Already on auth page');
            return null; // Already on auth page
          }
          print('[Router] Redirecting to auth page');
          return RouteConstants.auth;
        },
        error: (message) {
          print('[Router] State: error ($message), redirecting to auth');
          return RouteConstants.auth;
        },
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
});
