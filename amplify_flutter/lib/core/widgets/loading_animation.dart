import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../constants/app_assets.dart';
import '../constants/app_colors.dart';

/// Loading animation widget using Lottie
class LoadingAnimation extends StatelessWidget {
  final double? width;
  final double? height;
  final bool showBackground;

  const LoadingAnimation({
    super.key,
    this.width,
    this.height,
    this.showBackground = true,
  });

  @override
  Widget build(BuildContext context) {
    final deviceWidth = MediaQuery.of(context).size.width;
    final defaultSize = deviceWidth < 600 ? 60.0 : 100.0;

    final animation = Lottie.asset(
      AppAssets.loadingAnimation,
      width: width ?? defaultSize,
      height: height ?? defaultSize,
      fit: BoxFit.contain,
    );

    if (!showBackground) {
      return animation;
    }

    return Container(
      width: double.infinity,
      height: double.infinity,
      color: AppColors.gray900,
      child: Center(child: animation),
    );
  }
}

/// Simple loading spinner
class LoadingSpinner extends StatelessWidget {
  final double size;
  final Color? color;

  const LoadingSpinner({super.key, this.size = 24, this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(color ?? AppColors.blue500),
      ),
    );
  }
}
