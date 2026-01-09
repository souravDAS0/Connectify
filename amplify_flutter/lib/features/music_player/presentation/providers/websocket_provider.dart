import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:amplify_flutter/features/authentication/presentation/providers/auth_provider.dart';
import '../../application/websocket_service.dart';
import '../../domain/models/active_device.dart';
import '../../domain/models/websocket_message.dart';

// WebSocket Service Provider
final webSocketServiceProvider = Provider<WebSocketService>((ref) {
  final service = WebSocketService();
  ref.onDispose(() => service.dispose());
  return service;
});

// Connection State Provider
final websocketConnectionProvider = StreamProvider<bool>((ref) {
  final service = ref.watch(webSocketServiceProvider);
  return service.connectionStateStream;
});

// Active Devices List Provider
final activeDevicesProvider = StreamProvider<List<ActiveDevice>>((ref) {
  final service = ref.watch(webSocketServiceProvider);
  return service.deviceListStream;
});

// Active Device ID Provider
final activeDeviceIdProvider = StreamProvider<String>((ref) {
  final service = ref.watch(webSocketServiceProvider);
  return service.activeDeviceIdStream;
});

// Playback State Provider
final playbackStateStreamProvider = StreamProvider<PlaybackState>((ref) {
  final service = ref.watch(webSocketServiceProvider);
  return service.playbackStateStream;
});

// WebSocket Messages Stream Provider
final websocketMessagesProvider = StreamProvider<WebSocketMessage>((ref) {
  final service = ref.watch(webSocketServiceProvider);
  return service.messageStream;
});

// Current Device ID Provider
final currentDeviceIdProvider = Provider<String?>((ref) {
  final service = ref.watch(webSocketServiceProvider);
  return service.deviceId;
});

// Helper to check if current device is active
final isCurrentDeviceActiveProvider = Provider<bool>((ref) {
  final authState = ref.watch(authNotifierProvider);
  final isAuthenticated = authState.maybeWhen(
    authenticated: (_) => true,
    orElse: () => false,
  );

  // If not authenticated, this device is always the active device (local playback only)
  if (!isAuthenticated) {
    return true;
  }

  final wsService = ref.watch(webSocketServiceProvider);

  // If WebSocket is not connected, default to true (local playback)
  if (!wsService.isConnected) {
    return true;
  }

  final currentDeviceId = ref.watch(currentDeviceIdProvider);
  final activeDevicesAsync = ref.watch(activeDevicesProvider);
  final activeDeviceIdAsync = ref.watch(activeDeviceIdProvider);

  return activeDevicesAsync.when(
    data: (devices) {
      // If only one device exists, it must be the active device
      if (devices.length <= 1) {
        return true;
      }

      // Multiple devices: check if this device is the active one
      return activeDeviceIdAsync.when(
        data: (activeDeviceId) => currentDeviceId == activeDeviceId,
        loading: () => false,
        error: (_, _) => false,
      );
    },
    loading: () => true, // Default to true while loading
    error: (_, _) => true, // Default to true on error (fallback to local)
  );
});
