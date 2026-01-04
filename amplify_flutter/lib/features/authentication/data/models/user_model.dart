import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/user.dart';

part 'user_model.g.dart';

/// User model for data layer (maps from Clerk user)
@JsonSerializable()
class UserModel {
  final String id;
  @JsonKey(name: 'email_addresses')
  final List<EmailAddress>? emailAddresses;
  @JsonKey(name: 'first_name')
  final String? firstName;
  @JsonKey(name: 'last_name')
  final String? lastName;
  @JsonKey(name: 'profile_image_url')
  final String? profileImageUrl;
  @JsonKey(name: 'created_at')
  final int? createdAt;
  @JsonKey(name: 'updated_at')
  final int? updatedAt;

  const UserModel({
    required this.id,
    this.emailAddresses,
    this.firstName,
    this.lastName,
    this.profileImageUrl,
    this.createdAt,
    this.updatedAt,
  });

  /// Factory constructor from JSON
  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  /// Convert to JSON
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  /// Convert from Clerk user object
  factory UserModel.fromClerkUser(dynamic clerkUser) {
    return UserModel(
      id: clerkUser.id as String,
      emailAddresses: clerkUser.emailAddresses != null
          ? (clerkUser.emailAddresses as List)
                .map((e) => EmailAddress.fromJson(e as Map<String, dynamic>))
                .toList()
          : null,
      firstName: clerkUser.firstName as String?,
      lastName: clerkUser.lastName as String?,
      profileImageUrl: clerkUser.profileImageUrl as String?,
      createdAt: clerkUser.createdAt as int?,
      updatedAt: clerkUser.updatedAt as int?,
    );
  }

  /// Convert to User entity
  User toEntity() {
    return User(
      id: id,
      email: emailAddresses?.firstOrNull?.email,
      firstName: firstName,
      lastName: lastName,
      profileImageUrl: profileImageUrl,
      createdAt: createdAt != null
          ? DateTime.fromMillisecondsSinceEpoch(createdAt!)
          : null,
      updatedAt: updatedAt != null
          ? DateTime.fromMillisecondsSinceEpoch(updatedAt!)
          : null,
    );
  }

  /// Create from User entity
  factory UserModel.fromEntity(User user) {
    return UserModel(
      id: user.id,
      emailAddresses: user.email != null
          ? [EmailAddress(email: user.email!)]
          : null,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt?.millisecondsSinceEpoch,
      updatedAt: user.updatedAt?.millisecondsSinceEpoch,
    );
  }
}

/// Email address model
@JsonSerializable()
class EmailAddress {
  final String email;
  @JsonKey(name: 'email_address')
  final String? emailAddress;

  EmailAddress({String? email, this.emailAddress})
    : email = email ?? emailAddress ?? '';

  factory EmailAddress.fromJson(Map<String, dynamic> json) =>
      _$EmailAddressFromJson(json);

  Map<String, dynamic> toJson() => _$EmailAddressToJson(this);
}
