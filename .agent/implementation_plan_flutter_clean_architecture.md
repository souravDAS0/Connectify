# Flutter App - Clean Architecture Implementation Plan

## Project Overview

Implementing a Flutter music streaming app (Amplify) using Clean Architecture, Riverpod for state management, and Go Router for navigation.

---

## 🏗️ Architecture Structure

### Layer Organization

```
lib/
├── core/
│   ├── constants/
│   │   ├── app_colors.dart          # Color palette from web app
│   │   ├── app_typography.dart      # Typography styles
│   │   ├── app_constants.dart       # API URLs, etc.
│   │   └── app_assets.dart          # Asset paths
│   ├── theme/
│   │   └── app_theme.dart           # Material theme configuration
│   ├── network/
│   │   ├── api_client.dart          # HTTP client setup
│   │   └── websocket_client.dart    # WebSocket for real-time updates
│   ├── utils/
│   │   └── time_formatter.dart      # Utility functions
│   └── widgets/
│       ├── loading_animation.dart   # Lottie loading animation
│       └── app_logo.dart            # Reusable logo widget
│
├── features/
│   ├── authentication/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.dart           # User entity (maps from Clerk user)
│   │   │   └── repositories/
│   │   │       └── auth_repository.dart # Interface for auth operations
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   └── user_model.dart     # User model (from Clerk)
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart # Clerk SDK wrapper
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── auth_provider.dart   # Riverpod provider for Clerk state
│   │       └── pages/
│   │           └── auth_wrapper_page.dart # Handles Clerk auth UI
│   │
│   ├── playlists/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   └── playlist_model.dart
│   │   │   ├── datasources/
│   │   │   │   └── playlist_remote_datasource.dart
│   │   │   └── repositories/
│   │   │       └── playlist_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── playlist.dart
│   │   │   ├── repositories/
│   │   │   │   └── playlist_repository.dart
│   │   │   └── usecases/
│   │   │       ├── get_playlists_usecase.dart
│   │   │       ├── get_playlist_details_usecase.dart
│   │   │       └── create_playlist_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── playlist_provider.dart
│   │       ├── pages/
│   │       │   ├── playlists_page.dart
│   │       │   └── playlist_detail_page.dart
│   │       └── widgets/
│   │           ├── playlist_card.dart
│   │           └── track_list_item.dart
│   │
│   ├── player/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   └── track_model.dart
│   │   │   ├── datasources/
│   │   │   │   └── player_remote_datasource.dart
│   │   │   └── repositories/
│   │   │       └── player_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── track.dart
│   │   │   ├── repositories/
│   │   │   │   └── player_repository.dart
│   │   │   └── usecases/
│   │   │       ├── play_track_usecase.dart
│   │   │       ├── pause_track_usecase.dart
│   │   │       ├── next_track_usecase.dart
│   │   │       └── seek_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── player_provider.dart
│   │       ├── pages/
│   │       │   └── now_playing_page.dart
│   │       └── widgets/
│   │           ├── player_controls.dart
│   │           ├── progress_bar.dart
│   │           └── queue_list.dart
│   │
│   └── splash/
│       └── presentation/
│           └── pages/
│               └── splash_page.dart
│
├── routes/
│   ├── app_router.dart              # Go Router configuration
│   └── route_constants.dart         # Route names
│
└── main.dart                         # App entry point
```

---

## 📦 Dependencies (pubspec.yaml additions)

```yaml
dependencies:
  # Authentication
  clerk_flutter: ^0.0.8

  # State Management
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # Routing
  go_router: ^14.0.2

  # Network
  dio: ^5.4.0
  web_socket_channel: ^3.0.0

  # JSON Serialization
  json_annotation: ^4.8.1
  freezed_annotation: ^2.4.1

  # UI Components
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  lottie: ^3.1.0

  # Audio Player
  just_audio: ^0.9.36
  audio_service: ^0.18.12

  # Utilities
  intl: ^0.19.0
  equatable: ^2.0.5
  dartz: ^0.10.1

dev_dependencies:
  # Code Generation
  build_runner: ^2.4.8
  json_serializable: ^6.7.1
  freezed: ^2.4.7
  riverpod_generator: ^2.3.11

  # Testing
  mockito: ^5.4.4
  flutter_test:
    sdk: flutter
```

---

## 🎨 Design System

### Color Palette (from web app)

Based on the web frontend analysis:

