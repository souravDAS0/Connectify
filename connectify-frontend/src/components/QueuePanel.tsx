import React from 'react';
import { X, Disc, Music2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

interface QueuePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const QueuePanel: React.FC<QueuePanelProps> = ({ isOpen, onClose }) => {
    const { queue, currentTrack, removeFromQueue, isPlaying: storeIsPlaying } = usePlayerStore();

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-24 w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <Music2 size={24} className="text-blue-500" />
                        <h2 className="text-xl font-bold text-white">Queue</h2>
                        <span className="text-sm text-gray-400">({queue.length} tracks)</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Queue List */}
                <div className="flex-1 overflow-y-auto">
                    {queue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                            <Music2 size={64} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Queue is empty</p>
                            <p className="text-sm text-center mt-2">
                                Add songs to your queue by clicking the three-dot menu on any track
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {queue.map((track, index) => {
                                // Use currentTrack.id for reliable comparison
                                const isCurrentTrack = currentTrack?.id === track.id;
                                const isPlaying = isCurrentTrack && storeIsPlaying;

                                return (
                                    <div
                                        key={`${track.id}-${index}`}
                                        className={`group flex items-center gap-3 p-3 hover:bg-gray-800/50 transition-colors ${isCurrentTrack ? 'bg-gray-800/80' : ''
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
                                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                                            {track.album_art_url ? (
                                                <img
                                                    src={track.album_art_url}
                                                    alt={track.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    <Disc size={24} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Track Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-medium truncate ${isCurrentTrack ? 'text-green-400' : 'text-white'}`}>
                                                {track.title}
                                            </h4>
                                            <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                                        </div>

                                        {/* Duration */}
                                        <span className="text-sm text-gray-500 flex-shrink-0">
                                            {formatTime(track.duration)}
                                        </span>

                                        {/* Remove Button (show on hover, hide for current track) */}
                                        {!isCurrentTrack && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFromQueue(track.id);
                                                }}
                                                className="p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                                title="Remove from queue"
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Now Playing Footer (if there's a current track) */}
                {currentTrack && (
                    <div className="border-t border-gray-800 p-4 bg-gray-800/50">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Now Playing</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-700">
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
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-green-400 truncate">{currentTrack.title}</h4>
                                <p className="text-sm text-gray-400 truncate">{currentTrack.artist}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default QueuePanel;
