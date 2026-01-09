import 'dart:async';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import 'auth_state.dart';

part 'auth_provider.g.dart';

/// Provider for Auth Repository
@riverpod
AuthRepository authRepository(AuthRepositoryRef ref) {
  return AuthRepositoryImpl();
}

/// Provider for current user
@riverpod
Future<User?> currentUser(CurrentUserRef ref) async {
  final authRepo = ref.watch(authRepositoryProvider);
  final result = await authRepo.getCurrentUser();
  return result.fold((failure) => null, (user) => user);
}

/// Auth state notifier provider
@riverpod
class AuthNotifier extends _$AuthNotifier {
  StreamSubscription? _authSubscription;

  @override
  AuthState build() {
    _init();
    return const AuthState.initial();
  }

  /// Initialize auth state and listen to changes
  Future<void> _init() async {
    try {
      print('[AuthNotifier] Initializing...');
      state = const AuthState.loading();

      final authRepo = ref.read(authRepositoryProvider);

      // Check initial auth status
      final isAuth = await authRepo.isAuthenticated();
      print('[AuthNotifier] Initial auth status: $isAuth');

      if (!isAuth) {
        print('[AuthNotifier] Not authenticated');
        state = const AuthState.unauthenticated();
      } else {
        // Get current user
        final result = await authRepo.getCurrentUser();
        result.fold(
          (failure) {
            print('[AuthNotifier] Error getting user: ${failure.message}');
            state = const AuthState.unauthenticated();
          },
          (user) {
            if (user != null) {
              print('[AuthNotifier] User found: ${user.email}');
              state = AuthState.authenticated(user);
            } else {
              print('[AuthNotifier] No user found');
              state = const AuthState.unauthenticated();
            }
          },
        );
      }

      // Listen to auth state changes
      _authSubscription?.cancel();
      _authSubscription = authRepo.watchAuthState().listen(
        (user) {
          print('[AuthNotifier] Auth state changed via stream');
          if (user != null) {
            print('[AuthNotifier] User authenticated: ${user.email}');
            state = AuthState.authenticated(user);
          } else {
            print('[AuthNotifier] User unauthenticated');
            state = const AuthState.unauthenticated();
          }
        },
        onError: (error) {
          print('[AuthNotifier] Error in auth stream: $error');
          state = const AuthState.unauthenticated();
        },
      );
    } catch (e, stackTrace) {
      print('[AuthNotifier] Exception in _init: $e');
      print('[AuthNotifier] Stack trace: $stackTrace');
      state = const AuthState.unauthenticated();
    }
  }

  /// Sign in with Google
  Future<void> signInWithGoogle() async {
    state = const AuthState.loading();

    try {
      final authRepo = ref.read(authRepositoryProvider) as AuthRepositoryImpl;
      final result = await authRepo.signInWithGoogle();

      result.fold(
        (failure) {
          print('[AuthNotifier] Sign in failed: ${failure.message}');
          state = AuthState.error(failure.message);

          // Return to unauthenticated after showing error
          Future.delayed(const Duration(seconds: 2), () {
            state.maybeWhen(
              error: (_) => state = const AuthState.unauthenticated(),
              orElse: () {},
            );
          });
        },
        (user) {
          print('[AuthNotifier] Sign in successful: ${user.email}');
          state = AuthState.authenticated(user);
        },
      );
    } catch (e) {
      print('[AuthNotifier] Exception during sign in: $e');
      state = AuthState.error(e.toString());

      // Return to unauthenticated after showing error
      Future.delayed(const Duration(seconds: 2), () {
        state.maybeWhen(
          error: (_) => state = const AuthState.unauthenticated(),
          orElse: () {},
        );
      });
    }
  }

  /// Sign out
  Future<void> signOut() async {
    final previousState = state;
    state = const AuthState.loading();

    final authRepo = ref.read(authRepositoryProvider);
    final result = await authRepo.signOut();

    result.fold(
      (failure) {
        print('[AuthNotifier] Sign out failed: ${failure.message}');
        // Restore previous state on failure
        state = previousState;
      },
      (_) {
        print('[AuthNotifier] Sign out successful');
        state = const AuthState.unauthenticated();
      },
    );
  }

  /// Refresh authentication state
  Future<void> refresh() async {
    await _init();
  }
}
