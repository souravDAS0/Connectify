import { create } from "zustand";
import type { Track } from "../types";

export interface DeviceInfo {
  id: string;
  name: string;
  isActive: boolean;
}

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  queue: Track[];
  queueIndex: number;
  position: number;
  deviceId: string | null;
  activeDeviceId: string | null;
  seekTarget: number | null;
  activeDevices: DeviceInfo[];
  repeatMode: RepeatMode;
  isShuffle: boolean;
  originalQueue: Track[];

  setCurrentTrack: (track: Track) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  addToQueue: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setPosition: (position: number | ((prev: number) => number)) => void;
  setSeekTarget: (position: number | null) => void;
  setDeviceId: (id: string) => void;
  setActiveDeviceId: (id: string) => void;
  setActiveDevices: (devices: DeviceInfo[]) => void;
  cycleRepeatMode: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  setIsShuffle: (shuffle: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 1.0,
  queue: [],
  queueIndex: -1,
  position: 0,
  seekTarget: null,
  deviceId: null,
  activeDeviceId: null, // If null, assume this device or none?
  activeDevices: [],
  repeatMode: "off",
  isShuffle: false,
  originalQueue: [],

  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setPosition: (position) =>
    set((state) => ({
      position:
        typeof position === "function" ? position(state.position) : position,
    })),
  setSeekTarget: (position) => set({ seekTarget: position }),
  setDeviceId: (id) => set({ deviceId: id }),
  setActiveDeviceId: (id) => set({ activeDeviceId: id }),
  setActiveDevices: (devices) => set({ activeDevices: devices }),

  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  setQueue: (tracks) => set({ queue: tracks }),

  nextTrack: () => {
    const { queue, queueIndex, repeatMode } = get();

    // Move to next track if available
    if (queueIndex < queue.length - 1) {
      set({
        queueIndex: queueIndex + 1,
        currentTrack: queue[queueIndex + 1],
        isPlaying: true,
      });
    } else if (repeatMode === "all" && queue.length > 0) {
      // Repeat all: loop back to first track
      set({
        queueIndex: 0,
        currentTrack: queue[0],
        isPlaying: true,
      });
    } else {
      // Last track ended, stop playing
      set({ isPlaying: false });
    }
  },

  prevTrack: () => {
    const { queue, queueIndex } = get();
    if (queueIndex > 0) {
      set({
        queueIndex: queueIndex - 1,
        currentTrack: queue[queueIndex - 1],
        isPlaying: true,
      });
    }
  },

  cycleRepeatMode: () => {
    const { repeatMode } = get();
    const modes: RepeatMode[] = ["off", "all", "one"];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    set({ repeatMode: nextMode });
  },

  setRepeatMode: (mode) => set({ repeatMode: mode }),

  toggleShuffle: () => {
    const { isShuffle, queue, originalQueue, currentTrack, queueIndex } = get();

    if (!isShuffle) {
      // Shuffle: save original queue and randomize
      const newQueue = [...queue];
      const currentIndex = queueIndex;

      // Remove current track from shuffling
      if (currentIndex >= 0) {
        newQueue.splice(currentIndex, 1);
      }

      // Fisher-Yates shuffle
      for (let i = newQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
      }

      // Re-insert current track at the beginning
      if (currentTrack && currentIndex >= 0) {
        newQueue.unshift(currentTrack);
      }

      set({
        originalQueue: queue,
        queue: newQueue,
        queueIndex: currentTrack ? 0 : -1,
        isShuffle: true,
      });
    } else {
      // Unshuffle: restore original queue
      const originalIndex = originalQueue.findIndex(
        (track) => track.id === currentTrack?.id
      );

      set({
        queue: originalQueue,
        queueIndex: originalIndex >= 0 ? originalIndex : queueIndex,
        isShuffle: false,
      });
    }
  },

  setIsShuffle: (shuffle) => set({ isShuffle: shuffle }),
}));
