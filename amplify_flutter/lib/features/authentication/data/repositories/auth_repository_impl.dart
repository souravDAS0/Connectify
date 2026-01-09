import 'package:amplify_flutter/features/authentication/data/models/user_model.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide User;
import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/storage/local_storage_service.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';

/// Implementation of AuthRepository using Supabase
class AuthRepositoryImpl implements AuthRepository {
  final SupabaseClient _supabase;
  late final GoogleSignIn _googleSignIn;

  AuthRepositoryImpl() : _supabase = Supabase.instance.client {
    _googleSignIn = GoogleSignIn.instance;
    _googleSignIn.initialize(
      serverClientId: dotenv.env['GOOGLE_WEB_CLIENT_ID'],
    );
  }

  @override
  Future<Either<Failure, User?>> getCurrentUser() async {
    try {
      // Get current Supabase session
      final session = _supabase.auth.currentSession;
      if (session == null) {
        return const Right(null);
      }

      // Get user from auth
      final authUser = session.user;

      // Fetch profile data from profiles table
      final response = await _supabase
          .from('profiles')
          .select()
          .eq('id', authUser.id)
          .maybeSingle();

      final userModel = UserModel.fromSupabaseUser(
        authUser: authUser.toJson(),
        profile: response,
      );

      final user = userModel.toEntity();

      // Cache user locally
      await cacheUser(user);

      return Right(user);
    } catch (e) {
      print('[AuthRepository] Error getting current user: $e');
      return Left(AuthFailure(e.toString()));
    }
  }

  @override
  Stream<User?> watchAuthState() {
    return _supabase.auth.onAuthStateChange.asyncMap((state) async {
      print('[AuthRepository] Auth state changed: ${state.event}');

      if (state.session == null) {
        await clearCachedUser();
        return null;
      }

      try {
        final authUser = state.session!.user;

        // Fetch profile data
        final response = await _supabase
            .from('profiles')
            .select()
            .eq('id', authUser.id)
            .maybeSingle();

        final userModel = UserModel.fromSupabaseUser(
          authUser: authUser.toJson(),
          profile: response,
        );

        final user = userModel.toEntity();

        // Cache user
        await cacheUser(user);

        return user;
      } catch (e) {
        print('[AuthRepository] Error in auth state stream: $e');
        return null;
      }
    });
  }

  /// Sign in with Google OAuth
  Future<Either<Failure, User>> signInWithGoogle() async {
    try {
      print('[AuthRepository] Starting Google Sign-In...');

      // Sign in with Google
      final googleUser = await _googleSignIn.authenticate(
        scopeHint: ['email', 'profile'],
      );

      print('[AuthRepository] Google sign-in successful: ${googleUser.email}');

      // Get Google Auth tokens from the account
      final authTokens = googleUser.authentication;
      final idToken = authTokens.idToken;

      if (idToken == null) {
        return Left(AuthFailure('Failed to get Google ID token'));
      }

      print('[AuthRepository] Got Google ID token, signing in to Supabase...');

      // Sign in to Supabase with Google ID token
      // Note: google_sign_in 7.2.0+ only provides idToken, not accessToken
      final response = await _supabase.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
      );

      if (response.user == null) {
        return Left(AuthFailure('Failed to sign in to Supabase'));
      }

      print('[AuthRepository] Supabase sign-in successful');

      // Get user with profile
      final result = await getCurrentUser();
      return result.fold(
        (failure) => Left(failure),
        (user) => user != null
            ? Right(user)
            : Left(AuthFailure('User is null after sign-in')),
      );
    } catch (e) {
      print('[AuthRepository] Error signing in with Google: $e');
      return Left(
        AuthFailure('Failed to sign in with Google: ${e.toString()}'),
      );
    }
  }

  @override
  Future<Either<Failure, void>> signOut() async {
    try {
      // Sign out from Google
      await _googleSignIn.signOut();

      // Sign out from Supabase
      await _supabase.auth.signOut();

      // Clear local storage
      await clearCachedUser();
      await LocalStorageService.deleteAuthToken();
      await LocalStorageService.deleteUserId();

      return const Right(null);
    } catch (e) {
      print('[AuthRepository] Error signing out: $e');
      return Left(AuthFailure('Failed to sign out: ${e.toString()}'));
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    try {
      final session = _supabase.auth.currentSession;
      return session != null;
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
      print('[AuthRepository] Error getting cached user: $e');
      return null;
    }
  }

  @override
  Future<void> cacheUser(User user) async {
    try {
      final userModel = UserModel.fromEntity(user);
      await LocalStorageService.saveUserObject(userModel.toJson());
      await LocalStorageService.saveUserId(user.id);

      // Save token if available
      final session = _supabase.auth.currentSession;
      if (session != null) {
        await LocalStorageService.saveAuthToken(session.accessToken);
      }
    } catch (e) {
      print('[AuthRepository] Error caching user: $e');
    }
  }

  @override
  Future<void> clearCachedUser() async {
    try {
      await LocalStorageService.deleteUserData('user_data');
      await LocalStorageService.deleteUserId();
    } catch (e) {
      print('[AuthRepository] Error clearing cached user: $e');
    }
  }
}