```dart
// lib/core/constants/app_colors.dart
class AppColors {
  // Background Colors
  static const background = Color(0xFF242424);
  static const backgroundLight = Color(0xFFFFFFFF);

  // Gray Scale
  static const gray900 = Color(0xFF111827);
  static const gray800 = Color(0xFF1F2937);
  static const gray700 = Color(0xFF374151);
  static const gray600 = Color(0xFF4B5563);
  static const gray500 = Color(0xFF6B7280);
  static const gray400 = Color(0xFF9CA3AF);

  // Accent Colors
  static const blue500 = Color(0xFF3B82F6);
  static const green500 = Color(0xFF10B981);
  static const green400 = Color(0xFF34D399);

  // Text Colors
  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0x87FFFFFF);
}
```

### Typography

```dart
// lib/core/constants/app_typography.dart
class AppTypography {
  static const fontFamily = 'Inter';

  static const headline1 = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    fontFamily: fontFamily,
  );

  static const headline2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    fontFamily: fontFamily,
  );

  static const body1 = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    fontFamily: fontFamily,
  );

  static const body2 = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    fontFamily: fontFamily,
  );
}
```

---

## 🛣️ Routing Structure (Go Router)

```dart
// lib/routes/app_router.dart
final goRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashPage(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginPage(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignupPage(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const PlaylistsPage(),
    ),
    GoRoute(
      path: '/playlist/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return PlaylistDetailPage(playlistId: id);
      },
    ),
    GoRoute(
      path: '/now-playing',
      builder: (context, state) => const NowPlayingPage(),
    ),
  ],
);
```

---

## 📄 Implementation Steps

### Phase 1: Project Setup & Core (Day 1)

1. ✅ Update `pubspec.yaml` with all dependencies
2. ✅ Copy assets (logo, loading animation) to `assets/` folder
3. ✅ Create folder structure as per architecture
4. ✅ Setup core constants (colors, typography, assets)
5. ✅ Setup theme configuration
6. ✅ Configure network clients (Dio, WebSocket)
7. ✅ Setup Go Router
8. ✅ Create loading animation widget
9. ✅ Create splash screen

### Phase 2: Authentication Feature with Clerk (Day 2)

1. ✅ Setup Clerk Flutter SDK configuration
2. ✅ Configure Clerk publishable key in environment
3. ✅ Create User entity (mapping from Clerk User)
4. ✅ Create auth repository interface
5. ✅ Implement auth repository wrapper for Clerk SDK
6. ✅ Setup Riverpod providers for Clerk auth state
7. ✅ Create auth wrapper page (handles Clerk UI components)
8. ✅ Integrate sign-in/sign-up flows using Clerk components
9. ✅ Setup auth guards for protected routes
10. ✅ Test authentication flow

### Phase 3: Playlists Feature (Day 3)

1. ✅ Create Playlist entity & model
2. ✅ Implement playlist remote datasource
3. ✅ Implement playlist repository
4. ✅ Create use cases (get playlists, get details, create)
5. ✅ Setup Riverpod providers for playlists
6. ✅ Build Playlists page UI
7. ✅ Build Playlist detail page UI
8. ✅ Create playlist & track widgets

### Phase 4: Player Feature (Day 4-5)

1. ✅ Create Track entity & model
2. ✅ Implement player remote datasource
3. ✅ Implement player repository
4. ✅ Create use cases (play, pause, next, previous, seek)
5. ✅ Setup Riverpod providers for player state
6. ✅ Integrate just_audio for audio playback
7. ✅ Build Now Playing page UI (matching web design)
8. ✅ Create player control widgets
9. ✅ Create queue list widget
10. ✅ Implement WebSocket for real-time sync

### Phase 5: Polish & Testing (Day 6)

1. ✅ Add loading states
2. ✅ Add error handling
3. ✅ Implement shimmer effects
4. ✅ Add animations & transitions
5. ✅ Test on multiple devices
6. ✅ Performance optimization
7. ✅ Write unit tests for use cases
8. ✅ Write widget tests

---

## 🎯 Key Features to Implement

### 1. **Splash Screen**

- Display logo with pulse animation
- Show loading animation
- Auto-navigate to login/home based on auth state

### 2. **Authentication (via Clerk SDK)**

- Sign-in with Clerk's pre-built UI components
- Sign-up with Clerk's validation and security
- Session management handled by Clerk
- Auto-login on app start via Clerk session
- Seamless integration with Clerk dashboard
- Support for social auth (Google, GitHub, etc.) if configured in Clerk

### 3. **Playlists**

- Grid view of playlists with album art
- Pull-to-refresh
- Search functionality
- Create new playlist

### 4. **Playlist Details**

- Track list with album art
- Play button for each track
- Add to queue
- Shuffle & repeat options

### 5. **Now Playing (Desktop & Mobile layouts)**

- Large album art
- Track info (title, artist, album)
- Progress bar with seek
- Play/Pause/Next/Previous controls
- Shuffle & Repeat toggles
- Queue panel (right side on desktop, bottom sheet on mobile)
- WebSocket sync for multi-device playback

