import React, { useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import Layout from './components/Layout';
import LoadingAnimation from './components/LoadingAnimation';
import AudioProvider from './components/AudioProvider';
import { usePlayerStore } from './store/usePlayerStore';
import { initWebSocket } from './api/websocket';

// Lazy load page components
const TrackList = lazy(() => import('./components/TrackList'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const TestLoading = lazy(() => import('./pages/TestLoading'));
const NowPlayingPage = lazy(() => import('./pages/NowPlayingPage'));
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage'));
const PlaylistDetailPage = lazy(() => import('./pages/PlaylistDetailPage'));

// Protected Route Component using Clerk
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingAnimation />;
  }

  return isSignedIn ? <>{children}</> : <Navigate to="/login" />;
};

const queryClient = new QueryClient();

function App() {
  const { isSignedIn, getToken } = useAuth();
  const setDeviceId = usePlayerStore((state) => state.setDeviceId);

  useEffect(() => {
    // Initialize Device ID
    let deviceId = localStorage.getItem('amplify_device_id');
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = crypto.randomUUID();
      } else {
        // Fallback for non-secure contexts
        deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      localStorage.setItem('amplify_device_id', deviceId);
    }
    setDeviceId(deviceId);

    // Initialize WebSocket if authenticated
    if (isSignedIn && deviceId) {
      getToken().then((token) => {
        if (token) {
          const cleanup = initWebSocket(token, deviceId);
          return cleanup;
        }
      });
    }
  }, [isSignedIn, getToken, setDeviceId]);

  return (
    <QueryClientProvider client={queryClient}>
      <AudioProvider>
        <Router>
          <Toaster position="top-right" />
          <Suspense fallback={<LoadingAnimation />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/test-loading" element={<TestLoading />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TrackList />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Mobile Now Playing expanded view */}
              <Route
                path="/now-playing/:id"
                element={
                  <ProtectedRoute>
                    <NowPlayingPage />
                  </ProtectedRoute>
                }
              />

              {/* Playlists */}
              <Route
                path="/playlists"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PlaylistsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/playlists/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <PlaylistDetailPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </AudioProvider>
    </QueryClientProvider>
  );
}

export default App;
