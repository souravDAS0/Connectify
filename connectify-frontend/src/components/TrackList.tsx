import React from 'react';
import { getTracks } from '../api/tracks';
import type { Track } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';
import { sendWebSocketMessage } from '../api/websocket';
import { Play, Disc } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import LoadingAnimation from './LoadingAnimation';

const TrackList: React.FC = () => {
  const { data: tracks, isLoading, error } = useQuery<Track[]>({
    queryKey: ['tracks'],
    queryFn: getTracks,
  });

  const { currentTrack, setCurrentTrack, setQueue, isPlaying } = usePlayerStore();

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    if (tracks) {
      setQueue(tracks);
    }

    // Broadcast load event
    sendWebSocketMessage('control:load', { track_id: track.id });
  };

  if (isLoading) return <LoadingAnimation />;
  if (error) return <div className="p-8 text-center text-red-500">Error loading tracks.</div>;
  if (!tracks) return null;

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Library</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {tracks.map((track) => (
          <div
            key={track.id}
            onClick={() => handlePlay(track)}
            className={`group relative bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl ${currentTrack?.id === track.id ? 'ring-2 ring-green-500' : ''
              }`}
          >
            {/* Cover Image */}
            <div className="relative aspect-square mb-4 rounded-md overflow-hidden bg-gray-800 shadow-inner group-hover:shadow-none">
              {track.album_art_url ? (
                <img
                  src={track.album_art_url}
                  alt={track.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Disc size={48} />
                </div>
              )}

              {/* Play Overlay */}
              <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${currentTrack?.id === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                <div className="bg-green-500 text-black rounded-full p-3 transform transition-transform duration-300 hover:scale-110 shadow-lg">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="w-6 h-6 flex items-center justify-center gap-1">
                      <div className="w-1.5 h-6 bg-black animate-music-bar-1" />
                      <div className="w-1.5 h-6 bg-black animate-music-bar-2" />
                      <div className="w-1.5 h-6 bg-black animate-music-bar-3" />
                    </div>
                  ) : (
                    <Play size={24} fill="currentColor" />
                  )}
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="space-y-1">
              <h3 className={`font-bold truncate ${currentTrack?.id === track.id ? 'text-green-400' : 'text-white'}`}>
                {track.title}
              </h3>
              <div className="text-sm text-gray-400 truncate">
                {track.artist}
              </div>
              <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                {track.album && (
                  <>
                    <span>{track.album}</span>
                    {(track.year) && <span className="w-1 h-1 bg-gray-600 rounded-full" />}
                  </>
                )}
                {track.year && <span>{track.year}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackList;
