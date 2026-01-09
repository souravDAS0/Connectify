import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../domain/models/websocket_message.dart';
import '../domain/models/active_device.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  Timer? _reconnectTimer;
  Timer? _pingTimer;
  String? _token;
  String? _deviceId;
  String? _deviceName;
  bool _isConnecting = false;
  bool _shouldReconnect = true;

  final _storage = const FlutterSecureStorage();
  final _uuid = const Uuid();

  // Streams for broadcasting messages
  final _messageController = StreamController<WebSocketMessage>.broadcast();
  final _deviceListController = StreamController<List<ActiveDevice>>.broadcast();
  final _activeDeviceIdController = StreamController<String>.broadcast();
  final _playbackStateController = StreamController<PlaybackState>.broadcast();
  final _connectionStateController = StreamController<bool>.broadcast();

  Stream<WebSocketMessage> get messageStream => _messageController.stream;
  Stream<List<ActiveDevice>> get deviceListStream => _deviceListController.stream;
  Stream<String> get activeDeviceIdStream => _activeDeviceIdController.stream;
  Stream<PlaybackState> get playbackStateStream => _playbackStateController.stream;
  Stream<bool> get connectionStateStream => _connectionStateController.stream;

  bool get isConnected => _channel != null;

  Future<void> initialize(String token) async {
    _token = token;

    // Get or create device ID
    _deviceId = await _storage.read(key: 'amplify_device_id');
    if (_deviceId == null) {
      _deviceId = _uuid.v4();
      await _storage.write(key: 'amplify_device_id', value: _deviceId);
    }

    // Set device name based on platform
    if (kIsWeb) {
      _deviceName = 'Flutter Web';
    } else if (Platform.isAndroid) {
      _deviceName = 'Android Device';
    } else if (Platform.isIOS) {
      _deviceName = 'iOS Device';
    } else if (Platform.isMacOS) {
      _deviceName = 'macOS Device';
    } else if (Platform.isWindows) {
      _deviceName = 'Windows Device';
    } else if (Platform.isLinux) {
      _deviceName = 'Linux Device';
    } else {
      _deviceName = 'Unknown Device';
    }

    await _connect();
  }

  Future<void> _connect() async {
    if (_isConnecting || _token == null || _deviceId == null) return;

    _isConnecting = true;
    _shouldReconnect = true;

    try {
      // Get WebSocket URL from environment
      final environment = dotenv.env['ENVIRONMENT'] ?? 'development';
      final wsUrl = environment == 'production'
          ? dotenv.env['PROD_WS_URL'] ?? ''
          : dotenv.env['WS_URL'] ?? '';

      if (wsUrl.isEmpty) {
        debugPrint('WebSocket URL not configured');
        _isConnecting = false;
        return;
      }

      final uri = Uri.parse('$wsUrl?token=$_token&device_id=$_deviceId&device_name=${Uri.encodeComponent(_deviceName!)}');

      debugPrint('Connecting to WebSocket: ${uri.toString().replaceAll(_token!, '***')}');

      _channel = WebSocketChannel.connect(uri);

      // Wait for connection to be established
      await _channel!.ready;

      debugPrint('WebSocket connected');
      _connectionStateController.add(true);
      _isConnecting = false;

      // Request device list on connection
      sendMessage('device:get_list', {});

      // Setup ping timer to keep connection alive
      _pingTimer?.cancel();
      _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (_channel != null) {
          sendMessage('ping', {});
        }
      });

      // Listen to messages
      _channel!.stream.listen(
        (message) {
          try {
            final json = jsonDecode(message as String) as Map<String, dynamic>;
            final wsMessage = WebSocketMessage.fromJson(json);
            _handleMessage(wsMessage);
          } catch (e) {
            debugPrint('Error parsing WebSocket message: $e');
          }
        },
        onError: (error) {
          debugPrint('WebSocket error: $error');
          _handleDisconnect();
        },
        onDone: () {
          debugPrint('WebSocket connection closed');
          _handleDisconnect();
        },
        cancelOnError: false,
      );
    } catch (e) {
      debugPrint('WebSocket connection error: $e');
      _isConnecting = false;
      _handleDisconnect();
    }
  }

  void _handleMessage(WebSocketMessage message) {
    _messageController.add(message);

    switch (message.type) {
      case 'device:list_update':
        _handleDeviceListUpdate(message.data);
        break;
      case 'playback:sync':
        _handlePlaybackSync(message.data);
        break;
      case 'control:next':
      case 'control:previous':
      case 'control:seek':
      case 'control:shuffle':
      case 'control:repeat':
      case 'control:play':
      case 'control:pause':
        // These will be handled by listeners
        break;
      default:
        debugPrint('Unknown message type: ${message.type}');
    }
  }

  void _handleDeviceListUpdate(Map<String, dynamic> data) {
    try {
      final devices = (data['devices'] as List?)
          ?.map((d) => ActiveDevice.fromJson(d as Map<String, dynamic>))
          .toList() ?? [];

      _deviceListController.add(devices);

      if (data['active_device_id'] != null) {
        _activeDeviceIdController.add(data['active_device_id'] as String);
      }
    } catch (e) {
      debugPrint('Error handling device list update: $e');
    }
  }

  void _handlePlaybackSync(Map<String, dynamic> data) {
    try {
      final playbackState = PlaybackState.fromJson(data);
      _playbackStateController.add(playbackState);
    } catch (e) {
      debugPrint('Error handling playback sync: $e');
    }
  }

  void _handleDisconnect() {
    _channel = null;
    _connectionStateController.add(false);
    _pingTimer?.cancel();
    _pingTimer = null;

    // Reconnect after 3 seconds
    if (_shouldReconnect) {
      _reconnectTimer?.cancel();
      _reconnectTimer = Timer(const Duration(seconds: 3), () {
        debugPrint('Attempting to reconnect...');
        _connect();
      });
    }
  }

  void sendMessage(String type, Map<String, dynamic> data) {
    if (_channel == null) {
      debugPrint('Cannot send message: WebSocket not connected');
      return;
    }

    try {
      final message = WebSocketMessage(type: type, data: data);
      final json = jsonEncode(message.toJson());
      _channel!.sink.add(json);
      debugPrint('Sent WebSocket message: $type');
    } catch (e) {
      debugPrint('Error sending WebSocket message: $e');
    }
  }

  // Control methods
  void play({String? trackId, String? activeDeviceId}) {
    sendMessage('control:play', {
      if (trackId != null) 'track_id': trackId,
      if (activeDeviceId != null) 'active_device_id': activeDeviceId,
    });
  }

  void pause() {
    sendMessage('control:pause', {});
  }

  void next() {
    sendMessage('control:next', {});
  }

  void previous() {
    sendMessage('control:previous', {});
  }

  void seek(int position) {
    sendMessage('control:seek', {'position': position});
  }

  void toggleShuffle(bool shuffle) {
    sendMessage('control:shuffle', {'shuffle': shuffle});
  }

  void toggleRepeat(String mode) {
    sendMessage('control:repeat', {'mode': mode});
  }

  void setVolume(double volume) {
    sendMessage('control:volume', {'volume': volume});
  }

  void loadTrack(String trackId) {
    sendMessage('control:load', {'track_id': trackId});
  }

  void updatePlayback({
    required String trackId,
    required int position,
    required bool playing,
  }) {
    sendMessage('playback:update', {
      'track_id': trackId,
      'position': position,
      'playing': playing,
      'active_device_id': _deviceId,
    });
  }

  void setActiveDevice(String deviceId, int position) {
    sendMessage('device:set_active', {
      'device_id': deviceId,
      'position': position,
    });
  }

  void requestDeviceList() {
    sendMessage('device:get_list', {});
  }

  String? get deviceId => _deviceId;

  void dispose() {
    _shouldReconnect = false;
    _reconnectTimer?.cancel();
    _pingTimer?.cancel();
    _channel?.sink.close();
    _messageController.close();
    _deviceListController.close();
    _activeDeviceIdController.close();
    _playbackStateController.close();
    _connectionStateController.close();
  }
}
