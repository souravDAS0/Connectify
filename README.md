# 🎵 Connectify

A full-stack music streaming application with a modern React frontend, Go backend, and admin panel. Built with real-time capabilities, playlist management, and cross-device playback synchronization.

---

## 📁 Project Structure

```
Connectify/
├── connectify-frontend/    # User-facing music streaming app
├── connectify-backend/     # Go REST API & WebSocket server
└── connectify-admin/       # Admin dashboard for content management
```

---

## 🎨 Frontend (`connectify-frontend`)

A modern, responsive music streaming web application built with React and TypeScript.

### Tech Stack

| Technology           | Purpose                 |
| -------------------- | ----------------------- |
| **React 19**         | UI framework            |
| **TypeScript**       | Type safety             |
| **Vite**             | Build tool & dev server |
| **TailwindCSS**      | Styling                 |
| **Zustand**          | State management        |
| **React Query**      | Server state & caching  |
| **Clerk**            | Authentication          |
| **React Router DOM** | Client-side routing     |
| **Lottie React**     | Animations              |
| **Lucide React**     | Icons                   |

### Key Features

- **🔐 Authentication** - Secure login/signup with Clerk
- **🎵 Music Playback** - Full audio player with controls
- **📋 Queue Management** - Add, remove, and reorder tracks
- **🔀 Shuffle & Repeat** - Multiple playback modes (off, all, one)
- **📱 Responsive Design** - Mobile-first with desktop enhancements
- **🎨 Now Playing Overlay** - YouTube Music-style slide-up panel on desktop
- **📂 Playlists** - Create, view, and manage playlists
- **📍 Track Context Menu** - Right-click actions for tracks
- **🔗 Multi-Device Support** - Active device detection and switching

### Components

| Component                 | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `Layout.tsx`              | Main app layout with navigation and player controls |
| `PlayerControls.tsx`      | Audio player bar with play/pause, seek, volume      |
| `NowPlayingOverlay.tsx`   | Expanded now playing view with queue                |
| `QueuePanel.tsx`          | Track queue display and management                  |
| `TrackList.tsx`           | Reusable track listing component                    |
| `TrackContextMenu.tsx`    | Context menu for track actions                      |
| `CreatePlaylistModal.tsx` | Modal for creating new playlists                    |
| `AudioProvider.tsx`       | Audio element provider and playback state           |
| `LoadingAnimation.tsx`    | Lottie-based loading indicator                      |

### Pages

| Page                 | Route           | Description                 |
| -------------------- | --------------- | --------------------------- |
| `Login`              | `/login`        | User authentication         |
| `Signup`             | `/signup`       | New user registration       |
| `NowPlayingPage`     | `/now-playing`  | Full now playing experience |
| `PlaylistsPage`      | `/playlists`    | User's playlist library     |
| `PlaylistDetailPage` | `/playlist/:id` | Single playlist view        |

### State Management

Uses **Zustand** for global state with the following stores:

- **`usePlayerStore`** - Playback state, queue, current track, volume, repeat/shuffle modes, device management

### Running the Frontend

```bash
cd connectify-frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` by default.

---

## ⚙️ Backend (`connectify-backend`)

A high-performance REST API and WebSocket server built with Go and Fiber.

### Tech Stack

| Technology             | Purpose                             |
| ---------------------- | ----------------------------------- |
| **Go 1.24**            | Programming language                |
| **Fiber v2**           | Web framework                       |
| **MongoDB**            | Primary database                    |
| **Redis**              | Caching & session storage           |
| **Clerk SDK**          | Authentication & JWT verification   |
| **Cloudinary**         | Media storage (audio files, images) |
| **FastHTTP WebSocket** | Real-time communication             |

### Architecture

```
internal/
├── auth/           # Authentication handlers & middleware
├── config/         # Environment configuration
├── middleware/     # HTTP middleware (CORS, auth, etc.)
├── music/          # Track/song handlers & services
├── playback/       # Playback state & history
├── playlist/       # Playlist CRUD operations
├── sockets/        # Socket.io integration
├── storage/        # MongoDB & Redis clients
└── websocket/      # WebSocket handlers & hub
```

