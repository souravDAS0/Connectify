import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import AdminLogin from './pages/Login';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Tracks from './pages/Tracks';
import Users from './pages/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Admin Protected Route - checks both auth AND admin role
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        // Fetch role from Supabase profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setRole(data?.role || 'user');
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole('user');
      } finally {
        setCheckingRole(false);
      }
    }

    checkAdminRole();
  }, [user]);

  // Auto sign out non-admin users after countdown
  useEffect(() => {
    if (!checkingRole && role !== null && role !== 'admin' && user) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            signOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [checkingRole, role, user, signOut]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has admin role
  if (role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-sm text-gray-600 mb-1">You do not have admin privileges.</p>
            <p className="text-xs text-gray-500 mb-6">Contact your administrator to request access.</p>
            <div className="text-sm text-gray-600">
              Signing out in <span className="font-semibold text-red-600">{countdown}</span> second{countdown !== 1 ? 's' : ''}...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />

          <Route
            path="/*"
            element={
              <AdminProtectedRoute>
                <div className="flex min-h-screen bg-gray-50">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-auto">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/tracks" element={<Tracks />} />
                        <Route path="/playlists" element={<Playlists />} />
                        <Route path="/playlists/:id" element={<PlaylistDetail />} />
                        <Route path="/users" element={<Users />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </AdminProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
