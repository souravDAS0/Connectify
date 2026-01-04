import 'package:dartz/dartz.dart';
import '../../../../core/errors/failures.dart';
import '../entities/user.dart';

/// Authentication repository interface
abstract class AuthRepository {
  /// Get current authenticated user
  Future<Either<Failure, User?>> getCurrentUser();

  /// Watch authentication state changes
  Stream<User?> watchAuthState();

  /// Sign out current user
  Future<Either<Failure, void>> signOut();

  /// Check if user is authenticated
  Future<bool> isAuthenticated();

  /// Get cached user
  User? getCachedUser();

  /// Save user to cache
  Future<void> cacheUser(User user);

  /// Clear cached user
  Future<void> clearCachedUser();
}
