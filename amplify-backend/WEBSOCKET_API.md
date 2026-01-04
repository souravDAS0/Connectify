# WebSocket Control API

## Connection
```
ws://localhost:3000/ws
```

## Message Format
All messages use JSON format:
```json
{
  "type": "message_type",
  "data": { /* command-specific data */ }
}
```

---

## Control Commands (Client → Server)

### 1. Play
Resume playback

```json
{
  "type": "control:play",
  "data": {
    "track_id": "song123",
    "position": 5000
  }
}
```

### 2. Pause
Pause playback

```json
{
  "type": "control:pause",
  "data": {
    "track_id": "song123",
    "position": 5000
  }
}
```

### 3. Stop
Stop playback and reset position to 0

```json
{
  "type": "control:stop",
  "data": {
    "track_id": "song123"
  }
}
```

### 4. Seek
Jump to specific position in track

```json
{
  "type": "control:seek",
  "data": {
    "position": 30000  // milliseconds
  }
}
```

### 5. Volume
Set volume level (0.0 to 1.0)

```json
{
  "type": "control:volume",
  "data": {
    "volume": 0.75  // 75%
  }
}
```

### 6. Load Track
Load a new track (starts paused at position 0)

```json
{
  "type": "control:load",
  "data": {
    "track_id": "song456"
  }
}
```

### 7. Next Track
Skip to next track in queue

```json
{
  "type": "control:next",
  "data": null
}
```

### 8. Previous Track
Go to previous track in queue

```json
{
  "type": "control:previous",
  "data": null
}
```

### 9. Shuffle
Toggle shuffle mode

```json
{
  "type": "control:shuffle",
  "data": {
    "shuffle": true
  }
}
```

### 10. Repeat
Set repeat mode: "none", "one", or "all"

```json
{
  "type": "control:repeat",
  "data": {
    "repeat": "all"
  }
}
```

### 11. Playback Update (Legacy)
Full state update

```json
{
  "type": "playback:update",
  "data": {
    "track_id": "song123",
    "position": 5000,
    "playing": true,
    "volume": 0.8,
    "shuffle": false,
    "repeat": "none"
  }
}
```

---

## Sync Messages (Server → All Clients)

### Playback Sync
Broadcasted when any client sends a control command

```json
{
  "type": "playback:sync",
  "data": {
    "track_id": "song123",
    "position": 5000,
    "playing": true,
    "volume": 0.8,
    "shuffle": false,
    "repeat": "none"
  }
}
```

**Note:** Fields are optional. Only changed fields may be included.

### Control Broadcast
Some commands (next/previous) are broadcasted directly

```json
{
  "type": "control:next",  // or "control:previous"
  "data": null
}
```

---

## Keepalive

### Ping (Client → Server)
```json
{
  "type": "ping",
  "data": null
}
```

### Pong (Server → Client)
```json
{
  "type": "pong",
  "data": null
}
```

Server automatically sends ping every 54 seconds.

---

## PlaybackState Object

```typescript
{
  track_id: string,      // Track identifier
  position: number,      // Playback position in milliseconds
  playing: boolean,      // true = playing, false = paused
  volume?: number,       // 0.0 to 1.0 (optional)
  shuffle?: boolean,     // Shuffle mode (optional)
  repeat?: string        // "none" | "one" | "all" (optional)
}
```

---

## How It Works

1. **Client sends control command** → WebSocket → Server
2. **Server publishes to Redis** pub/sub channel
3. **All server instances receive** from Redis
4. **All connected clients receive** `playback:sync` message
5. **Clients update UI** to reflect new state

This architecture supports:
- Multi-device synchronization
- Real-time updates (< 100ms latency)
- Horizontal scaling (multiple server instances)
- Cross-network control (not limited to local WiFi)

---

## Testing

### Using the Control Client
```bash
cd test
node control-client.js
```

### Example Session
```
> play
▶️  Playing

> vol 0.5
🔊 Volume: 50%

> seek 30000
⏩ Seeking to 30s

> shuffle
🔀 Shuffle: ON

> state
📊 Current State:
  Track:    song123
  Position: 30s
  Playing:  ▶️  Yes
  Volume:   50%
  Shuffle:  ON
  Repeat:   NONE
```

---

## Error Handling

- Invalid JSON → Logged and ignored
- Missing required fields → Logged and ignored
- Invalid data types → Logged and ignored
- Unknown message types → Silently ignored

No error messages are sent back to clients (design choice for simplicity).

---

## Future Enhancements

- [ ] Authentication (JWT token in query params)
- [ ] User-specific rooms (only sync within user's devices)
- [ ] Device targeting (control specific device)
- [ ] Queue management commands
- [ ] Lyrics sync commands
- [ ] Error responses
- [ ] Rate limiting
