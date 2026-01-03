import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylistById, removeTrackFromPlaylist } from '../api/playlists';
import { getTracks } from '../api/tracks';
import { ChevronLeft, Play, Shuffle, Disc, Trash2, Edit, MoreVertical } from 'lucide-react';
import LoadingAnimation from '../components/LoadingAnimation';
import { usePlayerStore } from '../store/usePlayerStore';
import { sendWebSocketMessage } from '../api/websocket';
import toast from 'react-hot-toast';
import type { Track } from '../types';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import { useState } from 'react';

const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const PlaylistDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showEditModal, setShowEditModal] = useState(false);
    const [menuOpenTrackId, setMenuOpenTrackId] = useState<string | null>(null);

    const { setCurrentTrack, setQueue, currentTrack, isPlaying } = usePlayerStore();

    const { data: playlist, isLoading: loadingPlaylist, error: playlistError } = useQuery({
        queryKey: ['playlist', id],
        queryFn: () => getPlaylistById(id!),
        enabled: !!id,
    });

    const { data: allTracks } = useQuery({
        queryKey: ['tracks'],
        queryFn: getTracks,
    });

    const removeMutation = useMutation({
        mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
            removeTrackFromPlaylist(playlistId, trackId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlist', id] });
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            toast.success('Track removed from playlist');
        },
        onError: () => {
            toast.error('Failed to remove track');
        },
    });

    // Get full track objects for the playlist
    const playlistTracks: Track[] = React.useMemo(() => {
        if (!playlist || !allTracks) return [];
        return playlist.track_ids
            .map(trackId => allTracks.find(t => t.id === trackId))
            .filter((t): t is Track => t !== undefined);
    }, [playlist, allTracks]);

    const handlePlayAll = () => {
        if (playlistTracks.length === 0) return;
        setQueue(playlistTracks);
        setCurrentTrack(playlistTracks[0]);
        usePlayerStore.getState().setPosition(0);
        usePlayerStore.setState({ queueIndex: 0 });
        sendWebSocketMessage('control:load', { track_id: playlistTracks[0].id });
    };

    const handleShuffle = () => {
        if (playlistTracks.length === 0) return;
        const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
        setQueue(shuffled);
        setCurrentTrack(shuffled[0]);
        usePlayerStore.getState().setPosition(0);
        usePlayerStore.setState({ queueIndex: 0 });
        sendWebSocketMessage('control:load', { track_id: shuffled[0].id });
    };

    const handlePlayTrack = (track: Track, index: number) => {
        setQueue(playlistTracks);
        setCurrentTrack(track);
        usePlayerStore.getState().setPosition(0);
        usePlayerStore.setState({ queueIndex: index });
        sendWebSocketMessage('control:load', { track_id: track.id });
    };

    const handleRemoveTrack = (trackId: string) => {
        setMenuOpenTrackId(null);
        if (id) {
            removeMutation.mutate({ playlistId: id, trackId });
        }
    };

    if (loadingPlaylist) return <LoadingAnimation />;
    if (playlistError || !playlist) {
        return (
            <div className="p-8 text-center text-red-500">
                Playlist not found.
                <button onClick={() => navigate('/playlists')} className="block mt-4 text-blue-400 hover:underline">
                    Back to Playlists
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/playlists')}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white flex-1">Playlist</h2>
                <button
                    onClick={() => setShowEditModal(true)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Edit playlist"
                >
                    <Edit size={20} />
                </button>
            </div>

            {/* Playlist Info */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
                {/* Cover */}
                <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-xl mx-auto md:mx-0">
                    <Disc size={80} className="text-white/80" />
                </div>

                {/* Info */}
                <div className="flex flex-col justify-end text-center md:text-left">
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Playlist</p>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{playlist.name}</h1>
                    {playlist.description && (
                        <p className="text-gray-400 mb-4">{playlist.description}</p>
                    )}
                    <p className="text-gray-500 text-sm">{playlistTracks.length} tracks</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={handlePlayAll}
                    disabled={playlistTracks.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play size={20} fill="currentColor" />
                    Play
                </button>
                <button
                    onClick={handleShuffle}
                    disabled={playlistTracks.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Shuffle size={20} />
                    Shuffle
                </button>
            </div>

            {/* Tracks List */}
            {playlistTracks.length > 0 ? (
                <div className="divide-y divide-gray-800">
                    {playlistTracks.map((track, index) => {
                        const isCurrentTrack = currentTrack?.id === track.id;
                        const isCurrentPlaying = isCurrentTrack && isPlaying;

                        return (
                            <div
                                key={`${track.id}-${index}`}
                                className={`flex items-center gap-4 py-3 px-2 hover:bg-gray-800/50 rounded cursor-pointer group transition-colors ${isCurrentTrack ? 'bg-gray-800/50' : ''
                                    }`}
                                onClick={() => handlePlayTrack(track, index)}
                            >
                                {/* Index / Playing Indicator */}
                                <div className="w-8 text-center flex-shrink-0">
                                    {isCurrentPlaying ? (
                                        <div className="flex items-end justify-center gap-0.5 h-4">
                                            <div className="w-1 bg-green-500 animate-music-bar-1" />
                                            <div className="w-1 bg-green-500 animate-music-bar-2" />
                                            <div className="w-1 bg-green-500 animate-music-bar-3" />
                                        </div>
                                    ) : (
                                        <span className={`text-sm ${isCurrentTrack ? 'text-green-400' : 'text-gray-500'}`}>
                                            {index + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Album Art */}
                                <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                                    {track.album_art_url ? (
                                        <img src={track.album_art_url} alt={track.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            <Disc size={24} />
                                        </div>
                                    )}
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                                        {track.title}
                                    </h4>
                                    <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                                </div>

                                {/* Duration */}
                                <span className="text-sm text-gray-500 flex-shrink-0">
                                    {formatTime(track.duration)}
                                </span>

                                {/* Menu */}
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenTrackId(menuOpenTrackId === track.id ? null : track.id);
                                        }}
                                        className="p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {menuOpenTrackId === track.id && (
                                        <div className="absolute right-0 top-10 bg-gray-800 rounded-lg shadow-xl py-2 min-w-[160px] z-20">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveTrack(track.id);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Remove from playlist
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <Disc size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No tracks in this playlist yet.</p>
                    <p className="text-sm mt-2">Add tracks from the library using the context menu.</p>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <CreatePlaylistModal
                    playlistId={id}
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                />
            )}

            {/* Click outside to close menu */}
            {menuOpenTrackId && (
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpenTrackId(null)} />
            )}
        </div>
    );
};

export default PlaylistDetailPage;
