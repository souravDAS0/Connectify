import 'dart:async';
import 'package:flutter/material.dart';

class MarqueeWidget extends StatefulWidget {
  final Widget child;
  final Axis direction;
  final Duration pauseDuration;
  final double pixelsPerSecond;
  final double gap;
  final double height;

  const MarqueeWidget({
    super.key,
    required this.child,
    this.direction = Axis.horizontal,
    this.pauseDuration = const Duration(milliseconds: 1000),
    this.pixelsPerSecond = 30.0,
    this.gap = 50.0,
    this.height = 40.0,
  });

  @override
  State<MarqueeWidget> createState() => _MarqueeWidgetState();
}

class _MarqueeWidgetState extends State<MarqueeWidget> {
  late ScrollController _scrollController;
  Timer? _timer;
  bool _isOverflowing = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initScroll());
  }

  @override
  void didUpdateWidget(MarqueeWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Restart logic if content changes
    if (widget.child != oldWidget.child) {
      _stopScrolling();
      _scrollController.jumpTo(0);
      WidgetsBinding.instance.addPostFrameCallback((_) => _initScroll());
    }
  }

  @override
  void dispose() {
    _stopScrolling();
    _scrollController.dispose();
    super.dispose();
  }

  void _initScroll() {
    if (!mounted || !_scrollController.hasClients) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    if (maxScroll > 0) {
      if (!_isOverflowing) {
        setState(() {
          _isOverflowing = true;
        });
        _startScrolling();
      }
    } else {
      if (_isOverflowing) {
        setState(() {
          _isOverflowing = false;
        });
      }
    }
  }

  void _startScrolling() async {
    _timer?.cancel();
    await Future.delayed(widget.pauseDuration);
    if (!mounted) return;

    _timer = Timer.periodic(const Duration(milliseconds: 16), (timer) {
      if (!mounted || !_scrollController.hasClients || !_isOverflowing) {
        timer.cancel();
        return;
      }

      final currentOffset = _scrollController.offset;
      _scrollController.jumpTo(currentOffset + (widget.pixelsPerSecond / 60));
    });
  }

  void _stopScrolling() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // For horizontal scrolling, we need bounded height in the cross-axis
        final hasInfiniteHeight = constraints.maxHeight.isInfinite;
        final effectiveHeight = hasInfiniteHeight
            ? widget.height
            : constraints.maxHeight;

        final child = _isOverflowing
            ? ListView.builder(
                controller: _scrollController,
                scrollDirection: widget.direction,
                physics: const NeverScrollableScrollPhysics(),
                itemBuilder: (context, index) {
                  if (index.isEven) {
                    return widget.child;
                  } else {
                    return SizedBox(width: widget.gap);
                  }
                },
              )
            : SingleChildScrollView(
                controller: _scrollController,
                scrollDirection: widget.direction,
                physics: const NeverScrollableScrollPhysics(),
                child: widget.child,
              );

        return SizedBox(
          width: constraints.maxWidth,
          height: effectiveHeight,
          child: child,
        );
      },
    );
  }
}
