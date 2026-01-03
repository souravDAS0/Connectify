/// Route name constants for type-safe navigation
class RouteConstants {
  RouteConstants._(); // Private constructor to prevent instantiation

  // Route paths
  static const String splash = '/splash';
  static const String auth = '/auth';
  static const String home = '/';
  static const String playlists = '/';
  static const String playlistDetail = '/playlist/:id';
  static const String nowPlaying = '/now-playing';

  // Route names
  static const String splashName = 'splash';
  static const String authName = 'auth';
  static const String homeName = 'home';
  static const String playlistsName = 'playlists';
  static const String playlistDetailName = 'playlistDetail';
  static const String nowPlayingName = 'nowPlaying';
}
