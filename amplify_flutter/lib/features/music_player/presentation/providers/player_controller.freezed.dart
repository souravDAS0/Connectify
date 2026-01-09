// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'player_controller.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$PlayerState {
  List<Track> get tracks => throw _privateConstructorUsedError;
  Track? get currentTrack => throw _privateConstructorUsedError;
  bool get isPlaying => throw _privateConstructorUsedError;
  bool get isLoading => throw _privateConstructorUsedError;
  String? get error => throw _privateConstructorUsedError;
  Duration get position => throw _privateConstructorUsedError;
  Duration get duration => throw _privateConstructorUsedError;
  bool get isShuffleEnabled => throw _privateConstructorUsedError;
  ja.LoopMode get repeatMode => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $PlayerStateCopyWith<PlayerState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PlayerStateCopyWith<$Res> {
  factory $PlayerStateCopyWith(
          PlayerState value, $Res Function(PlayerState) then) =
      _$PlayerStateCopyWithImpl<$Res, PlayerState>;
  @useResult
  $Res call(
      {List<Track> tracks,
      Track? currentTrack,
      bool isPlaying,
      bool isLoading,
      String? error,
      Duration position,
      Duration duration,
      bool isShuffleEnabled,
      ja.LoopMode repeatMode});

  $TrackCopyWith<$Res>? get currentTrack;
}

