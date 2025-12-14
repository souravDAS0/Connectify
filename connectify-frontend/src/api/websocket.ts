import { usePlayerStore } from '../store/usePlayerStore';
import { getTrackById } from './tracks';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://192.168.31.244:3000/ws';

let ws: WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

export interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface PlaybackState {
  track_id: string;
  position?: number;
  playing?: boolean;
  volume?: number;
  active_device_id?: string;
}

export const initWebSocket = (token: string, deviceId: string) => {
  if (ws) {
    ws.close();
  }

  const connect = () => {
    // Basic device name heuristic
    const deviceName = encodeURIComponent(
      /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile Web' : 'Desktop Web'
    );
    
    ws = new WebSocket(`${WS_URL}?token=${token}&device_id=${deviceId}&device_name=${deviceName}`);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
      // Request device list on connection
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'device:get_list', data: {} }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected. Reconnecting...');
      if (!reconnectInterval) {
        reconnectInterval = setInterval(connect, 3000); // Retry every 3s
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws?.close();
    };
  };

  connect();

  return () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  };
};

const handleMessage = (message: WebSocketMessage) => {
  const store = usePlayerStore.getState();

  switch (message.type) {
    case 'playback:sync':
      const data = message.data as PlaybackState;
      // console.log('Syncing state:', data);
      
      const previousActiveDeviceId = store.activeDeviceId;

      if (data.active_device_id) {
        store.setActiveDeviceId(data.active_device_id);
      }
      
      if (typeof data.volume === 'number') {
        store.setVolume(data.volume);
      }

      // Sync Track if changed
      if (data.track_id && store.currentTrack?.id !== data.track_id) {
          getTrackById(data.track_id).then((track) => {
            store.setCurrentTrack(track);
            // Apply other state updates after track is set to ensure consistency
            if (typeof data.playing === 'boolean') {
              store.setIsPlaying(data.playing);
            }
             // If we are NOT the active device, strictly follow position
             // OR if we just BECAME the active device, sync position to start cleanly
             const isActive = store.deviceId === (data.active_device_id || store.activeDeviceId);
             const justBecameActive = previousActiveDeviceId !== store.deviceId && isActive;

             if (!isActive || justBecameActive) {
                if (typeof data.position === 'number') {
                   // Add a small delay/offset or just sync directly?
                   // Direct sync is fine for now, the store handles it.
                   store.setPosition(data.position);
                   // If we just became active, trigger seek to the correct position
                   if (justBecameActive) {
                     store.setSeekTarget(data.position);
                   }
                }
             }
          }).catch(console.error);
      } else {
        // Track hasn't changed, just update state
        if (typeof data.playing === 'boolean') {
          store.setIsPlaying(data.playing);
        }
        
        // If we are NOT the active device, strictly follow position
        // OR if we just BECAME the active device, sync position to start cleanly
        const isActive = store.deviceId === (data.active_device_id || store.activeDeviceId);
        const justBecameActive = previousActiveDeviceId !== store.deviceId && isActive;

        if (!isActive || justBecameActive) {
           if (typeof data.position === 'number') {
              store.setPosition(data.position);
              // If we just became active, trigger seek to the correct position
              if (justBecameActive) {
                store.setSeekTarget(data.position);
              }
           }
        }
      }
      break;
      
    case 'control:next':
      store.nextTrack();
      break;
      
    case 'control:previous':
      store.prevTrack();
      break;

    case 'control:seek':
      // eslint-disable-next-line no-case-declarations
      const seekData = message.data as { position: number };
      store.setPosition(seekData.position);
      store.setSeekTarget(seekData.position);
      break;

    case 'device:list_update':
      // eslint-disable-next-line no-case-declarations
      const deviceListData = message.data as {
        devices: Array<{ id: string; name: string; is_active: boolean }>;
        active_device_id: string;
      };

      // Update active devices list
      if (deviceListData.devices) {
        store.setActiveDevices(
          deviceListData.devices.map(d => ({
            id: d.id,
            name: d.name,
            isActive: d.is_active
          }))
        );
      }

      // Update active device ID if provided
      if (deviceListData.active_device_id) {
        store.setActiveDeviceId(deviceListData.active_device_id);
      }
      break;
  }
};

export const sendWebSocketMessage = (type: string, data: any) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  } else {
    console.warn('WebSocket is not connected');
  }
};
