import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../models/user_model.dart';

/// Implementation of AuthRepository using Clerk SDK
/// Note: clerk_flutter uses a different pattern where auth state is accessed via context
/// For now, we'll use local storage until we can properly integrate Clerk state
class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl();

  @override
  Future<Either<Failure, User?>> getCurrentUser() async {
    try {
      // Check cached user first
      final cachedUser = getCachedUser();
      if (cachedUser != null) {
        return Right(cachedUser);
      }

      // In clerk_flutter 0.0.13-beta, auth state is managed by ClerkAuth widget
      // and accessed via ClerkAuth.of(context), which requires a BuildContext
      // For repository pattern, we'll rely on cached data from successful auth

      // Check if authenticated via local storage
      final isAuth = await isAuthenticated();
      if (!isAuth) {
        return const Right(null);
      }

      // Try to get user from local storage
      final userData = LocalStorageService.getUserObject();
      if (userData != null) {
        final userModel = UserModel.fromJson(userData);
        return Right(userModel.toEntity());
      }

      return const Right(null);
    } catch (e) {
      return Left(AuthFailure(e.toString()));
    }
  }

  @override
  Stream<User?> watchAuthState() async* {
    // In clerk_flutter, auth state changes are handled by ClerkAuthBuilder widget
    // For now, emit cached user and let UI components use ClerkAuthBuilder
    yield getCachedUser();

    // Future enhancement: Use ClerkAuthState stream when available without context
  }

  @override
  Future<Either<Failure, void>> signOut() async {
    try {
      // Clear local storage
      // Actual sign out from Clerk is handled by ClerkAuth widget
      await clearCachedUser();
      await LocalStorageService.deleteAuthToken();
      await LocalStorageService.deleteUserId();

      return const Right(null);
    } catch (e) {
      return Left(AuthFailure('Failed to sign out: ${e.toString()}'));
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    try {
      // Check local storage for auth status
      // In production, this would be synced with Clerk session
      return await LocalStorageService.isLoggedIn();
    } catch (e) {
      return false;
    }
  }

  @override
  User? getCachedUser() {
    try {
      final userData = LocalStorageService.getUserObject();
      if (userData == null) return null;

      final userModel = UserModel.fromJson(userData);
      return userModel.toEntity();
    } catch (e) {
      return null;
    }
  }

  @override
  Future<void> cacheUser(User user) async {
    try {
      final userModel = UserModel.fromEntity(user);
      await LocalStorageService.saveUserObject(userModel.toJson());
      await LocalStorageService.saveUserId(user.id);
    } catch (e) {
      // Log error but don't throw
      print('Error caching user: $e');
    }
  }

  @override
  Future<void> clearCachedUser() async {
    try {
      await LocalStorageService.deleteUserData('user_data');
      await LocalStorageService.deleteUserId();
    } catch (e) {
      // Log error but don't throw
      print('Error clearing cached user: $e');
    }
  }
}