### API Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

#### Music

- `GET /api/tracks` - List all tracks
- `GET /api/tracks/:id` - Get track details
- `GET /api/tracks/:id/stream` - Stream audio file

#### Playlists

- `GET /api/playlists` - Get user's playlists
- `POST /api/playlists` - Create playlist
- `GET /api/playlists/:id` - Get playlist details
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `POST /api/playlists/:id/tracks` - Add track to playlist
- `DELETE /api/playlists/:id/tracks/:trackId` - Remove track

#### Playback

- `GET /api/playback/state` - Get current playback state
- `PUT /api/playback/state` - Update playback state

### WebSocket Events

Real-time synchronization for multi-device playback:

| Event                 | Direction       | Description            |
| --------------------- | --------------- | ---------------------- |
| `playback_update`     | Server → Client | Playback state changed |
| `device_connected`    | Server → Client | New device connected   |
| `device_disconnected` | Server → Client | Device disconnected    |
| `sync_request`        | Client → Server | Request state sync     |

### Environment Variables

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/connectify
REDIS_URL=redis://localhost:6379
CLERK_SECRET_KEY=sk_xxx
CLOUDINARY_URL=cloudinary://xxx
```

### Running the Backend

```bash
cd connectify-backend
go mod download
go run cmd/main.go
```

Runs on `http://localhost:8080` by default.

---

## 🛠️ Admin Panel (`connectify-admin`)

A dedicated admin dashboard for managing music content, users, and playlists.

### Tech Stack

| Technology           | Purpose                           |
| -------------------- | --------------------------------- |
| **React 19**         | UI framework                      |
| **TypeScript**       | Type safety                       |
| **Vite**             | Build tool & dev server           |
| **TailwindCSS**      | Styling                           |
| **Zustand**          | State management                  |
| **React Query**      | Server state & caching            |
| **Clerk**            | Admin authentication (role-based) |
| **React Router DOM** | Client-side routing               |
| **Lucide React**     | Icons                             |

### Key Features

- **🔐 Role-Based Access** - Only admin users can access (verified via JWT claims)
- **👥 User Management** - View all registered users, see activity
- **🎵 Track Management** - Upload, edit, and delete tracks
- **📂 Playlist Management** - Create and manage system playlists
- **📊 Dashboard** - Overview statistics and metrics

### Pages

| Page             | Route           | Description                              |
| ---------------- | --------------- | ---------------------------------------- |
| `Login`          | `/login`        | Admin authentication                     |
| `Dashboard`      | `/`             | Overview and statistics                  |
| `Users`          | `/users`        | User management table with details modal |
| `Tracks`         | `/tracks`       | Track library management                 |
| `Playlists`      | `/playlists`    | Playlist overview                        |
| `PlaylistDetail` | `/playlist/:id` | Edit playlist contents                   |

### Admin Authentication

The admin panel uses Clerk with additional backend verification:

1. User signs in via Clerk
2. Backend middleware validates JWT contains `admin` role in `public_metadata`
3. Non-admin users receive `403 Forbidden`

### Running the Admin Panel

```bash
cd connectify-admin
npm install
npm run dev
```

Runs on `http://localhost:5174` by default.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **Go** v1.24+
- **MongoDB** instance
- **Redis** instance
- **Clerk** account with API keys
- **Cloudinary** account (for media storage)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd Connectify
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` in each project directory and fill in your values.

3. **Start the backend**

   ```bash
   cd connectify-backend
   go mod download
   go run cmd/main.go
   ```

4. **Start the frontend**

   ```bash
   cd connectify-frontend
   npm install
   npm run dev
   ```

5. **Start the admin panel** (optional)
   ```bash
   cd connectify-admin
   npm install
   npm run dev
   ```

---

## 📝 License

This project is private and not licensed for public use.

---

## 👤 Author

**Sourav Das**
