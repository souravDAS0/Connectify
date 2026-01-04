import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronDown,
    MoreVertical,
    Disc,
    Shuffle,
    SkipBack,
    Play,
    Pause,
    SkipForward,
    Repeat,
    Repeat1,
    ListMusic,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { sendWebSocketMessage } from '../api/websocket';

const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// Desktop Queue Panel - always visible on right side
const DesktopQueuePanel: React.FC = () => {
    const { queue, currentTrack, isPlaying: storeIsPlaying } = usePlayerStore();

    return (
        <div className="w-96 bg-gray-900/50 border-l border-gray-700 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-700">
                <ListMusic size={20} className="text-blue-500" />
                <h2 className="text-lg font-bold text-white">Up Next</h2>
                <span className="text-sm text-gray-400">({queue.length} tracks)</span>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto">
                {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                        <ListMusic size={48} className="mb-4 opacity-50" />
                        <p className="text-sm font-medium">Queue is empty</p>
                        <p className="text-xs text-center mt-2">
                            Add songs to your queue
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {queue.map((track, index) => {
                            const isCurrentTrack = currentTrack?.id === track.id;
                            const isPlaying = isCurrentTrack && storeIsPlaying;

                            return (
                                <div
                                    key={`${track.id}-${index}`}
                                    className={`group flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${isCurrentTrack ? 'bg-gray-800/80' : ''
                                        }`}
                                >
                                    {/* Position / Playing indicator */}
                                    <div className="w-6 flex-shrink-0 text-center">
                                        {isPlaying ? (
                                            <div className="flex items-end justify-center gap-0.5 h-4">
                                                <div className="w-1 bg-green-500 animate-music-bar-1" />
                                                <div className="w-1 bg-green-500 animate-music-bar-2" />
                                                <div className="w-1 bg-green-500 animate-music-bar-3" />
                                            </div>
                                        ) : (
                                            <span className={`text-xs ${isCurrentTrack ? 'text-green-400 font-bold' : 'text-gray-500'}`}>
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Album Art */}
                                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                                        {track.album_art_url ? (
                                            <img
                                                src={track.album_art_url}
                                                alt={track.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <Disc size={16} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Track Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                                            {track.title}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                                    </div>

                                    {/* Duration */}
                                    <span className="text-xs text-gray-500">
                                        {formatTime(track.duration)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// Mobile Queue Panel - slides up from bottom
interface MobileQueuePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileQueuePanel: React.FC<MobileQueuePanelProps> = ({ isOpen, onClose }) => {
    const { queue, currentTrack, isPlaying: storeIsPlaying } = usePlayerStore();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Panel - slides up from bottom */}
            <div className="fixed left-0 right-0 bottom-0 top-16 bg-gray-900 z-50 flex flex-col shadow-2xl animate-slide-up rounded-t-3xl">
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-12 h-1 bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <ListMusic size={24} className="text-blue-500" />
                        <h2 className="text-xl font-bold text-white">Up Next</h2>
                        <span className="text-sm text-gray-400">({queue.length} tracks)</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        Done
                    </button>
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto">
                    {queue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                            <ListMusic size={64} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Queue is empty</p>
                            <p className="text-sm text-center mt-2">
                                Add songs to your queue by clicking the three-dot menu on any track
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {queue.map((track, index) => {
                                const isCurrentTrack = currentTrack?.id === track.id;
                                const isPlaying = isCurrentTrack && storeIsPlaying;

                                return (
                                    <div
                                        key={`${track.id}-${index}`}
                                        className={`group flex items-center gap-3 p-4 ${isCurrentTrack ? 'bg-gray-800/80' : ''
                                            }`}
                                    >
                                        {/* Position / Playing indicator */}
                                        <div className="w-8 flex-shrink-0 text-center">
                                            {isPlaying ? (
                                                <div className="flex items-end justify-center gap-0.5 h-4">
                                                    <div className="w-1 bg-green-500 animate-music-bar-1" />
                                                    <div className="w-1 bg-green-500 animate-music-bar-2" />
                                                    <div className="w-1 bg-green-500 animate-music-bar-3" />
                                                </div>
                                            ) : (
                                                <span className={`text-sm ${isCurrentTrack ? 'text-green-400 font-bold' : 'text-gray-500'}`}>
                                                    {index + 1}
                                                </span>
                                            )}
                                        </div>

                                        {/* Album Art */}
                                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-800 flex-shrink-0">
                                            {track.album_art_url ? (
                                                <img
                                                    src={track.album_art_url}
                                                    alt={track.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    <Disc size={20} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Track Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                                                {track.title}
                                            </p>
                                            <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                                        </div>

                                        {/* Duration */}
                                        <span className="text-sm text-gray-500">
                                            {formatTime(track.duration)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

const NowPlayingPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        currentTrack,
        isPlaying,
        setIsPlaying,
        nextTrack,
        prevTrack,
        position,
        deviceId,
        activeDeviceId,
        repeatMode,
        isShuffle,
        cycleRepeatMode,
        toggleShuffle,
    } = usePlayerStore();

    const [showQueuePanel, setShowQueuePanel] = useState(false);

    const togglePlay = () => {
        const newState = !isPlaying;
        setIsPlaying(newState);

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

        if (repeatMode === 'one' && currentTrack) {
            usePlayerStore.getState().setPosition(0);
            usePlayerStore.getState().setSeekTarget(0);
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
            sendWebSocketMessage('control:next', {});
        } else {
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

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPos = parseInt(e.target.value);
        usePlayerStore.getState().setPosition(newPos);
    };

    const handleSeekEnd = () => {
        const newPos = usePlayerStore.getState().position;
        usePlayerStore.getState().setSeekTarget(newPos);
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

    if (!currentTrack) {
        navigate('/');
        return null;
    }

    return (
        <>
            {/* ===== DESKTOP LAYOUT ===== */}
            <div className="hidden md:flex fixed inset-0 bg-gradient-to-b from-gray-800 to-gray-900 z-40">
                {/* Main content area - album art on left, queue on right */}
                <div className="flex flex-1 pb-24">
                    {/* Left side - Album Art & Track Info */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        {/* Header */}
                        <div className="absolute top-4 left-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ChevronDown size={28} />
                            </button>
                        </div>

                        <div className="absolute top-4 right-4 hidden md:hidden">
                            <button className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                                <MoreVertical size={24} />
                            </button>
                        </div>

                        {/* Album Art */}
                        <div className="w-full max-w-md aspect-square rounded-lg overflow-hidden shadow-2xl bg-gray-800 mb-8">
                            {currentTrack.album_art_url ? (
                                <img
                                    src={currentTrack.album_art_url}
                                    alt={currentTrack.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    <Disc size={120} />
                                </div>
                            )}
                        </div>

                        {/* Track Info */}
                        <div className="text-center max-w-md">
                            <h1 className="text-3xl font-bold text-white truncate">{currentTrack.title}</h1>
                            <p className="text-xl text-gray-400 mt-2">{currentTrack.artist}</p>
                            {currentTrack.album && (
                                <p className="text-sm text-gray-500 mt-1">{currentTrack.album}</p>
                            )}
                        </div>

                        {/* Progress Bar (desktop compact version) */}
                        <div className="w-full max-w-md mt-8">
                            <input
                                type="range"
                                min={0}
                                max={currentTrack.duration * 1000}
                                value={position}
                                onChange={handleSeek}
                                onMouseUp={handleSeekEnd}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            />
                            <div className="flex justify-between text-sm text-gray-400 mt-2">
                                <span>{formatTime(position / 1000)}</span>
                                <span>{formatTime(currentTrack.duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-8 mt-6">
                            <button
                                onClick={handleToggleShuffle}
                                className={`transition-colors ${isShuffle ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Shuffle size={24} />
                            </button>

                            <button
                                onClick={handlePrev}
                                className="text-white hover:text-gray-300 transition-colors"
                            >
                                <SkipBack size={32} fill="currentColor" />
                            </button>

                            <button
                                onClick={togglePlay}
                                className="bg-white text-black rounded-full p-4 hover:scale-105 transition-transform"
                            >
                                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                            </button>

                            <button
                                onClick={handleNext}
                                className="text-white hover:text-gray-300 transition-colors"
                            >
                                <SkipForward size={32} fill="currentColor" />
                            </button>

                            <button
                                onClick={handleCycleRepeat}
                                className={`transition-colors ${repeatMode !== 'off' ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
                            >
                                {repeatMode === 'one' ? <Repeat1 size={24} /> : <Repeat size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Right side - Queue Panel (always visible on desktop) */}
                    <DesktopQueuePanel />
                </div>
            </div>

            {/* ===== MOBILE LAYOUT ===== */}
            <div className="md:hidden fixed inset-0 bg-gradient-to-b from-gray-800 to-gray-900 z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ChevronDown size={28} />
                    </button>

                    <button className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
                        <MoreVertical size={24} />
                    </button>
                </div>

                {/* Album Art */}
                <div className="flex-1 flex items-center justify-center px-8 py-4">
                    <div className="w-full max-w-[300px] aspect-square rounded-lg overflow-hidden shadow-2xl bg-gray-800">
                        {currentTrack.album_art_url ? (
                            <img
                                src={currentTrack.album_art_url}
                                alt={currentTrack.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <Disc size={80} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Track Info */}
                <div className="px-8 py-2 text-center">
                    <h1 className="text-2xl font-bold text-white truncate">{currentTrack.title}</h1>
                    <p className="text-gray-400 mt-1">{currentTrack.artist}</p>
                </div>

                {/* Progress Bar */}
                <div className="px-8 py-4">
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
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                        <span>{formatTime(position / 1000)}</span>
                        <span>{formatTime(currentTrack.duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-8 py-4">
                    <button
                        onClick={handleToggleShuffle}
                        className={`transition-colors ${isShuffle ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                        <Shuffle size={24} />
                    </button>

                    <button
                        onClick={handlePrev}
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <SkipBack size={32} fill="currentColor" />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="bg-white text-black rounded-full p-4 hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                    </button>

                    <button
                        onClick={handleNext}
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <SkipForward size={32} fill="currentColor" />
                    </button>

                    <button
                        onClick={handleCycleRepeat}
                        className={`transition-colors ${repeatMode !== 'off' ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                        {repeatMode === 'one' ? <Repeat1 size={24} /> : <Repeat size={24} />}
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex justify-around border-t border-gray-700 py-3 px-4">
                    <button
                        onClick={() => setShowQueuePanel(true)}
                        className="text-sm font-medium text-white"
                    >
                        Up next
                    </button>
                </div>

                {/* Mobile Queue Panel */}
                <MobileQueuePanel
                    isOpen={showQueuePanel}
                    onClose={() => setShowQueuePanel(false)}
                />
            </div>
        </>
    );
};

export default NowPlayingPage;
