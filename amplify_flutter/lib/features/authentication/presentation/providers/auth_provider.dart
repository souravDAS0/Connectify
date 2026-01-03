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
  @override
  AuthState build() {
    _checkAuthStatus();
    return const AuthState.initial();
  }

  /// Check authentication status on init
  Future<void> _checkAuthStatus() async {
    state = const AuthState.loading();

    final authRepo = ref.read(authRepositoryProvider);
    final isAuth = await authRepo.isAuthenticated();

    if (!isAuth) {
      state = const AuthState.unauthenticated();
      return;
    }

    final result = await authRepo.getCurrentUser();
    result.fold((failure) => state = AuthState.error(failure.message), (user) {
      if (user != null) {
        state = AuthState.authenticated(user);
      } else {
        state = const AuthState.unauthenticated();
      }
    });
  }

  /// Sign in (Clerk handles the sign-in flow)
  Future<void> signIn() async {
    state = const AuthState.loading();

    try {
      // Clerk sign-in is handled by Clerk UI components
      // This method just checks if sign-in was successful
      final authRepo = ref.read(authRepositoryProvider);
      final result = await authRepo.getCurrentUser();

      result.fold((failure) => state = AuthState.error(failure.message), (
        user,
      ) {
        if (user != null) {
          state = AuthState.authenticated(user);
        } else {
          state = const AuthState.unauthenticated();
        }
      });
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }

  /// Sign out
  Future<void> signOut() async {
    state = const AuthState.loading();

    final authRepo = ref.read(authRepositoryProvider);
    final result = await authRepo.signOut();

    result.fold(
      (failure) => state = AuthState.error(failure.message),
      (_) => state = const AuthState.unauthenticated(),
    );
  }

  /// Refresh authentication state
  Future<void> refresh() async {
    await _checkAuthStatus();
  }
}
