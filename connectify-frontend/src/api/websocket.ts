import { usePlayerStore } from '../store/usePlayerStore';
import type { WebSocketMessage, PlaybackState } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  connect() {
    if (this.ws) return;

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('Connected to WebSocket');
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected. Reconnecting in 3s...');
      this.ws = null;
      this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (this.ws) {
        this.ws.close();
      }
    };
  }

  private handleMessage(message: WebSocketMessage) {
    const store = usePlayerStore.getState();

    switch (message.type) {
      case 'playback:sync':
      case 'playback:update':
        if (message.data) {
          // Map backend data to frontend state if needed, or use directly if they match
          // Backend sends: track_id, position, playing, volume, shuffle, repeat
          // We need to fetch the full track info if track_id changed significantly,
          // but for now let's update what we have.
          // Note: Backend 'track_id' matches our Track.id
          
          const update: Partial<PlaybackState> = {};
          if (message.data.playing !== undefined) update.isPlaying = message.data.playing;
          if (message.data.position !== undefined) update.position = message.data.position;
          if (message.data.volume !== undefined) update.volume = message.data.volume;
          
          // Ideally we would fetch the track details if track_id changes and we don't have it
          // For now, we assume the frontend driving the change already has the track,
          // or we might need a way to look it up from the queue.
           
          store.updateState(update);
        }
        break;
        
      case 'control:next':
        // Handle next track logic if commanded from elsewhere (server broadcast)
        break;
        
      case 'control:previous':
        break;
        
      case 'ping':
        this.send({ type: 'pong', data: null });
        break;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  // Control helper methods
  play(trackId: string, position: number) {
    this.send({ type: 'control:play', data: { track_id: trackId, position } });
  }

  pause(trackId: string, position: number) {
    this.send({ type: 'control:pause', data: { track_id: trackId, position } });
  }

  seek(position: number) {
    this.send({ type: 'control:seek', data: { position } });
  }

  setVolume(volume: number) {
    this.send({ type: 'control:volume', data: { volume } });
  }
}

export const wsService = new WebSocketService();
