import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';

class SvgIcon extends StatelessWidget {
  final String assetName;
  final double? width;
  final double? height;
  final Color? color;
  final bool? fill;
  final Color? fillColor;
  const SvgIcon(
    this.assetName, {
    super.key,
    required,
    this.width,
    this.height,
    this.color = Colors.black,
    this.fill = false,
    this.fillColor,
  });

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      assetName,
      width: width,
      height: height,
      colorFilter: ColorFilter.mode(color!, BlendMode.srcIn),
    );
  }
}
