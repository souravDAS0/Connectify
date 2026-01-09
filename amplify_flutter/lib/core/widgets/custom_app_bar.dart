import 'dart:convert';
import 'package:amplify_flutter/core/constants/app_colors.dart';
import 'package:amplify_flutter/core/widgets/app_logo.dart';
import 'package:amplify_flutter/features/authentication/presentation/providers/auth_provider.dart';
import 'package:amplify_flutter/routes/route_constants.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

class CustomAppBar extends ConsumerStatefulWidget {
  const CustomAppBar({super.key});

  @override
  ConsumerState<CustomAppBar> createState() => _CustomAppBarState();
}

class _CustomAppBarState extends ConsumerState<CustomAppBar> {
  bool _showUserMenu = false;
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;
  int? _starCount;

  @override
  void initState() {
    super.initState();
    _fetchStarCount();
  }

  Future<void> _fetchStarCount() async {
    try {
      final response = await http.get(
        Uri.parse('https://api.github.com/repos/souravDAS0/Connectify'),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (mounted) {
          setState(() {
            _starCount = data['stargazers_count'];
          });
        }
      }
    } catch (e) {
      debugPrint('Failed to fetch star count: $e');
      if (mounted) {
        setState(() {
          _starCount = 0;
        });
      }
    }
  }

  Future<void> _launchUrl(String urlString) async {
    final url = Uri.parse(urlString);
    try {
      // platformDefault will open in the GitHub app if available, otherwise browser
      await launchUrl(url, mode: LaunchMode.platformDefault);
    } catch (e) {
      debugPrint('Failed to launch URL: $e');
    }
  }

  @override
  void dispose() {
    _removeOverlay();
    super.dispose();
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    _showUserMenu = false;
  }

  void _toggleUserMenu() {
    if (_showUserMenu) {
      _removeOverlay();
    } else {
      _showOverlay();
    }
  }

  void _showOverlay() {
    final overlay = Overlay.of(context);
    final renderBox = context.findRenderObject() as RenderBox;
    final size = renderBox.size;
    final offset = renderBox.localToGlobal(Offset.zero);

    _overlayEntry = OverlayEntry(
      builder: (context) => Stack(
        children: [
          // Backdrop to close menu
          Positioned.fill(
            child: GestureDetector(
              onTap: _removeOverlay,
              child: Container(color: Colors.transparent),
            ),
          ),
          // Menu dropdown
          Positioned(
            top: offset.dy + size.height + 8,
            right: MediaQuery.of(context).size.width - offset.dx - size.width,
            child: _UserMenuDropdown(
              onSignOut: () {
                _removeOverlay();
                ref.read(authNotifierProvider.notifier).signOut();
                context.go(RouteConstants.auth);
              },
            ),
          ),
        ],
      ),
    );

    overlay.insert(_overlayEntry!);
    setState(() => _showUserMenu = true);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);

    return Container(
      height: 65,
      decoration: const BoxDecoration(color: Colors.black),
      child: Column(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: CompositedTransformTarget(
                link: _layerLink,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const AppLogo(useFullLogo: true, height: 50),
                    const Expanded(child: SizedBox()),
                    // GitHub Star Button
                    _buildGitHubStarButton(),
                    const SizedBox(width: 16),
                    // User menu button
                    authState.maybeWhen(
                      authenticated: (user) => GestureDetector(
                        onTap: _toggleUserMenu,
                        child: _UserAvatar(
                          imageUrl: user.profileImageUrl,
                          initial: user.email?[0].toUpperCase() ?? 'U',
                        ),
                      ),
                      orElse: () => const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const Divider(
            thickness: 1,
            height: 1,
            color: Color.fromARGB(20, 255, 255, 255),
          ),
        ],
      ),
    );
  }

  Widget _buildGitHubStarButton() {
    return Container(
      height: 28,
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Star button
          InkWell(
            onTap: () => _launchUrl('https://github.com/souravDAS0/Connectify'),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(6),
              bottomLeft: Radius.circular(6),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                border: Border(
                  right: BorderSide(color: Colors.white.withOpacity(0.2)),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.star, size: 12, color: Colors.grey[300]),
                  const SizedBox(width: 6),
                  Text(
                    'Star',
                    style: TextStyle(
                      color: Colors.grey[300],
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Count button
          InkWell(
            onTap: () => _launchUrl(
              'https://github.com/souravDAS0/Connectify/stargazers',
            ),
            borderRadius: const BorderRadius.only(
              topRight: Radius.circular(6),
              bottomRight: Radius.circular(6),
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Text(
                _starCount?.toString() ?? '...',
                style: TextStyle(
                  color: Colors.grey[300],
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UserAvatar extends StatelessWidget {
  final String? imageUrl;
  final String initial;

  const _UserAvatar({required this.imageUrl, required this.initial});

  @override
  Widget build(BuildContext context) {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: CachedNetworkImage(
          imageUrl: imageUrl!,
          width: 36,
          height: 36,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.blue500,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                initial,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          errorWidget: (context, url, error) => Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.blue500,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                initial,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.blue500,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}

class _UserMenuDropdown extends ConsumerWidget {
  final VoidCallback onSignOut;

  const _UserMenuDropdown({required this.onSignOut});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);

    return authState.maybeWhen(
      authenticated: (user) => Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        color: Colors.transparent,
        child: Container(
          width: 256,
          decoration: BoxDecoration(
            color: AppColors.gray800,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.gray700, width: 1),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // User info section
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(color: AppColors.gray700, width: 1),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.fullName.isNotEmpty ? user.fullName : 'User',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user.email ?? '',
                      style: TextStyle(color: AppColors.gray400, fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // Sign out button
              InkWell(
                onTap: onSignOut,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(12),
                  bottomRight: Radius.circular(12),
                ),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(
                        LucideIcons.logOut,
                        size: 16,
                        color: Colors.red.shade400,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Sign out',
                        style: TextStyle(
                          color: Colors.red.shade400,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      orElse: () => const SizedBox.shrink(),
    );
  }
}
