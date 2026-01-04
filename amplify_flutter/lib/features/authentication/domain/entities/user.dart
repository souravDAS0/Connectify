import 'package:equatable/equatable.dart';

/// User entity representing the domain model
class User extends Equatable {
  final String id;
  final String? email;
  final String? firstName;
  final String? lastName;
  final String? profileImageUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    this.email,
    this.firstName,
    this.lastName,
    this.profileImageUrl,
    this.createdAt,
    this.updatedAt,
  });

  String get fullName {
    if (firstName != null && lastName != null) {
      return '$firstName $lastName';
    }
    return firstName ?? lastName ?? 'User';
  }

  String get initials {
    final first = firstName?.isNotEmpty == true ? firstName![0] : '';
    final last = lastName?.isNotEmpty == true ? lastName![0] : '';
    return (first + last).toUpperCase();
  }

  User copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? profileImageUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
    id,
    email,
    firstName,
    lastName,
    profileImageUrl,
    createdAt,
    updatedAt,
  ];
}
