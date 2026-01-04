import { ChevronDown, ChevronUp, Disc, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Smartphone, Volume2, VolumeX } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendWebSocketMessage } from '../api/websocket';
import { usePlayerStore } from '../store/usePlayerStore';
import ActiveDevicesModal from './ActiveDevicesModal';
import QueuePanel from './QueuePanel';

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
    activeDevices,
    repeatMode,
    isShuffle,
    isNowPlayingExpanded,
    cycleRepeatMode,
    toggleShuffle,
    setIsNowPlayingExpanded,
  } = usePlayerStore();

  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const previousVolumeRef = useRef<number>(1);
  const navigate = useNavigate();

  // NOTE: Audio playback and position sync are now handled by AudioProvider
  // PlayerControls now only handles UI and sending control messages

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
    const { queue, queueIndex, repeatMode } = usePlayerStore.getState();
    const hasNextTrack = queueIndex < queue.length - 1;

    // Handle repeat one: restart current track
    if (repeatMode === 'one' && currentTrack) {
      // Reset position and keep playing - AudioProvider will handle the actual seek
      usePlayerStore.getState().setPosition(0);
      usePlayerStore.getState().setSeekTarget(0);
      // Broadcast the restart
      sendWebSocketMessage('playback:update', {
        track_id: currentTrack.id,
        position: 0,
        playing: true,
        active_device_id: activeDeviceId || deviceId
      });
      return;
    }

    nextTrack();

    if (hasNextTrack || repeatMode === 'all') {
      // Moving to next track or looping
      sendWebSocketMessage('control:next', {});
    } else {
      // Last track ended with repeat off, broadcast stopped state
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

  const [volumeDebounceTimer, setVolumeDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol); // Update local state immediately for smooth UI

    // Debounce network request
    if (volumeDebounceTimer) clearTimeout(volumeDebounceTimer);

    const timer = setTimeout(() => {
      sendWebSocketMessage('control:volume', { volume: newVol });
    }, 200);

    setVolumeDebounceTimer(timer);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPos = parseInt(e.target.value);
    usePlayerStore.getState().setPosition(newPos); // Update UI immediately
  };

  const handleSeekEnd = () => {
    const newPos = usePlayerStore.getState().position;

    // Set seek target for AudioProvider to handle
    usePlayerStore.getState().setSeekTarget(newPos);

    // Send seek command to server (for all devices)
    sendWebSocketMessage('control:seek', { position: newPos });
  };

  const handleToggleShuffle = () => {
    toggleShuffle();
    const newShuffleState = usePlayerStore.getState().isShuffle;
    sendWebSocketMessage('control:shuffle', { shuffle: newShuffleState });
  };

  const handleCycleRepeat = () => {
    cycleRepeatMode();
    const newMode = usePlayerStore.getState().repeatMode;
    sendWebSocketMessage('control:repeat', { mode: newMode });
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 h-auto min-h-[6rem] md:h-24 z-50">

      {/* Desktop Layout - YouTube Music style */}
      <div className="hidden md:flex flex-col h-full gap-2">
        {/* Main Controls Row */}
        <div className="flex items-center justify-between flex-1 px-4 gap-3">
          {/* Left: Playback Controls + Time */}
          <div className="flex items-center space-x-3">
            <button onClick={handlePrev} className="text-white hover:text-gray-300 transition-colors">
              <SkipBack size={22} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
            </button>
            <button onClick={handleNext} className="text-white hover:text-gray-300 transition-colors">
              <SkipForward size={22} fill="currentColor" />
            </button>
            <span className="text-gray-400 text-xs ml-2">
              {formatTime(position / 1000)} / {formatTime(currentTrack.duration)}
            </span>
          </div>

          {/* Center: Track Info (clickable to expand) */}
          <div
            className="flex flex-1 items-center cursor-pointer hover:bg-white/5 rounded-lg px-3 py-1 transition-colors"
            onClick={() => setIsNowPlayingExpanded(!isNowPlayingExpanded)}
          >
            <div className="w-10 h-10 rounded overflow-hidden bg-gray-700 mr-3 flex-shrink-0">
              {currentTrack.album_art_url ? (
                <img
                  src={currentTrack.album_art_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Disc size={20} />
                </div>
              )}
            </div>
            <div className="min-w-0 max-w-[200px]">
              <h3 className="text-white font-medium truncate text-md">{currentTrack.title}</h3>
              <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Right: Volume, Repeat, Shuffle, Queue, Devices, Expand */}
          <div className="flex items-center space-x-3">
            {/* Volume */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  if (volume === 0) {
                    // Unmute: restore previous volume
                    const restoredVolume = previousVolumeRef.current || 1;
                    setVolume(restoredVolume);
                    sendWebSocketMessage('control:volume', { volume: restoredVolume });
                  } else {
                    // Mute: save current volume and set to 0
                    previousVolumeRef.current = volume;
                    setVolume(0);
                    sendWebSocketMessage('control:volume', { volume: 0 });
                  }
                }}
                className="text-gray-400 hover:text-white transition-colors"
                title={volume === 0 ? 'Unmute' : 'Mute'}
              >
                {volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Repeat */}
            <button
              onClick={handleCycleRepeat}
              className={`transition-colors ${repeatMode !== 'off' ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
            </button>

            {/* Shuffle */}
            <button
              onClick={handleToggleShuffle}
              className={`transition-colors ${isShuffle ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
              title="Shuffle"
            >
              <Shuffle size={20} />
            </button>

            {/* Queue
            <button
              onClick={() => setShowQueuePanel(true)}
              className="text-gray-400 hover:text-white transition-colors relative"
              title="View queue"
            >
              <ListMusic size={20} />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button> */}

            {/* Devices */}
            <button
              onClick={() => setShowDevicesModal(true)}
              className="text-gray-400 hover:text-white transition-colors relative"
              title="View active devices"
            >
              <Smartphone size={20} />
              {activeDevices.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {activeDevices.length}
                </span>
              )}
            </button>

            {/* Expand to Now Playing */}
            <button
              onClick={() => setIsNowPlayingExpanded(!isNowPlayingExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Expand"
            >
              {
                isNowPlayingExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />
              }
            </button>
          </div>
        </div>

        {/* Progress Bar at bottom */}
        <div className="w-full flex items-center px-4 pb-1">
          <input
            type="range"
            min={0}
            max={currentTrack.duration * 1000}
            value={position}
            onChange={handleSeek}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
            style={{
              background: `linear-gradient(to right, #ef4444 ${(position / (currentTrack.duration * 1000)) * 100}%, #374151 ${(position / (currentTrack.duration * 1000)) * 100}%)`
            }}
          />
        </div>
      </div>

      {/* Mobile Layout - Simplified mini-player */}
      <div className="md:hidden flex flex-col h-full justify-between py-2">
        {/* Top Row: Info + Controls */}
        <div className="flex items-center">
          {/* Clickable area to open expanded view */}
          <div
            className="flex items-center flex-1 min-w-0 cursor-pointer"
            onClick={() => navigate(`/now-playing/${currentTrack.id}`)}
          >
            <div className='w-[44px] h-[44px] mr-3 rounded overflow-hidden bg-gray-800 flex-shrink-0'>
              {currentTrack.album_art_url ? (
                <img
                  src={currentTrack.album_art_url}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
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
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="bg-white rounded-full p-2 text-black"
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <SkipForward size={26} fill="currentColor" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDevicesModal(true);
              }}
              className="text-gray-400 hover:text-white transition-colors relative"
            >
              <Smartphone size={22} />
              {activeDevices.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {activeDevices.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full mt-2 flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={currentTrack.duration * 1000}
            value={position}
            onChange={handleSeek}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
          <span className="text-gray-400 text-xs flex-shrink-0">{formatTime(position / 1000)} / {formatTime(currentTrack.duration)}</span>
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

      {/* Queue Panel */}
      <QueuePanel
        isOpen={showQueuePanel}
        onClose={() => setShowQueuePanel(false)}
      />
    </div>
  );
};

export default PlayerControls;
