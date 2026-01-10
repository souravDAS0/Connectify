import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/config/app_config.dart';
import 'core/storage/local_storage_service.dart';
import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'routes/app_router.dart';
import 'features/music_player/application/audio_player_service.dart';
import 'features/music_player/presentation/providers/websocket_manager.dart';
import 'features/music_player/presentation/providers/playback_sync_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: ".env");

  // Initialize Supabase
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  // Initialize Hive for local storage
  await LocalStorageService.init();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.black,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(const ProviderScope(child: AmplifyApp()));
}

class AmplifyApp extends ConsumerStatefulWidget {
  const AmplifyApp({super.key});

  @override
  ConsumerState<AmplifyApp> createState() => _AmplifyAppState();
}

class _AmplifyAppState extends ConsumerState<AmplifyApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Initialize audio service, WebSocket manager and playback sync
    Future.microtask(() async {
      await ref.read(audioPlayerServiceProvider).init();
      ref.read(websocketManagerProvider);
      ref.read(playbackSyncProvider);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // Only stop playback when app is being permanently terminated
    if (state == AppLifecycleState.detached) {
      try {
        final audioService = ref.read(audioPlayerServiceProvider);
        audioService.shutdown();
      } catch (e) {
        // Ignore errors if service doesn't exist
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Watch router provider
    final router = ref.watch(goRouterProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}
