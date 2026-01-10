import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPlaylistById } from '../api/playlists';
import { getTracks } from '../api/tracks';
import { getUsers } from '../api/users';
import { ChevronLeft, ListMusic, User, Clock, Calendar, Disc } from 'lucide-react';
import type { Track } from '../types';

const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function PlaylistDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: playlist, isLoading: loadingPlaylist, error: playlistError } = useQuery({
        queryKey: ['playlist', id],
        queryFn: () => getPlaylistById(id!),
        enabled: !!id,
    });

    const { data: allTracks } = useQuery({
        queryKey: ['tracks'],
        queryFn: getTracks,
    });

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
    });

    // Get full track objects for the playlist
    const playlistTracks: Track[] = playlist && allTracks
        ? playlist.track_ids
            .map(trackId => allTracks.find(t => t.id === trackId))
            .filter((t): t is Track => t !== undefined)
        : [];

    // Find the creator user
    const creatorUser = playlist?.created_by && users
        ? users.find(u => u.id === playlist.created_by)
        : null;

    const creatorName = creatorUser
        ? creatorUser.full_name || creatorUser.email || 'Unknown User'
        : playlist?.created_by
            ? 'Loading...'
            : 'Unknown';

    const creatorEmail = creatorUser?.email || '';

    // Calculate total duration
    const totalDuration = playlistTracks.reduce((sum, track) => sum + track.duration, 0);
    const totalMinutes = Math.floor(totalDuration / 60);

    if (loadingPlaylist) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
                        <div className="flex flex-col items-center justify-center">
                            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-sm text-gray-600">Loading playlist...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (playlistError || !playlist) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                        <h2 className="text-lg font-semibold text-red-600 mb-2">Playlist not found</h2>
                        <button
                            onClick={() => navigate('/playlists')}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            Back to Playlists
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/playlists')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-semibold text-gray-900">Playlist Details</h1>
                </div>

                {/* Playlist Info Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
                <div className="p-6 border-b">
                    <div className="flex items-start gap-6">
                        {/* Cover */}
                        <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <ListMusic size={48} className="text-white/80" />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{playlist.name}</h2>
                            {playlist.description && (
                                <p className="text-gray-600 mb-4">{playlist.description}</p>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <ListMusic size={16} />
                                    <span>{playlistTracks.length} tracks</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock size={16} />
                                    <span>{totalMinutes} min</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={16} />
                                    <span>Created: {formatDate(playlist.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={16} />
                                    <span>Updated: {formatDate(playlist.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Creator Info */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                        {creatorUser?.avatar_url ? (
                            <img
                                src={creatorUser.avatar_url}
                                alt={creatorName}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-gray-500">Created by</p>
                            <p className="font-medium text-gray-900">{creatorName}</p>
                            {creatorEmail && (
                                <p className="text-xs text-gray-500">{creatorEmail}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

                {/* Tracks Table */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Tracks in Playlist</h3>
                    </div>

                    {playlistTracks.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Track
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Artist
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Album
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {playlistTracks.map((track, index) => (
                                <tr key={track.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                                                {track.album_art_url ? (
                                                    <img src={track.album_art_url} alt={track.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Disc size={20} className="text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900">{track.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {track.artist}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {track.album || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatTime(track.duration)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <ListMusic className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600">No tracks in this playlist</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
