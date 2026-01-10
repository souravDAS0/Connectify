import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTracks, deleteTrack } from '../api/tracks';
import UploadModal from '../components/UploadModal';
import EditTrackModal from '../components/EditTrackModal';
import toast from 'react-hot-toast';
import { Music, Trash2, Upload, Edit } from 'lucide-react';

export default function Tracks() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editTrackId, setEditTrackId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: getTracks,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrack,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      toast.success('Track deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete track');
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tracks</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your music library
            </p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Upload className="h-4 w-4" />
            Upload Track
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-600">Loading tracks...</p>
            </div>
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plays
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tracks.map((track) => (
                  <tr key={track.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className='w-[32px] h-[32px] mr-2'>
                          {track.album_art_url ? (
                            <img
                              src={track.album_art_url}
                              alt={track.title}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                              <Music size={24} />
                            </div>
                          )}
                        </div>

                        {/* <Music className="text-gray-400 mr-3" size={20} /> */}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {track.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {track.genre || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {track.artist}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {track.album || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(track.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(track.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {track.play_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditTrackId(track.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit track"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(track.id, track.title)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete track"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Music className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No tracks yet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Upload your first track to get started
            </p>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload Track
            </button>
          </div>
        )}

      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tracks'] });
        }}
      />

        {editTrackId && (
          <EditTrackModal
            trackId={editTrackId}
            isOpen={!!editTrackId}
            onClose={() => setEditTrackId(null)}
          />
        )}
      </div>
    </div>
  );
}
