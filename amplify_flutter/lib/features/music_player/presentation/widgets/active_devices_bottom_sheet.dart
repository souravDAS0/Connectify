import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/models/active_device.dart';
import '../../application/audio_player_service.dart';
import '../providers/websocket_provider.dart';

class ActiveDevicesBottomSheet extends ConsumerStatefulWidget {
  const ActiveDevicesBottomSheet({super.key});

  @override
  ConsumerState<ActiveDevicesBottomSheet> createState() =>
      _ActiveDevicesBottomSheetState();
}

class _ActiveDevicesBottomSheetState
    extends ConsumerState<ActiveDevicesBottomSheet> {
  @override
  void initState() {
    super.initState();
    // Request device list immediately when bottom sheet opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(webSocketServiceProvider).requestDeviceList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final devicesAsync = ref.watch(activeDevicesProvider);
    final activeDeviceIdAsync = ref.watch(activeDeviceIdProvider);
    final currentDeviceId = ref.watch(currentDeviceIdProvider);
    final webSocketService = ref.watch(webSocketServiceProvider);
    final audioService = ref.watch(audioPlayerServiceProvider);

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[600],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                const Icon(
                  LucideIcons.smartphone,
                  color: Colors.white,
                  size: 24,
                ),
                const SizedBox(width: 12),
                const Text(
                  'Active Devices',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(LucideIcons.x, color: Colors.grey),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          const Divider(color: Color(0xFF2A2A2A), height: 1),

          // Device list
          Flexible(
            child: devicesAsync.when(
              data: (devices) {
                if (devices.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.all(40),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          LucideIcons.smartphone,
                          size: 48,
                          color: Colors.grey,
                        ),
                        SizedBox(height: 16),
                        Text(
                          'No active devices found',
                          style: TextStyle(color: Colors.grey, fontSize: 16),
                        ),
                      ],
                    ),
                  );
                }

                return activeDeviceIdAsync.when(
                  data: (activeDeviceId) {
                    return ListView.builder(
                      shrinkWrap: true,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: devices.length,
                      itemBuilder: (context, index) {
                        final device = devices[index];
                        final isCurrentDevice = device.id == currentDeviceId;
                        final isActiveDevice = device.id == activeDeviceId;

                        return _DeviceListItem(
                          device: device,
                          isCurrentDevice: isCurrentDevice,
                          isActiveDevice: isActiveDevice,
                          onTap: () async {
                            if (device.id == activeDeviceId) {
                              // Already active, do nothing
                              return;
                            }

                            // Get current position
                            final position = audioService.audioPlayer.position;

                            // Set active device
                            webSocketService.setActiveDevice(
                              device.id,
                              position.inMilliseconds,
                            );

                            // Close bottom sheet
                            Navigator.pop(context);

                            // Show snackbar
                          },
                        );
                      },
                    );
                  },
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (error, stack) => Padding(
                    padding: const EdgeInsets.all(40),
                    child: Text(
                      'Error loading active device',
                      style: TextStyle(color: Colors.red[300]),
                    ),
                  ),
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (error, stack) => Padding(
                padding: const EdgeInsets.all(40),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.wifiOff, size: 48, color: Colors.red[300]),
                    const SizedBox(height: 16),
                    Text(
                      'Error loading devices',
                      style: TextStyle(color: Colors.red[300], fontSize: 16),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      error.toString(),
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _DeviceListItem extends StatelessWidget {
  final ActiveDevice device;
  final bool isCurrentDevice;
  final bool isActiveDevice;
  final VoidCallback onTap;

  const _DeviceListItem({
    required this.device,
    required this.isCurrentDevice,
    required this.isActiveDevice,
    required this.onTap,
  });

  IconData _getDeviceIcon() {
    final name = device.name.toLowerCase();
    if (name.contains('mobile') ||
        name.contains('android') ||
        name.contains('ios')) {
      return LucideIcons.smartphone;
    } else if (name.contains('desktop') ||
        name.contains('windows') ||
        name.contains('mac') ||
        name.contains('linux')) {
      return LucideIcons.laptop;
    } else if (name.contains('tablet') || name.contains('ipad')) {
      return LucideIcons.tablet;
    } else if (name.contains('web')) {
      return LucideIcons.monitor;
    }
    return LucideIcons.smartphone;
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            // Device icon
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isActiveDevice
                    ? Colors.green.withOpacity(0.2)
                    : const Color(0xFF2A2A2A),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _getDeviceIcon(),
                color: isActiveDevice ? Colors.green : Colors.grey,
                size: 24,
              ),
            ),

            const SizedBox(width: 16),

            // Device info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        device.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      if (isCurrentDevice) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'This Device',
                            style: TextStyle(
                              color: Colors.blue,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (isActiveDevice) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          LucideIcons.volume2,
                          color: Colors.green[300],
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Currently playing',
                          style: TextStyle(
                            color: Colors.green[300],
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            // Active indicator
            if (isActiveDevice)
              Container(
                padding: const EdgeInsets.all(8),
                child: Icon(LucideIcons.check, color: Colors.green, size: 20),
              )
            else
              const Icon(
                LucideIcons.chevronRight,
                color: Colors.grey,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
