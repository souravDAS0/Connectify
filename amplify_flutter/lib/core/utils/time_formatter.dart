/// Time formatting utilities
class TimeFormatter {
  TimeFormatter._(); // Private constructor to prevent instantiation

  /// Format duration in seconds to MM:SS or HH:MM:SS format
  static String formatDuration(int seconds) {
    if (seconds < 0) return '0:00';

    final hours = seconds ~/ 3600;
    final minutes = (seconds % 3600) ~/ 60;
    final secs = seconds % 60;

    if (hours > 0) {
      return '$hours:${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
    }

    return '$minutes:${secs.toString().padLeft(2, '0')}';
  }

  /// Format duration from Duration object
  static String formatDurationObject(Duration duration) {
    return formatDuration(duration.inSeconds);
  }

  /// Format milliseconds to MM:SS or HH:MM:SS format
  static String formatMilliseconds(int milliseconds) {
    return formatDuration(milliseconds ~/ 1000);
  }

  /// Parse MM:SS or HH:MM:SS format to seconds
  static int parseDuration(String formattedTime) {
    final parts = formattedTime.split(':').map(int.parse).toList();

    if (parts.length == 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else if (parts.length == 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return 0;
  }

  /// Format relative time (e.g., "2 hours ago", "just now")
  static String formatRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'just now';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays < 7) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    } else if (difference.inDays < 30) {
      final weeks = difference.inDays ~/ 7;
      return '$weeks ${weeks == 1 ? 'week' : 'weeks'} ago';
    } else if (difference.inDays < 365) {
      final months = difference.inDays ~/ 30;
      return '$months ${months == 1 ? 'month' : 'months'} ago';
    } else {
      final years = difference.inDays ~/ 365;
      return '$years ${years == 1 ? 'year' : 'years'} ago';
    }
  }
}
