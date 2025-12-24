import { Disc, Pause, Play, SkipBack, SkipForward, Volume2, Smartphone } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { getStreamUrl } from '../api/tracks';
import { sendWebSocketMessage } from '../api/websocket';
import { usePlayerStore } from '../store/usePlayerStore';
import ActiveDevicesModal from './ActiveDevicesModal';

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
    setPosition,
    seekTarget,
    setSeekTarget,
    activeDevices,
  } = usePlayerStore();

  const [showMobileVolume, setShowMobileVolume] = useState(false);
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSeekTimeRef = useRef<number>(0);

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
    if (!isActiveDevice || !audioRef.current || seekTarget === null) return;

    // Record seek time BEFORE applying
    lastSeekTimeRef.current = Date.now();

    // Apply the seek
    audioRef.current.currentTime = seekTarget / 1000;

    // Reset seekTarget
    setSeekTarget(null);
  }, [seekTarget, isActiveDevice, setSeekTarget]);

  // Update position locally when playing and sync with server
  useEffect(() => {
    if (!isActiveDevice || !isPlaying || !audioRef.current || !currentTrack) return;

    // Combined update and sync interval
    const syncInterval = setInterval(() => {
      if (audioRef.current) {
        const currentPosition = audioRef.current.currentTime * 1000;
        const timeSinceLastSeek = Date.now() - lastSeekTimeRef.current;

        // Skip broadcast for 1000ms after seek to prevent race condition
        const shouldSkipBroadcast = timeSinceLastSeek < 1000;

        // Always update local state (for UI)
        usePlayerStore.getState().setPosition(currentPosition);

        // Only sync to server if enough time passed since last seek
        if (!shouldSkipBroadcast) {
          sendWebSocketMessage('playback:update', {
            track_id: currentTrack.id,
            position: Math.round(currentPosition),
            playing: true,
            active_device_id: deviceId
          });
        }
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [isActiveDevice, isPlaying, currentTrack, deviceId]);

  // Client-side position interpolation for non-active devices
  useEffect(() => {
    if (!isActiveDevice && isPlaying && currentTrack) {
      const interpolateInterval = setInterval(() => {
        // Only interpolate if we haven't received a server update recently

        // Skip interpolation if server update was less than 150ms ago
        // This prevents fighting with incoming playback:sync messages
        setPosition((prev) => {
          const newPos = prev + 100; // Increment by 100ms
          // Don't exceed track duration
          return Math.min(newPos, currentTrack.duration * 1000);
        });
      }, 100);

      return () => clearInterval(interpolateInterval);
    }
  }, [isActiveDevice, isPlaying, currentTrack, setPosition]);

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
    const { queue, queueIndex } = usePlayerStore.getState();
    const hasNextTrack = queueIndex < queue.length - 1;

    nextTrack();

    if (hasNextTrack) {
      // Moving to next track
      sendWebSocketMessage('control:next', {});
    } else {
      // Last track ended, broadcast stopped state
      sendWebSocketMessage('playback:update', {
        track_id: currentTrack?.id,
        position: 0,
        playing: false,
        active_device_id: activeDeviceId || deviceId
      });
    }
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

  const handleSeekEnd = () => {
    const newPos = usePlayerStore.getState().position;

    // If active device, update audio and record seek time
    if (isActiveDevice && audioRef.current) {
      lastSeekTimeRef.current = Date.now();
      audioRef.current.currentTime = newPos / 1000;
    }

    // Send seek command to server (for all devices)
    sendWebSocketMessage('control:seek', { position: newPos });
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 h-auto min-h-[6rem] md:h-24 z-50">
      {/* Audio Element only exists if Active Device */}
      {isActiveDevice && (
        <audio
          ref={audioRef}
          src={getStreamUrl(currentTrack.id)}
          onEnded={handleNext}
          onError={(e) => console.error("Audio playback error:", e.currentTarget.error)}
        />
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex max-w-7xl mx-auto items-center justify-between h-full">
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

          <div className="w-full flex items-center space-x-2 text-xs text-gray-400 mt-4">
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

        {/* Volume & Devices */}
        <div className="flex items-center justify-end w-1/3 space-x-4">
          <button
            onClick={() => setShowDevicesModal(true)}
            className="text-gray-400 hover:text-white transition-colors relative"
            title="View active devices"
          >
            <Smartphone size={20} />
            {activeDevices.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeDevices.length}
              </span>
            )}
          </button>
          <div className="flex items-center space-x-2">
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

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-full justify-between pb-1">
        {/* Top Row: Info + Controls */}
        <div className="flex items-center justify-between mb-2">
          <div className='w-[32px] h-[32px] mr-2'>
            {currentTrack.album_art_url ? (
              <img
                src={currentTrack.album_art_url}
                alt={currentTrack.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Disc size={24} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-white font-medium truncate text-sm">{currentTrack.title}</h3>
            <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="bg-blue-600 rounded-full p-2 hover:bg-blue-700 transition-colors text-white"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <button
              onClick={() => setShowDevicesModal(true)}
              className="text-gray-400 hover:text-white transition-colors relative"
            >
              <Smartphone size={20} />
              {activeDevices.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {activeDevices.length}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMobileVolume(!showMobileVolume)}
                className={`transition-colors ${showMobileVolume ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
              >
                <Volume2 size={20} />
              </button>
              {/* Mobile Volume Popup */}
              {showMobileVolume && (
                <div className="absolute  right-2 bottom-[72px] -rotate-90 -translate-y-1/2 translate-x-1/2  bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-700 flex flex-col items-center min-w-[20px] ">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-2 accent-blue-600 appearance-auto cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-1 flex flex-1 justify-between items-center gap-1">
          <input
            type="range"
            min={0}
            max={currentTrack.duration * 1000}
            value={position}
            onChange={handleSeek}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="w-[80%] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
          <span className="text-gray-400 text-xs">{formatTime(position / 1000)} / {formatTime(currentTrack.duration)}</span>
        </div>

        {/* Time Display
        <div className="text-center">
          <span className="text-gray-400 text-xs">{formatTime(position / 1000)} / {formatTime(currentTrack.duration)}</span>
        </div> */}
      </div>

      {/* Active Devices Modal */}
      <ActiveDevicesModal
        isOpen={showDevicesModal}
        onClose={() => setShowDevicesModal(false)}
      />
    </div>
  );
};

export default PlayerControls;