### 6. **Audio Player**

- Background audio playback
- Media notification controls
- Queue management
- Shuffle & repeat modes
- Real-time position updates

---

## 🔄 State Management Pattern (Riverpod)

### Example: Player Provider

```dart
@riverpod
class PlayerNotifier extends _$PlayerNotifier {
  @override
  PlayerState build() {
    return PlayerState.initial();
  }

  Future<void> playTrack(Track track) async {
    state = state.copyWith(isLoading: true);

    final result = await ref.read(playTrackUsecaseProvider)(track.id);

    result.fold(
      (failure) => state = state.copyWith(
        isLoading: false,
        error: failure.message,
      ),
      (success) => state = state.copyWith(
        currentTrack: track,
        isPlaying: true,
        isLoading: false,
      ),
    );
  }
}
```

---

## 🔐 Clerk SDK Configuration

### Setup Steps

1. **Get Clerk Publishable Key** from your Clerk dashboard
2. **Add to environment configuration**:

```dart
// lib/core/constants/app_constants.dart
class AppConstants {
  static const String clerkPublishableKey = String.fromEnvironment(
    'CLERK_PUBLISHABLE_KEY',
    defaultValue: 'pk_test_YOUR_KEY_HERE',
  );

  static const String baseUrl = 'http://localhost:8080/api';
  static const String wsUrl = 'ws://localhost:8080/ws';
}
```

3. **Initialize Clerk in main.dart**:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Clerk
  await Clerk.initialize(
    publishableKey: AppConstants.clerkPublishableKey,
  );

  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}
```

4. **Wrap app with ClerkProvider**:

```dart
class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ClerkProvider(
      child: MaterialApp.router(
        title: 'Amplify',
        theme: AppTheme.darkTheme,
        routerConfig: goRouter,
      ),
    );
  }
}
```

### Auth Repository Pattern with Clerk

```dart
// lib/features/authentication/data/repositories/auth_repository_impl.dart
class AuthRepositoryImpl implements AuthRepository {
  final Clerk _clerk;

  AuthRepositoryImpl(this._clerk);

  @override
  Future<Either<Failure, User>> getCurrentUser() async {
    try {
      final clerkUser = await _clerk.user;
      if (clerkUser == null) {
        return Left(AuthFailure('No user logged in'));
      }
      return Right(UserModel.fromClerk(clerkUser).toEntity());
    } catch (e) {
      return Left(AuthFailure(e.toString()));
    }
  }

  @override
  Stream<User?> watchAuthState() {
    return _clerk.userStream.map((clerkUser) {
      if (clerkUser == null) return null;
      return UserModel.fromClerk(clerkUser).toEntity();
    });
  }

  @override
  Future<Either<Failure, void>> signOut() async {
    try {
      await _clerk.signOut();
      return const Right(null);
    } catch (e) {
      return Left(AuthFailure(e.toString()));
    }
  }
}
```

---

## 📱 API Integration

### Base URLs

```dart
class AppConstants {
  static const String baseUrl = 'http://localhost:8080/api';
  static const String wsUrl = 'ws://localhost:8080/ws';
}
```

### Endpoints

**Note:** Authentication endpoints are handled by Clerk SDK directly.

- GET `/playlists` - Get all playlists
- GET `/playlists/:id` - Get playlist details
- POST `/playlists` - Create new playlist
- POST `/tracks/:id/play` - Play a track
- WS `/ws` - Real-time playback sync

**Authorization:** Include Clerk session token in headers:

```dart
final token = await Clerk.instance.session?.getToken();
headers['Authorization'] = 'Bearer $token';
```

---

## ✅ Success Criteria

1. Clean architecture properly implemented with clear separation
2. Riverpod used for all state management
3. Go Router handles all navigation with auth guards
4. **Clerk SDK properly integrated for authentication**
5. **Clerk session tokens used for API authorization**
6. UI matches web app design (colors, typography)
7. Logo and loading animation integrated
8. Smooth animations and transitions
9. Audio playback works in background
10. WebSocket syncs playback across devices
11. Proper error handling and loading states
12. Code is testable and well-documented

---

## 📝 Notes

- Use `freezed` for immutable state classes
- Use `dartz` for functional error handling (Either pattern)
- Implement repository pattern with interfaces
- Keep business logic in use cases
- Use dependency injection via Riverpod
- Follow Flutter best practices and conventions
- Write meaningful commit messages for each feature

---

## 🚀 Ready to Start?

Please review this plan and confirm if:

1. The architecture structure looks good
2. The dependencies are appropriate
3. The implementation phases make sense
4. Any specific features need adjustment

Once approved, we'll begin implementation! 🎵
