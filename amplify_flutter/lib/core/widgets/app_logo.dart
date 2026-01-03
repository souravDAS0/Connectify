import 'package:flutter/material.dart';
import '../constants/app_assets.dart';

/// Application logo widget
class AppLogo extends StatelessWidget {
  final double? width;
  final double? height;
  final bool useFullLogo;

  const AppLogo({super.key, this.width, this.height, this.useFullLogo = true});

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      useFullLogo ? AppAssets.logoFull : AppAssets.logoIcon,
      width: width,
      height: height,
      fit: BoxFit.contain,
    );
  }
}

/// Animated pulsing logo (similar to web app)
class PulsingLogo extends StatefulWidget {
  final double? width;
  final double? height;
  final bool useFullLogo;

  const PulsingLogo({
    super.key,
    this.width,
    this.height,
    this.useFullLogo = true,
  });

  @override
  State<PulsingLogo> createState() => _PulsingLogoState();
}

class _PulsingLogoState extends State<PulsingLogo>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(scale: _scaleAnimation.value, child: child);
      },
      child: AppLogo(
        width: widget.width,
        height: widget.height,
        useFullLogo: widget.useFullLogo,
      ),
    );
  }
}
