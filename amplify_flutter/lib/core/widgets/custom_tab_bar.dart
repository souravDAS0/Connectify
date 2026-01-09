import 'package:flutter/material.dart';

class CustomTabBar extends StatefulWidget {
  final List<TabItem> tabs;
  final List<Widget> children;
  final ValueChanged<int>? onTabChanged;
  final int initialTab;
  final ScrollPhysics physics;
  const CustomTabBar({
    super.key,
    required this.tabs,
    required this.children,
    this.onTabChanged,
    this.initialTab = 0,
    this.physics = const BouncingScrollPhysics(),
  });

  @override
  State<CustomTabBar> createState() => _CustomTabBarState();
}

class _CustomTabBarState extends State<CustomTabBar>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: widget.tabs.length,
      vsync: this,
      initialIndex: widget.initialTab,
    );

    _tabController.addListener(() {
      if (widget.onTabChanged != null) {
        widget.onTabChanged!(_tabController.index);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          decoration: const BoxDecoration(color: Colors.black),
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            children: [
              TabBar(
                controller: _tabController,
                isScrollable: false,
                labelColor: const Color.fromARGB(255, 255, 255, 255),
                unselectedLabelColor: const Color.fromARGB(255, 156, 163, 175),
                dividerColor: const Color.fromARGB(20, 255, 255, 255),
                indicator: CustomTabIndicator(
                  color: const Color.fromARGB(255, 34, 197, 94),
                  width: 100,
                  height: 2,
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                padding: EdgeInsets.zero,
                labelPadding: EdgeInsets.zero,
                tabs: widget.tabs.map((tab) {
                  return SizedBox(
                    height: 40,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (tab.icon != null) ...[
                          Icon(tab.icon!, size: 16),
                          const SizedBox(width: 8),
                        ],

                        Text(
                          tab.label,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            physics: const NeverScrollableScrollPhysics(),
            children: widget.children.map((child) {
              return Column(
                children: [
                  Expanded(child: child), // Forces all tabs to take full space
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class CustomTabIndicator extends Decoration {
  final Color color;
  final double width;
  final double height;

  const CustomTabIndicator({
    required this.color,
    required this.width,
    this.height = 2,
  });

  @override
  BoxPainter createBoxPainter([VoidCallback? onChanged]) {
    return _CustomTabIndicatorPainter(
      color: color,
      width: width,
      height: height,
    );
  }
}

class _CustomTabIndicatorPainter extends BoxPainter {
  final Color color;
  final double width;
  final double height;

  _CustomTabIndicatorPainter({
    required this.color,
    required this.width,
    required this.height,
  });

  @override
  void paint(Canvas canvas, Offset offset, ImageConfiguration configuration) {
    assert(configuration.size != null);

    final Rect rect = offset & configuration.size!;
    final Paint paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final double center = rect.center.dx;
    final double left = center - (width / 2);

    canvas.drawRect(
      Rect.fromLTWH(left, configuration.size!.height - height, width, height),
      paint,
    );
  }
}

class TabItem {
  final String label;
  final IconData? icon;

  TabItem({required this.label, this.icon});
}
