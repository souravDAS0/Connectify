import React from 'react';
import { getTracks } from '../api/tracks';
import type { Track } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';
import { sendWebSocketMessage } from '../api/websocket';
import { Play, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const TrackList: React.FC = () => {
  const { data: tracks, isLoading, error } = useQuery<Track[]>({
    queryKey: ['tracks'],
    queryFn: getTracks,
  });

  const { currentTrack, setCurrentTrack, setQueue, deviceId, isPlaying } = usePlayerStore();

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    if (tracks) {
      setQueue(tracks);
    }

    // Broadcast load event
    sendWebSocketMessage('control:load', { track_id: track.id });
    
    // Claim active device if we initiate playback
    if (deviceId) {
       sendWebSocketMessage('device:set_active', { device_id: deviceId });
       usePlayerStore.getState().setActiveDeviceId(deviceId);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading tracks...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading tracks.</div>;
  if (!tracks) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Library</h2>
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-5">Title</div>
          <div className="col-span-3">Album</div>
          <div className="col-span-2">Date Added</div>
          <div className="col-span-1 text-right"><Clock size={16} /></div>
        </div>
        
        <div className="divide-y divide-gray-800">
          {tracks.map((track, index) => (
            <div 
              key={track.id}
              onClick={() => handlePlay(track)}
              className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-800 transition-colors cursor-pointer group items-center ${
                currentTrack?.id === track.id ? 'bg-gray-800 text-green-400' : 'text-gray-300'
              }`}
            >
              <div className="col-span-1 text-gray-500 group-hover:text-white">
                {currentTrack?.id === track.id && isPlaying ? (
                  <div className="w-4 h-4 animate-pulse bg-green-500 rounded-full" />
                ) : (
                  <span className="group-hover:hidden">{index + 1}</span>
                )}
                <Play size={16} className="hidden group-hover:block text-white" />
              </div>
              <div className="col-span-5">
                <div className="font-medium truncate">{track.title}</div>
                <div className="text-sm text-gray-500 truncate">{track.artist}</div>
              </div>
              <div className="col-span-3 text-gray-400 truncate">{track.album}</div>
              <div className="col-span-2 text-gray-400 text-sm">
                {new Date(track.created_at).toLocaleDateString()}
              </div>
              <div className="col-span-1 text-right text-gray-500">
                {formatDuration(track.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackList;
