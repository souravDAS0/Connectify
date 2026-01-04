import React, { useEffect, useRef } from 'react';
import { getStreamUrl } from '../api/tracks';
import { sendWebSocketMessage } from '../api/websocket';
import { usePlayerStore } from '../store/usePlayerStore';

/**
 * AudioProvider - Global audio element that persists across navigation.
 * This component handles all audio playback logic and should wrap the app router.
 */
const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        currentTrack,
        isPlaying,
        volume,
        setIsPlaying,
        nextTrack,
        deviceId,
        activeDeviceId,
        setPosition,
        seekTarget,
        setSeekTarget,
    } = usePlayerStore();

    const audioRef = useRef<HTMLAudioElement>(null);
    const lastSeekTimeRef = useRef<number>(0);

    // Check if this device is the active player
    const isActiveDevice = deviceId && deviceId === activeDeviceId;

    // Audio playback control (play/pause)
    useEffect(() => {
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

        // Track last broadcast to prevent spam
        const lastBroadcastRef = {
            time: Date.now(),
            position: audioRef.current.currentTime * 1000
        };

        const syncInterval = setInterval(() => {
            if (audioRef.current) {
                const currentPosition = audioRef.current.currentTime * 1000;
                const now = Date.now();

                // Always update local state (for UI)
                usePlayerStore.getState().setPosition(currentPosition);

                // Calculate expected position since last broadcast
                const timeSinceLastBroadcast = now - lastBroadcastRef.time;
                const expectedPosition = lastBroadcastRef.position + timeSinceLastBroadcast;
                const drift = Math.abs(currentPosition - expectedPosition);

                // Only sync to server if:
                // 1. Significant drift (> 2000ms)
                // 2. Or it's been a very long time (> 10 seconds) just to be safe
                if (drift > 2000 || timeSinceLastBroadcast > 10000) {
                    sendWebSocketMessage('playback:update', {
                        track_id: currentTrack.id,
                        position: Math.round(currentPosition),
                        playing: true,
                        active_device_id: deviceId
                    });

                    // Update reference point
                    lastBroadcastRef.time = now;
                    lastBroadcastRef.position = currentPosition;
                }
            }
        }, 1000);

        return () => clearInterval(syncInterval);
    }, [isActiveDevice, isPlaying, currentTrack, deviceId]);

    // Client-side position interpolation for non-active devices
    useEffect(() => {
        if (!isActiveDevice && isPlaying && currentTrack) {
            const interpolateInterval = setInterval(() => {
                setPosition((prev) => {
                    const newPos = prev + 100; // Increment by 100ms
                    // Don't exceed track duration
                    return Math.min(newPos, currentTrack.duration * 1000);
                });
            }, 100);

            return () => clearInterval(interpolateInterval);
        }
    }, [isActiveDevice, isPlaying, currentTrack, setPosition]);

    // Volume control
    useEffect(() => {
        if (!isActiveDevice || !audioRef.current) return;
        audioRef.current.volume = volume;
    }, [volume, isActiveDevice]);

    // Handle track end
    const handleTrackEnd = () => {
        const { queue, queueIndex, repeatMode } = usePlayerStore.getState();
        const hasNextTrack = queueIndex < queue.length - 1;

        // Handle repeat one: restart current track
        if (repeatMode === 'one' && currentTrack) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setPosition(0);
                audioRef.current.play().catch(e => console.error("Replay failed:", e));
            }
            return;
        }

        // Handle repeat all: loop back to start
        if (repeatMode === 'all' && !hasNextTrack && queue.length > 0) {
            nextTrack();
            return;
        }

        // Normal: play next if available
        if (hasNextTrack) {
            nextTrack();
        } else {
            // End of queue and no repeat, just stop
            setIsPlaying(false);
        }
    };

    return (
        <>
            {/* Global Audio Element - only render when active device and has track */}
            {isActiveDevice && currentTrack && (
                <audio
                    ref={audioRef}
                    src={getStreamUrl(currentTrack.id)}
                    onEnded={handleTrackEnd}
                    onError={(e) => console.error("Audio playback error:", e.currentTarget.error)}
                />
            )}
            {children}
        </>
    );
};

export default AudioProvider;
