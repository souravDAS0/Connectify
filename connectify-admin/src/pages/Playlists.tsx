import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylists, deletePlaylist } from '../api/playlists';
import PlaylistModal from '../components/PlaylistModal';
import toast from 'react-hot-toast';
import { ListMusic, Trash2, Plus, Edit } from 'lucide-react';

export default function Playlists() {
  const queryClient = useQueryClient();
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [editPlaylistId, setEditPlaylistId] = useState<string | null>(null);

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: getPlaylists,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete playlist');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Playlists</h1>
        <button
          onClick={() => setPlaylistModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Playlist
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading playlists...</div>
        </div>
      ) : playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center flex-1">
                  <ListMusic className="text-gray-400 mr-3" size={24} />
                  <div>
                    <h3 className="font-medium text-gray-900">{playlist.name}</h3>
                    {playlist.description && (
                      <p className="text-sm text-gray-500 mt-1">{playlist.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {playlist.track_ids.length} tracks
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditPlaylistId(playlist.id)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit playlist"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(playlist.id, playlist.name)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete playlist"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ListMusic className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
          <p className="text-gray-500 mb-4">Create your first playlist to get started</p>
          <button
            onClick={() => setPlaylistModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={20} />
            Create Playlist
          </button>
        </div>
      )}

      <PlaylistModal
        isOpen={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
      />

      {editPlaylistId && (
        <PlaylistModal
          playlistId={editPlaylistId}
          isOpen={!!editPlaylistId}
          onClose={() => setEditPlaylistId(null)}
        />
      )}
    </div>
  );
}
