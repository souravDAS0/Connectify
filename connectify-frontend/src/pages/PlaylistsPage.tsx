import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getPlaylists, deletePlaylist } from '../api/playlists';
import { Plus, ListMusic, MoreVertical, Trash2, Edit, Play } from 'lucide-react';
import LoadingAnimation from '../components/LoadingAnimation';
import CreatePlaylistModal from '../components/CreatePlaylistModal';
import toast from 'react-hot-toast';

const PlaylistsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editPlaylistId, setEditPlaylistId] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    const { data: playlists, isLoading, error } = useQuery({
        queryKey: ['playlists'],
        queryFn: getPlaylists,
    });

    const deleteMutation = useMutation({
        mutationFn: deletePlaylist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            toast.success('Playlist deleted');
        },
        onError: () => {
            toast.error('Failed to delete playlist');
        },
    });

    const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        setMenuOpenId(null);
        if (window.confirm(`Delete "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setMenuOpenId(null);
        setEditPlaylistId(id);
    };

    if (isLoading) return <LoadingAnimation />;
    if (error) return <div className="p-8 text-center text-red-500">Error loading playlists.</div>;

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Your Playlists</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                >
                    <Plus size={20} />
                    <span className="hidden md:inline">Create Playlist</span>
                </button>
            </div>

            {playlists && playlists.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {playlists.map((playlist) => (
                        <div
                            key={playlist.id}
                            onClick={() => navigate(`/playlists/${playlist.id}`)}
                            className="group relative bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-all duration-300 cursor-pointer"
                        >
                            {/* Playlist Cover */}
                            <div className="relative aspect-square mb-4 rounded-md overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                                <ListMusic size={48} className="text-white/80" />

                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="bg-green-500 text-black rounded-full p-3 hover:scale-110 transition-transform shadow-lg">
                                        <Play size={24} fill="currentColor" />
                                    </button>
                                </div>

                                {/* Three-dot Menu */}
                                <div className="absolute top-2 right-2 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === playlist.id ? null : playlist.id);
                                        }}
                                        className="p-1 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                                    >
                                        <MoreVertical size={18} />
                                    </button>

                                    {menuOpenId === playlist.id && (
                                        <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-xl py-2 min-w-[140px] z-20">
                                            <button
                                                onClick={(e) => handleEdit(e, playlist.id)}
                                                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <Edit size={16} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, playlist.id, playlist.name)}
                                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Playlist Info */}
                            <div className="space-y-1">
                                <h5 className="font-bold text-sm md:text-md truncate text-white">
                                    {playlist.name}
                                </h5>
                                <p className="text-xs text-gray-400">
                                    {playlist.track_ids.length} tracks
                                </p>
                                {playlist.description && (
                                    <p className="text-xs text-gray-500 truncate">
                                        {playlist.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <ListMusic size={64} className="mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No playlists yet</h3>
                    <p className="text-gray-400 mb-6">Create your first playlist to get started</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                    >
                        <Plus size={20} />
                        Create Playlist
                    </button>
                </div>
            )}

            {/* Create Modal */}
            <CreatePlaylistModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            {/* Edit Modal */}
            {editPlaylistId && (
                <CreatePlaylistModal
                    playlistId={editPlaylistId}
                    isOpen={!!editPlaylistId}
                    onClose={() => setEditPlaylistId(null)}
                />
            )}

            {/* Click outside to close menu */}
            {menuOpenId && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setMenuOpenId(null)}
                />
            )}
        </div>
    );
};

export default PlaylistsPage;
