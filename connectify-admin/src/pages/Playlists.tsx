import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaylists, deletePlaylist } from '../api/playlists';
import toast from 'react-hot-toast';
import { ListMusic, Trash2 } from 'lucide-react';

export default function Playlists() {
  const queryClient = useQueryClient();

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
                <button
                  onClick={() => handleDelete(playlist.id, playlist.name)}
                  className="text-red-600 hover:text-red-900 ml-2"
                  title="Delete playlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ListMusic className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
          <p className="text-gray-500">Playlists will appear here</p>
        </div>
      )}
    </div>
  );
}
