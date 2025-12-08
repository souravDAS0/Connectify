import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { wsService } from '../api/websocket';
import { getStreamUrl } from '../api/tracks';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from 'lucide-react';

export const PlayerControls = () => {
  const { 
    currentTrack, isPlaying, position, volume, queue,
    setPlaying, setPosition, setVolume, setTrack 
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>(null);

  // Synch audio element with store state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    // Only seek if difference is significant to avoid jitter from frequent updates
    if (Math.abs(audioRef.current.currentTime * 1000 - position) > 1000) {
      audioRef.current.currentTime = position / 1000;
    }
  }, [position, currentTrack]);

  // Handle local position updates to smooth UI
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        // Optimistically update position for UI smoothness
        // note: actual sync happens via websocket/events too
        if (audioRef.current) {
          usePlayerStore.setState({ position: audioRef.current.currentTime * 1000 });
        }
      }, 100);
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);


  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      wsService.pause(currentTrack.id, position);
      setPlaying(false);
    } else {
      wsService.play(currentTrack.id, position);
      setPlaying(true);
    }
  };

  const handleNext = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];
    setTrack(nextTrack);
    // Determine if we should auto-play
    if (isPlaying) {
      wsService.play(nextTrack.id, 0);
    }
  };

  const handlePrev = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevTrack = queue[prevIndex];
    setTrack(prevTrack);
    if (isPlaying) {
      wsService.play(prevTrack.id, 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = Number(e.target.value);
    setPosition(newPos);
    wsService.seek(newPos);
    if (audioRef.current) {
      audioRef.current.currentTime = newPos / 1000;
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    wsService.setVolume(newVol);
  };
  
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 text-white z-50">
      <audio 
        ref={audioRef} 
        src={getStreamUrl(currentTrack.id)} 
        onEnded={handleNext}
      />
      
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center w-1/4">
          {currentTrack.album_art_url ? (
             <img src={currentTrack.album_art_url} alt="Album Art" className="w-14 h-14 rounded bg-gray-800" />
          ) : (
            <div className="w-14 h-14 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">
              No Art
            </div>
          )}
          <div className="ml-4 truncate">
            <div className="font-medium truncate">{currentTrack.title}</div>
            <div className="text-sm text-gray-400 truncate">{currentTrack.artist}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center space-x-6 mb-2">
            <button className="text-gray-400 hover:text-white transition"><Shuffle size={18} /></button>
            <button onClick={handlePrev} className="text-gray-400 hover:text-white transition"><SkipBack size={24} /></button>
            <button 
              onClick={togglePlay} 
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition transform"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button onClick={handleNext} className="text-gray-400 hover:text-white transition"><SkipForward size={24} /></button>
            <button className="text-gray-400 hover:text-white transition"><Repeat size={18} /></button>
          </div>
          
          <div className="w-full flex items-center space-x-2 text-xs text-gray-400">
            <span>{formatTime(position / 1000)}</span>
            <input 
              type="range" 
              min={0} 
              max={currentTrack.duration * 1000} 
              value={position} 
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end w-1/4 space-x-2">
          <Volume2 size={20} className="text-gray-400" />
          <input 
            type="range" 
            min={0} 
            max={1} 
            step={0.01} 
            value={volume} 
            onChange={handleVolume}
            className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};
