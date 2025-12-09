import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPlaylist, updatePlaylist, getPlaylistById, addTrackToPlaylist, removeTrackFromPlaylist } from '../api/playlists';
import { getTracks } from '../api/tracks';
import toast from 'react-hot-toast';
import { X, Search, Plus, Trash2 } from 'lucide-react';

interface PlaylistModalProps {
  playlistId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaylistModal({ playlistId, isOpen, onClose }: PlaylistModalProps) {
  const queryClient = useQueryClient();
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
    enabled: isEdit,
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
      toast.success('Playlist created successfully');
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
      toast.success('Playlist updated successfully');
      handleClose();
    },
    onError: () => {
      toast.error('Failed to update playlist');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Playlist' : 'Create Playlist'}</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {loadingPlaylist ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 border-b">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Tracks ({selectedTrackIds.length} selected)</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search tracks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {loadingTracks ? (
                <div className="text-center text-gray-500 py-8">Loading tracks...</div>
              ) : (
                <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
                  {filteredTracks.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {filteredTracks.map((track) => {
                        const isSelected = selectedTrackIds.includes(track.id);
                        return (
                          <div
                            key={track.id}
                            onClick={() => toggleTrack(track.id)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{track.title}</div>
                                <div className="text-sm text-gray-500">{track.artist}</div>
                              </div>
                              <button
                                type="button"
                                className={`ml-4 ${
                                  isSelected
                                    ? 'text-red-600 hover:text-red-700'
                                    : 'text-blue-600 hover:text-blue-700'
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

            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
