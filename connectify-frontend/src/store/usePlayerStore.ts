import { create } from 'zustand';
import type { Track, PlaybackState } from '../types';

interface PlayerStore extends PlaybackState {
  queue: Track[];
  setTrack: (track: Track) => void;
  setPlaying: (isPlaying: boolean) => void;
  setPosition: (position: number) => void;
  setVolume: (volume: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: 'none' | 'one' | 'all') => void;
  setQueue: (tracks: Track[]) => void;
  updateState: (state: Partial<PlaybackState>) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentTrack: null,
  isPlaying: false,
  position: 0,
  volume: 1.0,
  shuffle: false,
  repeat: 'none',
  queue: [],

  setTrack: (track) => set({ currentTrack: track }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setPosition: (position) => set({ position }),
  setVolume: (volume) => set({ volume }),
  setShuffle: (shuffle) => set({ shuffle }),
  setRepeat: (repeat) => set({ repeat }),
  setQueue: (queue) => set({ queue }),
  updateState: (state) => set((prev) => ({ ...prev, ...state })),
}));
