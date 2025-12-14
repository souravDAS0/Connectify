import { create } from 'zustand';
import type { Track } from '../types';

export interface DeviceInfo {
  id: string;
  name: string;
  isActive: boolean;
}

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

  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setPosition: (position) => set((state) => ({
    position: typeof position === 'function' ? position(state.position) : position
  })),
  setSeekTarget: (position) => set({ seekTarget: position }),
  setDeviceId: (id) => set({ deviceId: id }),
  setActiveDeviceId: (id) => set({ activeDeviceId: id }),
  setActiveDevices: (devices) => set({ activeDevices: devices }),

  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  setQueue: (tracks) => set({ queue: tracks }),
  
  nextTrack: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      set({ 
        queueIndex: queueIndex + 1,
        currentTrack: queue[queueIndex + 1],
        isPlaying: true 
      });
    }
  },

  prevTrack: () => {
    const { queue, queueIndex } = get();
    if (queueIndex > 0) {
      set({ 
        queueIndex: queueIndex - 1,
        currentTrack: queue[queueIndex - 1],
        isPlaying: true 
      });
    }
  },
}));
