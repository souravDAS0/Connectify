class ActiveDevice {
  final String id;
  final String name;
  final bool isActive;

  ActiveDevice({
    required this.id,
    required this.name,
    required this.isActive,
  });

  factory ActiveDevice.fromJson(Map<String, dynamic> json) {
    return ActiveDevice(
      id: json['id'] as String,
      name: json['name'] as String,
      isActive: json['is_active'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'is_active': isActive,
    };
  }

  ActiveDevice copyWith({
    String? id,
    String? name,
    bool? isActive,
  }) {
    return ActiveDevice(
      id: id ?? this.id,
      name: name ?? this.name,
      isActive: isActive ?? this.isActive,
    );
  }
}
