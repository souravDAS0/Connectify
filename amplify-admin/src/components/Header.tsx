import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Header() {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [starCount, setStarCount] = useState<number | null>(null);

  // Fetch GitHub stars count
  useEffect(() => {
    fetch('https://api.github.com/repos/souravDAS0/Connectify')
      .then(res => res.json())
      .then(data => setStarCount(data.stargazers_count))
      .catch(() => setStarCount(null));
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end h-16">

          {/* Right Side - GitHub Stars and User Menu */}
          <div className="flex items-center gap-6">
            {/* GitHub Star Button */}
            <div className="flex items-center">
              <a
                href="https://github.com/souravDAS0/Connectify"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-l-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
                title="Star on GitHub"
              >
                <Star size={14} />
                <span className="hidden sm:inline">Star</span>
              </a>
              <a
                href="https://github.com/souravDAS0/Connectify/stargazers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-l-0 border-gray-300 rounded-r-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
                title="See stargazers"
              >
                {starCount ?? '...'}
              </a>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.email || 'User'}
                    className="w-9 h-9 rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium border border-gray-200">
                    {user?.email?.[0].toUpperCase() || 'A'}
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
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.user_metadata?.full_name || user.user_metadata?.name || 'Admin User'}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 mt-2">
                        Admin
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 transition-colors rounded-b-lg"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
