import 'package:amplify_flutter/core/widgets/app_logo.dart';
import 'package:flutter/material.dart';

class CustomAppBar extends StatelessWidget {
  const CustomAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 65,
      decoration: BoxDecoration(color: Colors.black),
      child: Column(
        children: [
          Expanded(
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  AppLogo(useFullLogo: true, height: 50),
                  Expanded(child: const SizedBox()),
                ],
              ),
            ),
          ),
          Divider(
            thickness: 1,
            height: 1,
            color: Color.fromARGB(20, 255, 255, 255),
          ),
        ],
      ),
    );
  }
}
