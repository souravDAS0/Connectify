import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import TrackList from './components/TrackList';
import Login from './pages/Login';
import { useAuthStore } from './store/useAuthStore';
import { usePlayerStore } from './store/usePlayerStore';
import { initWebSocket } from './api/websocket';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const queryClient = new QueryClient();

function App() {
  const { user, token } = useAuthStore();
  const setDeviceId = usePlayerStore((state) => state.setDeviceId);

  useEffect(() => {
    // Initialize Device ID
    let deviceId = localStorage.getItem('connectify_device_id');
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = crypto.randomUUID();
      } else {
        // Fallback for non-secure contexts
        deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      localStorage.setItem('connectify_device_id', deviceId);
    }
    setDeviceId(deviceId);

    // Initialize WebSocket if authenticated
    if (user && token && deviceId) {
      const cleanup = initWebSocket(token, deviceId);
      return cleanup;
    }
  }, [user, token, setDeviceId]);

  return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
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
          </Routes>
        </Router>
      </QueryClientProvider>
  );
}

export default App;
