import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch GitHub stars count
  useEffect(() => {
    fetch('https://api.github.com/repos/souravDAS0/Connectify')
      .then(res => res.json())
      .then(data => setStarCount(data.stargazers_count))
      .catch(() => setStarCount(null));
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success('Signing in with Google...');
    } catch (error) {
      toast.error('Failed to sign in with Google');
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* GitHub Star Button - Top Right */}
      <div className="absolute top-6 right-6">
        <div className="flex items-center">
          <a
            href="https://github.com/souravDAS0/Connectify"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-l-lg hover:border-gray-400 hover:bg-white transition-colors text-gray-700 hover:text-gray-900"
            title="Star on GitHub"
          >
            <Star size={14} />
            <span className="hidden sm:inline">Star</span>
          </a>
          <a
            href="https://github.com/souravDAS0/Connectify/stargazers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-l-0 border-gray-300 rounded-r-lg hover:border-gray-400 hover:bg-white transition-colors text-gray-700 hover:text-gray-900"
            title="See stargazers"
          >
            {starCount ?? '...'}
          </a>
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          {/* Logo */}
          <div className="mb-6">
            <Logo size="xl" variant="full" />
          </div>

          {/* Title and Description */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-sm text-gray-600 text-center">
            Sign in to manage your music platform
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-sm font-medium">Continue with Google</span>
        </button>

        {/* Footer Text */}
        <p className="text-gray-500 text-xs text-center mt-6">
          By continuing, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
        </p>
      </div>

      {/* Footer Info */}
      <p className="text-xs text-gray-500 mt-6 text-center">
        Admin access required • Contact your administrator for access
      </p>
    </div>
  );
};

export default Login;
