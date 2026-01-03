import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/storage/local_storage_service.dart';

import '../providers/auth_provider.dart';

/// Authentication page using WebView for Clerk
class AuthWrapperPage extends ConsumerStatefulWidget {
  const AuthWrapperPage({super.key});

  @override
  ConsumerState<AuthWrapperPage> createState() => _AuthWrapperPageState();
}

class _AuthWrapperPageState extends ConsumerState<AuthWrapperPage> {
  late final WebViewController _controller;
  bool _isLoading = true;

  // Clerk Hosted Login URL
  // You might need to change this if you have a custom domain or different path
  static const String _clerkLoginUrl =
      'https://modern-walrus-10.accounts.dev/sign-in';

  // The URL that Clerk redirects to after login (configured in Clerk Dashboard)
  // Usually it is your app's homepage or a callback URL.
  // We'll watch for this to know when to extract data.
  // Using a common default, but we will print ALL URLs to help debug.

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar.
          },
          onPageStarted: (String url) {
            print('[AuthWebView] Page started loading: $url');
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            print('[AuthWebView] Page finished loading: $url');
            setState(() {
              _isLoading = false;
            });

            _checkAuthStatus(url);
          },
          onWebResourceError: (WebResourceError error) {
            print('[AuthWebView] Web resource error: ${error.description}');
          },
          onNavigationRequest: (NavigationRequest request) {
            print('[AuthWebView] Navigation request: ${request.url}');
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(_clerkLoginUrl));
  }

  Future<void> _checkAuthStatus(String url) async {
    try {
      // If we are on a page that looks like a successful login
      // logic: The user was redirected to the "default-redirect" or similar, or just NOT sign-in/up
      if (url.contains('default-redirect') ||
          (!url.contains('/sign-in') && !url.contains('/sign-up'))) {
        print('[AuthWebView] Potential successful login detected at $url');

        // Get cookies
        final String cookies =
            await _controller.runJavaScriptReturningResult('document.cookie')
                as String;

        // Extract __session token
        // Format: ...; __session=eyJ...; ...
        final RegExp sessionRegex = RegExp(r'__session=([^;]+)');
        // Remove outer quotes if present from JS return value
        final cleanCookies = cookies.replaceAll('"', '');
        final match = sessionRegex.firstMatch(cleanCookies);

        if (match != null) {
          final token = match.group(1);
          if (token != null && token.isNotEmpty) {
            print(
              '[AuthWebView] Found session token: ${token.substring(0, 20)}...',
            );

            try {
              // Decode JWT to get user info
              final parts = token.split('.');
              if (parts.length >= 2) {
                final payload = parts[1];
                // Add padding if needed
                String normalized = payload;
                if (normalized.length % 4 > 0) {
                  normalized += '=' * (4 - normalized.length % 4);
                }

                final String decoded = utf8.decode(
                  base64Url.decode(normalized),
                );
                final Map<String, dynamic> data = jsonDecode(decoded);

                print('[AuthWebView] JWT Payload: $data');

                final userId = data['sub'] as String?;

                // Create user object map directly to avoid Hive type errors
                // The serialized map must match what UserModel.fromJson expects.
                // IMPORTANT: All values must be primitives (String, int, bool, List, Map) supported by JSON/Hive.
                final userMap = {
                  'id': userId ?? 'unknown',
                  'email_addresses': [
                    {'email_address': 'user@example.com'},
                  ],
                  'first_name': 'User',
                  'last_name': '',
                  'profile_image_url': null,
                  'created_at': DateTime.now().millisecondsSinceEpoch,
                  'updated_at': DateTime.now().millisecondsSinceEpoch,
                };

                // Save to local storage manually
                await LocalStorageService.saveAuthToken(token);
                await LocalStorageService.saveUserObject(userMap);
                await LocalStorageService.saveUserId(userId ?? 'unknown');

                print(
                  '[AuthWebView] User cached manually, refreshing auth state',
                );

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Login Successful! Redirecting...'),
                    ),
                  );
                }

                // Refresh our app's auth state
                await ref.read(authNotifierProvider.notifier).refresh();
              }
            } catch (e) {
              print('[AuthWebView] Error decoding JWT: $e');
            }
          }
        } else {
          print('[AuthWebView] No __session cookie found yet.');
        }
      }
    } catch (e) {
      print('[AuthWebView] Error probing page: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray900,
      appBar: AppBar(
        title: const Text('Sign In'),
        backgroundColor: AppColors.gray900,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _controller.reload(),
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading) const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