/// @nodoc
class _$PlayerStateCopyWithImpl<$Res, $Val extends PlayerState>
    implements $PlayerStateCopyWith<$Res> {
  _$PlayerStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tracks = null,
    Object? currentTrack = freezed,
    Object? isPlaying = null,
    Object? isLoading = null,
    Object? error = freezed,
    Object? position = null,
    Object? duration = null,
    Object? isShuffleEnabled = null,
    Object? repeatMode = null,
  }) {
    return _then(_value.copyWith(
      tracks: null == tracks
          ? _value.tracks
          : tracks // ignore: cast_nullable_to_non_nullable
              as List<Track>,
      currentTrack: freezed == currentTrack
          ? _value.currentTrack
          : currentTrack // ignore: cast_nullable_to_non_nullable
              as Track?,
      isPlaying: null == isPlaying
          ? _value.isPlaying
          : isPlaying // ignore: cast_nullable_to_non_nullable
              as bool,
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      position: null == position
          ? _value.position
          : position // ignore: cast_nullable_to_non_nullable
              as Duration,
      duration: null == duration
          ? _value.duration
          : duration // ignore: cast_nullable_to_non_nullable
              as Duration,
      isShuffleEnabled: null == isShuffleEnabled
          ? _value.isShuffleEnabled
          : isShuffleEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      repeatMode: null == repeatMode
          ? _value.repeatMode
          : repeatMode // ignore: cast_nullable_to_non_nullable
              as ja.LoopMode,
    ) as $Val);
  }

  @override
  @pragma('vm:prefer-inline')
  $TrackCopyWith<$Res>? get currentTrack {
    if (_value.currentTrack == null) {
      return null;
    }

    return $TrackCopyWith<$Res>(_value.currentTrack!, (value) {
      return _then(_value.copyWith(currentTrack: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$PlayerStateImplCopyWith<$Res>
    implements $PlayerStateCopyWith<$Res> {
  factory _$$PlayerStateImplCopyWith(
          _$PlayerStateImpl value, $Res Function(_$PlayerStateImpl) then) =
      __$$PlayerStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {List<Track> tracks,
      Track? currentTrack,
      bool isPlaying,
      bool isLoading,
      String? error,
      Duration position,
      Duration duration,
      bool isShuffleEnabled,
      ja.LoopMode repeatMode});

  @override
  $TrackCopyWith<$Res>? get currentTrack;
}

/// @nodoc
class __$$PlayerStateImplCopyWithImpl<$Res>
    extends _$PlayerStateCopyWithImpl<$Res, _$PlayerStateImpl>
    implements _$$PlayerStateImplCopyWith<$Res> {
  __$$PlayerStateImplCopyWithImpl(
      _$PlayerStateImpl _value, $Res Function(_$PlayerStateImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? tracks = null,
    Object? currentTrack = freezed,
    Object? isPlaying = null,
    Object? isLoading = null,
    Object? error = freezed,
    Object? position = null,
    Object? duration = null,
    Object? isShuffleEnabled = null,
    Object? repeatMode = null,
  }) {
    return _then(_$PlayerStateImpl(
      tracks: null == tracks
          ? _value._tracks
          : tracks // ignore: cast_nullable_to_non_nullable
              as List<Track>,
      currentTrack: freezed == currentTrack
          ? _value.currentTrack
          : currentTrack // ignore: cast_nullable_to_non_nullable
              as Track?,
      isPlaying: null == isPlaying
          ? _value.isPlaying
          : isPlaying // ignore: cast_nullable_to_non_nullable
              as bool,
      isLoading: null == isLoading
          ? _value.isLoading
          : isLoading // ignore: cast_nullable_to_non_nullable
              as bool,
      error: freezed == error
          ? _value.error
          : error // ignore: cast_nullable_to_non_nullable
              as String?,
      position: null == position
          ? _value.position
          : position // ignore: cast_nullable_to_non_nullable
              as Duration,
      duration: null == duration
          ? _value.duration
          : duration // ignore: cast_nullable_to_non_nullable
              as Duration,
      isShuffleEnabled: null == isShuffleEnabled
          ? _value.isShuffleEnabled
          : isShuffleEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      repeatMode: null == repeatMode
          ? _value.repeatMode
          : repeatMode // ignore: cast_nullable_to_non_nullable
              as ja.LoopMode,
    ));
  }
}

/// @nodoc

class _$PlayerStateImpl with DiagnosticableTreeMixin implements _PlayerState {
  const _$PlayerStateImpl(
      {final List<Track> tracks = const [],
      this.currentTrack,
      this.isPlaying = false,
      this.isLoading = false,
      this.error,
      this.position = Duration.zero,
      this.duration = Duration.zero,
      this.isShuffleEnabled = false,
      this.repeatMode = ja.LoopMode.off})
      : _tracks = tracks;

  final List<Track> _tracks;
  @override
  @JsonKey()
  List<Track> get tracks {
    if (_tracks is EqualUnmodifiableListView) return _tracks;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tracks);
  }

  @override
  final Track? currentTrack;
  @override
  @JsonKey()
  final bool isPlaying;
  @override
  @JsonKey()
  final bool isLoading;
  @override
  final String? error;
  @override
  @JsonKey()
  final Duration position;
  @override
  @JsonKey()
  final Duration duration;
  @override
  @JsonKey()
  final bool isShuffleEnabled;
  @override
  @JsonKey()
  final ja.LoopMode repeatMode;

  @override
  String toString({DiagnosticLevel minLevel = DiagnosticLevel.info}) {
    return 'PlayerState(tracks: $tracks, currentTrack: $currentTrack, isPlaying: $isPlaying, isLoading: $isLoading, error: $error, position: $position, duration: $duration, isShuffleEnabled: $isShuffleEnabled, repeatMode: $repeatMode)';
  }

  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties
      ..add(DiagnosticsProperty('type', 'PlayerState'))
      ..add(DiagnosticsProperty('tracks', tracks))
      ..add(DiagnosticsProperty('currentTrack', currentTrack))
      ..add(DiagnosticsProperty('isPlaying', isPlaying))
      ..add(DiagnosticsProperty('isLoading', isLoading))
      ..add(DiagnosticsProperty('error', error))
      ..add(DiagnosticsProperty('position', position))
      ..add(DiagnosticsProperty('duration', duration))
      ..add(DiagnosticsProperty('isShuffleEnabled', isShuffleEnabled))
      ..add(DiagnosticsProperty('repeatMode', repeatMode));
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PlayerStateImpl &&
            const DeepCollectionEquality().equals(other._tracks, _tracks) &&
            (identical(other.currentTrack, currentTrack) ||
                other.currentTrack == currentTrack) &&
            (identical(other.isPlaying, isPlaying) ||
                other.isPlaying == isPlaying) &&
            (identical(other.isLoading, isLoading) ||
                other.isLoading == isLoading) &&
            (identical(other.error, error) || other.error == error) &&
            (identical(other.position, position) ||
                other.position == position) &&
            (identical(other.duration, duration) ||
                other.duration == duration) &&
            (identical(other.isShuffleEnabled, isShuffleEnabled) ||
                other.isShuffleEnabled == isShuffleEnabled) &&
            (identical(other.repeatMode, repeatMode) ||
                other.repeatMode == repeatMode));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType,
      const DeepCollectionEquality().hash(_tracks),
      currentTrack,
      isPlaying,
      isLoading,
      error,
      position,
      duration,
      isShuffleEnabled,
      repeatMode);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PlayerStateImplCopyWith<_$PlayerStateImpl> get copyWith =>
      __$$PlayerStateImplCopyWithImpl<_$PlayerStateImpl>(this, _$identity);
}

abstract class _PlayerState implements PlayerState {
  const factory _PlayerState(
      {final List<Track> tracks,
      final Track? currentTrack,
      final bool isPlaying,
      final bool isLoading,
      final String? error,
      final Duration position,
      final Duration duration,
      final bool isShuffleEnabled,
      final ja.LoopMode repeatMode}) = _$PlayerStateImpl;

  @override
  List<Track> get tracks;
  @override
  Track? get currentTrack;
  @override
  bool get isPlaying;
  @override
  bool get isLoading;
  @override
  String? get error;
  @override
  Duration get position;
  @override
  Duration get duration;
  @override
  bool get isShuffleEnabled;
  @override
  ja.LoopMode get repeatMode;
  @override
  @JsonKey(ignore: true)
  _$$PlayerStateImplCopyWith<_$PlayerStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
