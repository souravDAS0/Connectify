import { useQuery } from '@tanstack/react-query';
import { getAnalyticsStats } from '../api/analytics';
import { getPopularTracks, getRecentTracks } from '../api/tracks';
import { Music, PlayCircle, ListMusic, Users } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
// import { dark } from "@clerk/themes";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}

function StatsCard({ icon, label, value, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: getAnalyticsStats,
  });

  const { data: popularTracks } = useQuery({
    queryKey: ['popular-tracks'],
    queryFn: () => getPopularTracks(5),
  });

  const { data: recentTracks } = useQuery({
    queryKey: ['recent-tracks'],
    queryFn: () => getRecentTracks(5),
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      <div className='flex items-start justify-between w-full'>

        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        <UserButton
          userProfileMode="modal"
        />
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="text-center py-12">Loading stats...</div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<Music className="text-white" size={24} />}
            label="Total Tracks"
            value={stats.total_tracks}
            color="bg-blue-500"
          />
          <StatsCard
            icon={<PlayCircle className="text-white" size={24} />}
            label="Total Plays"
            value={stats.total_plays}
            color="bg-green-500"
          />
          <StatsCard
            icon={<ListMusic className="text-white" size={24} />}
            label="Playlists"
            value={stats.total_playlists}
            color="bg-purple-500"
          />
          <StatsCard
            icon={<Users className="text-white" size={24} />}
            label="Users"
            value={stats.total_users}
            color="bg-orange-500"
          />
        </div>
      ) : null}

      {/* Popular and Recent Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Tracks */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">Popular Tracks</h2>
          </div>
          <div className="p-6">
            {popularTracks && popularTracks.length > 0 ? (
              <div className="space-y-4">
                {popularTracks.map((track, index) => (
                  <div key={track.id} className="flex items-center">
                    <div className="w-8 text-center font-bold text-gray-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="font-medium text-gray-900">{track.title}</div>
                      <div className="text-sm text-gray-500">{track.artist}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {track.play_count} plays
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDuration(track.duration)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No tracks yet</p>
            )}
          </div>
        </div>

        {/* Recent Tracks */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">Recently Added</h2>
          </div>
          <div className="p-6">
            {recentTracks && recentTracks.length > 0 ? (
              <div className="space-y-4">
                {recentTracks.map((track) => (
                  <div key={track.id} className="flex items-center">
                    <Music className="text-gray-400" size={20} />
                    <div className="flex-1 ml-4">
                      <div className="font-medium text-gray-900">{track.title}</div>
                      <div className="text-sm text-gray-500">{track.artist}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {new Date(track.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No tracks yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
