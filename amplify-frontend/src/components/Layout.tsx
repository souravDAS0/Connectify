import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import PlayerControls from './PlayerControls';
import NowPlayingOverlay from './NowPlayingOverlay';
import { Music, ListMusic, LogOut, Star } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuth } from '../contexts/AuthContext';


interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isNowPlayingExpanded, setIsNowPlayingExpanded } = usePlayerStore();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [starCount, setStarCount] = useState<number | null>(null);

  // Fetch GitHub star count
  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/souravDAS0/Connectify');
        const data = await response.json();
        setStarCount(data.stargazers_count);
      } catch (error) {
        console.error('Failed to fetch star count:', error);
        setStarCount(0);
      }
    };
    fetchStarCount();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="bg-black absolute top-0 left-0 right-0 min-h-screen text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black px-4 py-2 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-6">
          <h1 className="h-[50px] md:h-[60px]">
            <img src="/amplify_logo.png" alt="amplify logo" className="h-[50px] md:h-[60px]" />
          </h1>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${location.pathname === '/'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Music size={18} />
              Library
            </Link>
            <Link
              to="/playlists"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${location.pathname.startsWith('/playlists')
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <ListMusic size={18} />
              Playlists
            </Link>
          </nav>
        </div>

        {/* GitHub Star Button */}
        <div className='flex items-center gap-5'>


          <div className="flex items-center ">
            <a
              href="https://github.com/souravDAS0/Connectify"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-white/20 rounded-l-md hover:border-white/40 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
              title="Star on GitHub"
            >
              <Star size={14} className="" />
              <span>Star</span>
            </a>
            <a
              href="https://github.com/souravDAS0/Connectify/stargazers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-l-0 border-white/20 rounded-r-md hover:border-white/40 hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
              title="See stargazers"
            >
              {starCount ?? '...'}
            </a>
          </div>



          {/* Custom User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.email || 'User'}
                  className="w-9 h-9 rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                  {user?.email?.[0].toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {showUserMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />

                {/* Menu Dropdown */}
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </header>

      {/* Mobile Navigation Tabs */}
      <nav className="md:hidden flex border-b border-white/10">
        <Link
          to="/"
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${location.pathname === '/'
            ? 'text-white border-b-2 border-green-500'
            : 'text-gray-400'
            }`}
        >
          <Music size={18} />
          Library
        </Link>
        <Link
          to="/playlists"
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${location.pathname.startsWith('/playlists')
            ? 'text-white border-b-2 border-green-500'
            : 'text-gray-400'
            }`}
        >
          <ListMusic size={18} />
          Playlists
        </Link>
      </nav>

      {/* pb-24 ensures content isn't hidden behind fixed player */}
      <main>
        {children}
      </main>
      <PlayerControls />

      {/* Desktop NowPlaying Overlay */}
      <NowPlayingOverlay
        isOpen={isNowPlayingExpanded}
        onClose={() => setIsNowPlayingExpanded(false)}
      />
    </div>
  );
};

export default Layout;

