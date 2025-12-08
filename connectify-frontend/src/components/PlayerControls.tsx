import { MonitorSmartphone, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { getStreamUrl } from '../api/tracks';
import { sendWebSocketMessage } from '../api/websocket';
import { usePlayerStore } from '../store/usePlayerStore';

const formatTime = (seconds: number) => {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const PlayerControls: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    setIsPlaying, 
    nextTrack, 
    prevTrack, 
    setVolume,
    deviceId,
    activeDeviceId,
    position,
    seekTarget,
    setSeekTarget
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Check if this device is the active player
  const isActiveDevice = deviceId && deviceId === activeDeviceId;

  useEffect(() => {
    // If not active device, we rely on websocket updates for UI state
    if (!isActiveDevice || !audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.play().catch(e => console.error("Play failed:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, isActiveDevice]);

  // Handle remote seek requests
  useEffect(() => {
    if (isActiveDevice && audioRef.current && typeof usePlayerStore.getState().seekTarget === 'number') {
        const target = usePlayerStore.getState().seekTarget;
        if (target !== null) {
            audioRef.current.currentTime = target / 1000;
            usePlayerStore.getState().setSeekTarget(null); // Reset after seeking
        }
    }
  }, [usePlayerStore.getState().seekTarget, isActiveDevice]);

  // Update position locally when playing and sync with server
  useEffect(() => {
    if (!isActiveDevice || !isPlaying || !audioRef.current || !currentTrack) return;
    
    // Local update interval (for smooth UI)
    const updateInterval = setInterval(() => {
        if (audioRef.current) {
            usePlayerStore.getState().setPosition(audioRef.current.currentTime * 1000);
        }
    }, 1000);

    // Server sync interval (broadcast position to other devices)
    const syncInterval = setInterval(() => {
        if (audioRef.current) {
             sendWebSocketMessage('playback:update', {
                track_id: currentTrack.id,
                position: audioRef.current.currentTime * 1000,
                playing: true,
                active_device_id: deviceId
             });
        }
    }, 1000); // Sync every 1 second
    
    return () => {
        clearInterval(updateInterval);
        clearInterval(syncInterval);
    };
  }, [isActiveDevice, isPlaying, currentTrack, deviceId]);

  useEffect(() => {
    if (!isActiveDevice || !audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume, isActiveDevice]);

  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState); // Optimistic update
    
    if (newState) {
       sendWebSocketMessage('control:play', { 
         track_id: currentTrack?.id,
         active_device_id: activeDeviceId || deviceId
       });
    } else {
       sendWebSocketMessage('control:pause', {});
    }
  };

  const handleNext = () => {
    nextTrack();
    sendWebSocketMessage('control:next', {});
  };

  const handlePrev = () => {
    prevTrack();
    sendWebSocketMessage('control:previous', {});
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    sendWebSocketMessage('control:volume', { volume: newVol });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = parseInt(e.target.value);
    usePlayerStore.getState().setPosition(newPos); // Update UI immediately
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
     const newPos = usePlayerStore.getState().position;
     // If active device, update audio
     if (isActiveDevice && audioRef.current) {
         audioRef.current.currentTime = newPos / 1000;
     }
     
     // Send seek command to server (for all devices)
     sendWebSocketMessage('control:seek', { position: newPos });
  };
  
  const handleTakeControl = () => {
    if (deviceId) {
       sendWebSocketMessage('device:set_active', { 
           device_id: deviceId,
           position: usePlayerStore.getState().position // Send current position for seamless transfer
       });
       usePlayerStore.getState().setActiveDeviceId(deviceId);
    }
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 h-24">
      {/* Audio Element only exists if Active Device */}
      {isActiveDevice && (
        <audio
          ref={audioRef}
          src={getStreamUrl(currentTrack.id)}
          onEnded={handleNext}
          onError={(e) => console.error("Audio playback error:", e.currentTarget.error)}
        />
      )}
      
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
        {/* Track Info */}
        <div className="w-1/3">
          <h3 className="text-white font-medium truncate">{currentTrack.title}</h3>
          <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center w-1/3">
          <div className="flex items-center space-x-6">
            <button onClick={handlePrev} className="text-gray-400 hover:text-white transition-colors">
              <SkipBack size={24} />
            </button>
            <button 
              onClick={togglePlay} 
              className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors text-white"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors">
              <SkipForward size={24} />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
             {isActiveDevice ? (
               <span className="text-green-500 flex items-center gap-1">
                 <MonitorSmartphone size={10} /> Playing on this device
               </span>
             ) : (
               <button 
                 onClick={handleTakeControl}
                 className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
               >
                 <MonitorSmartphone size={10} /> Play Here
               </button>
             )}
           </div>
          
           <div className="w-full flex items-center space-x-2 text-xs text-gray-400 mt-2">
             <span>{formatTime(position / 1000)}</span>
             <input 
               type="range" 
               min={0} 
               max={currentTrack.duration * 1000} 
               value={position} 
               onChange={handleSeek} 
               onMouseUp={handleSeekEnd}
               onTouchEnd={handleSeekEnd}
               className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
             />
             <span>{formatTime(currentTrack.duration)}</span>
           </div>
         </div>

        {/* Volume */}
        <div className="flex items-center justify-end w-1/3 space-x-2">
          <Volume2 size={20} className="text-gray-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 accent-blue-600"
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerControls;


