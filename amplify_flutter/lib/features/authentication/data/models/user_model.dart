import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/user.dart';

part 'user_model.g.dart';

/// User model for data layer (maps from Supabase profiles)
@JsonSerializable()
class UserModel {
  final String id;
  final String email;
  @JsonKey(name: 'full_name')
  final String? fullName;
  @JsonKey(name: 'avatar_url')
  final String? avatarUrl;
  final String role;
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  const UserModel({
    required this.id,
    required this.email,
    this.fullName,
    this.avatarUrl,
    this.role = 'user',
    this.createdAt,
    this.updatedAt,
  });

  /// Factory constructor from JSON
  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  /// Convert to JSON
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  /// Convert from Supabase user object (auth.users + profiles)
  factory UserModel.fromSupabaseUser({
    required Map<String, dynamic> authUser,
    Map<String, dynamic>? profile,
  }) {
    final userMetadata = authUser['user_metadata'] as Map<String, dynamic>?;

    return UserModel(
      id: authUser['id'] as String,
      email: authUser['email'] as String,
      fullName: profile?['full_name'] as String? ??
                userMetadata?['full_name'] as String? ??
                userMetadata?['name'] as String?,
      avatarUrl: profile?['avatar_url'] as String? ??
                 userMetadata?['avatar_url'] as String?,
      role: profile?['role'] as String? ?? 'user',
      createdAt: authUser['created_at'] as String?,
      updatedAt: authUser['updated_at'] as String?,
    );
  }

  /// Convert to User entity
  User toEntity() {
    // Split fullName into firstName and lastName
    String? firstName;
    String? lastName;

    if (fullName != null && fullName!.isNotEmpty) {
      final parts = fullName!.split(' ');
      if (parts.isNotEmpty) {
        firstName = parts.first;
        if (parts.length > 1) {
          lastName = parts.sublist(1).join(' ');
        }
      }
    }

    return User(
      id: id,
      email: email,
      firstName: firstName,
      lastName: lastName,
      profileImageUrl: avatarUrl,
      role: role,
      createdAt: createdAt != null ? DateTime.tryParse(createdAt!) : null,
      updatedAt: updatedAt != null ? DateTime.tryParse(updatedAt!) : null,
    );
  }

  /// Create from User entity
  factory UserModel.fromEntity(User user) {
    return UserModel(
      id: user.id,
      email: user.email ?? '',
      fullName: user.fullName,
      avatarUrl: user.profileImageUrl,
      role: user.role,
      createdAt: user.createdAt?.toIso8601String(),
      updatedAt: user.updatedAt?.toIso8601String(),
    );
  }
}
