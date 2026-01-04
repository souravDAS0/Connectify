import 'package:equatable/equatable.dart';

/// Base class for all failures in the application
abstract class Failure extends Equatable {
  final String message;
  final int? code;

  const Failure(this.message, [this.code]);

  @override
  List<Object?> get props => [message, code];
}

/// Authentication failures
class AuthFailure extends Failure {
  const AuthFailure(super.message, [super.code]);
}

/// Network failures
class NetworkFailure extends Failure {
  const NetworkFailure(super.message, [super.code]);
}

/// Server failures
class ServerFailure extends Failure {
  const ServerFailure(super.message, [super.code]);
}

/// Cache failures
class CacheFailure extends Failure {
  const CacheFailure(super.message, [super.code]);
}

/// Validation failures
class ValidationFailure extends Failure {
  const ValidationFailure(super.message, [super.code]);
}

/// Unknown/Generic failures
class UnknownFailure extends Failure {
  const UnknownFailure(super.message, [super.code]);
}
