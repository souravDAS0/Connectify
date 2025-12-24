import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import Layout from './components/Layout';
import TrackList from './components/TrackList';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TestLoading from './pages/TestLoading';
import LoadingAnimation from './components/LoadingAnimation';
import { usePlayerStore } from './store/usePlayerStore';
import { initWebSocket } from './api/websocket';

// Protected Route Component using Clerk
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <LoadingAnimation />;
    return (
      <div className="w-screen min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-400 text-lg">Loading...</p>
      </div>
    )

  }

  return isSignedIn ? <>{children}</> : <Navigate to="/login" />;
};

const queryClient = new QueryClient();

function App() {
  const { isSignedIn, getToken } = useAuth();
  const setDeviceId = usePlayerStore((state) => state.setDeviceId);

  useEffect(() => {
    // Initialize Device ID
    let deviceId = localStorage.getItem('connectify_device_id');
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
      localStorage.setItem('connectify_device_id', deviceId);
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
      <Router>
        <Toaster position="top-right" />
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
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
