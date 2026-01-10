import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getPlaylists } from '../api/playlists';
import { ListMusic, ChevronRight, Calendar } from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function Playlists() {
  const navigate = useNavigate();

  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: getPlaylists,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Playlists</h1>
          <p className="mt-1 text-sm text-gray-600">View all user playlists</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-600">Loading playlists...</p>
            </div>
          </div>
        ) : playlists && playlists.length > 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Playlist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {playlists.map((playlist) => (
                <tr
                  key={playlist.id}
                  onClick={() => navigate(`/playlists/${playlist.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mr-4">
                        <ListMusic size={24} className="text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{playlist.name}</div>
                        {playlist.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {playlist.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {playlist.track_ids.length} tracks
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(playlist.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(playlist.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/playlists/${playlist.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                    >
                      View Details
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ListMusic className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No playlists yet</h3>
            <p className="text-sm text-gray-600">Users haven't created any playlists yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
