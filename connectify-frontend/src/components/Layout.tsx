import type { ReactNode } from 'react';
import { useClerk } from '@clerk/clerk-react';
import PlayerControls from './PlayerControls';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="bg-black absolute top-0 left-0 right-0 min-h-screen text-white pb-24">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-white/10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Connectify
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </header>

      {/* pb-24 ensures content isn't hidden behind fixed player */}
      <main>
        {children}
      </main>
      <PlayerControls />
    </div>
  );
};

export default Layout;
