// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
      id: json['id'] as String,
      emailAddresses: (json['email_addresses'] as List<dynamic>?)
          ?.map((e) => EmailAddress.fromJson(e as Map<String, dynamic>))
          .toList(),
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      profileImageUrl: json['profile_image_url'] as String?,
      createdAt: (json['created_at'] as num?)?.toInt(),
      updatedAt: (json['updated_at'] as num?)?.toInt(),
    );

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
      'id': instance.id,
      'email_addresses': instance.emailAddresses,
      'first_name': instance.firstName,
      'last_name': instance.lastName,
      'profile_image_url': instance.profileImageUrl,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };

EmailAddress _$EmailAddressFromJson(Map<String, dynamic> json) => EmailAddress(
      email: json['email'] as String?,
      emailAddress: json['email_address'] as String?,
    );

Map<String, dynamic> _$EmailAddressToJson(EmailAddress instance) =>
    <String, dynamic>{
      'email': instance.email,
      'email_address': instance.emailAddress,
    };
