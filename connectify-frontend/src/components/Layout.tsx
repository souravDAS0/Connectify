import type { ReactNode } from 'react';
import PlayerControls from './PlayerControls';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="bg-black min-h-screen text-white pb-24"> 
      {/* pb-24 ensures content isn't hidden behind fixed player */}
      <main>
        {children}
      </main>
      <PlayerControls />
    </div>
  );
};

export default Layout;
