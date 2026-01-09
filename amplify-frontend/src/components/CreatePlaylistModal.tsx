import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { createPlaylist, updatePlaylist, getPlaylistById, addTrackToPlaylist, removeTrackFromPlaylist } from '../api/playlists';
import { getTracks } from '../api/tracks';
import { X, Search, Plus, Trash2, ListMusic } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreatePlaylistModalProps {
    playlistId?: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ playlistId, isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isEdit = !!playlistId;
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

    // Load playlist data if editing
    const { data: playlist, isLoading: loadingPlaylist } = useQuery({
        queryKey: ['playlist', playlistId],
        queryFn: () => getPlaylistById(playlistId!),
        enabled: isEdit && isOpen,
    });

    // Load all tracks for selection
    const { data: tracks, isLoading: loadingTracks } = useQuery({
        queryKey: ['tracks'],
        queryFn: getTracks,
        enabled: isOpen,
    });

    useEffect(() => {
        if (playlist) {
            setFormData({
                name: playlist.name,
                description: playlist.description || '',
            });
            setSelectedTrackIds(playlist.track_ids || []);
        }
    }, [playlist]);

    // Reset form when modal opens for create
    useEffect(() => {
        if (isOpen && !isEdit) {
            setFormData({ name: '', description: '' });
            setSelectedTrackIds([]);
            setSearchTerm('');
        }
    }, [isOpen, isEdit]);

    const createMutation = useMutation({
        mutationFn: createPlaylist,
        onSuccess: async (newPlaylist) => {
            // Add tracks to the newly created playlist
            if (selectedTrackIds.length > 0) {
                await Promise.all(
                    selectedTrackIds.map(trackId => addTrackToPlaylist(newPlaylist.id, trackId))
                );
            }
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            toast.success('Playlist created!');
            handleClose();
        },
        onError: () => {
            toast.error('Failed to create playlist');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { name: string; description: string }) => updatePlaylist(playlistId!, data),
        onSuccess: async () => {
            // Update tracks: remove old ones and add new ones
            if (playlist) {
                const tracksToRemove = playlist.track_ids.filter(id => !selectedTrackIds.includes(id));
                const tracksToAdd = selectedTrackIds.filter(id => !playlist.track_ids.includes(id));

                await Promise.all([
                    ...tracksToRemove.map(trackId => removeTrackFromPlaylist(playlistId!, trackId)),
                    ...tracksToAdd.map(trackId => addTrackToPlaylist(playlistId!, trackId))
                ]);
            }
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
            toast.success('Playlist updated!');
            handleClose();
        },
        onError: () => {
            toast.error('Failed to update playlist');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Please enter a playlist name');
            return;
        }
        if (isEdit) {
            updateMutation.mutate(formData);
        } else {
            // Include user ID as created_by when creating a new playlist
            createMutation.mutate({
                ...formData,
                created_by: user?.id
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleClose = () => {
        setFormData({ name: '', description: '' });
        setSelectedTrackIds([]);
        setSearchTerm('');
        onClose();
    };

    const toggleTrack = (trackId: string) => {
        setSelectedTrackIds(prev =>
            prev.includes(trackId)
                ? prev.filter(id => id !== trackId)
                : [...prev, trackId]
        );
    };

    const filteredTracks = tracks?.filter(track =>
        track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]">
            <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <ListMusic size={24} className="text-green-500" />
                        <h2 className="text-xl font-bold text-white">
                            {isEdit ? 'Edit Playlist' : 'Create Playlist'}
                        </h2>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {loadingPlaylist ? (
                    <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                        {/* Form Fields */}
                        <div className="p-6 space-y-4 border-b border-gray-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="My Awesome Playlist"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Add an optional description..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>

                        {/* Track Selection */}
                        <div className="p-6 flex-1 overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-md font-medium text-white">
                                    Tracks ({selectedTrackIds.length} selected)
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search tracks..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            {loadingTracks ? (
                                <div className="text-center text-gray-400 py-8">Loading tracks...</div>
                            ) : (
                                <div className="flex-1 overflow-auto border border-gray-700 rounded-lg">
                                    {filteredTracks.length > 0 ? (
                                        <div className="divide-y divide-gray-800">
                                            {filteredTracks.map((track) => {
                                                const isSelected = selectedTrackIds.includes(track.id);
                                                return (
                                                    <div
                                                        key={track.id}
                                                        onClick={() => toggleTrack(track.id)}
                                                        className={`p-4 cursor-pointer hover:bg-gray-800 transition-colors ${isSelected ? 'bg-green-900/30' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`font-medium truncate ${isSelected ? 'text-green-400' : 'text-white'}`}>
                                                                    {track.title}
                                                                </div>
                                                                <div className="text-sm text-gray-400 truncate">{track.artist}</div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className={`ml-4 p-2 rounded-full transition-colors ${isSelected
                                                                    ? 'text-red-400 hover:bg-red-900/30'
                                                                    : 'text-green-400 hover:bg-green-900/30'
                                                                    }`}
                                                            >
                                                                {isSelected ? <Trash2 size={18} /> : <Plus size={18} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            {searchTerm ? 'No tracks found' : 'No tracks available'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-700 bg-gray-800/50">
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                            >
                                {createMutation.isPending || updateMutation.isPending
                                    ? 'Saving...'
                                    : isEdit
                                        ? 'Save Changes'
                                        : 'Create Playlist'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreatePlaylistModal;
