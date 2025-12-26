import type { ReactNode } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import PlayerControls from './PlayerControls';
import NowPlayingOverlay from './NowPlayingOverlay';
import { dark } from "@clerk/themes";
import { Music, ListMusic } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';


interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { isNowPlayingExpanded, setIsNowPlayingExpanded } = usePlayerStore();

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
        <UserButton
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: '#2563eb',
              colorBackground: '#1f2937',
              colorInputBackground: '#374151',
              colorInputText: '#ffffff',
              colorText: '#ffffff',
              colorTextSecondary: '#9ca3af',
              colorDanger: '#ef4444',
              borderRadius: '0.5rem',
            },
            elements: {
              avatarBox: 'w-9 h-9',
              userButtonPopoverCard: {
                backgroundColor: '#1f2937',
                borderColor: '#374151',
              },
              userButtonPopoverActionButton: {
                color: '#d1d5db',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                },
              },
              userButtonPopoverActionButtonText: {
                color: '#d1d5db',
              },
              userButtonPopoverActionButtonIcon: {
                color: '#9ca3af',
              },
              userButtonPopoverFooter: {
                display: 'none',
              },
              userPreviewMainIdentifier: {
                color: '#ffffff',
              },
              userPreviewSecondaryIdentifier: {
                color: '#9ca3af',
              },
            },
          }}
          userProfileMode="modal"
          userProfileProps={{
            appearance: {
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#1f2937',
                colorInputBackground: '#374151',
                colorInputText: '#ffffff',
                colorText: '#ffffff',
                colorTextSecondary: '#9ca3af',
                colorDanger: '#ef4444',
                borderRadius: '0.5rem',
              },
              elements: {
                rootBox: {
                  backgroundColor: '#1f2937',
                },
                card: {
                  backgroundColor: '#1f2937',
                  color: '#ffffff',
                },
                navbar: {
                  backgroundColor: '#111827',
                },
                navbarButton: {
                  color: '#d1d5db',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                  },
                },
                navbarButtonIcon: {
                  color: '#9ca3af',
                },
                headerTitle: {
                  color: '#ffffff',
                },
                headerSubtitle: {
                  color: '#9ca3af',
                },
                formButtonPrimary: {
                  backgroundColor: '#2563eb',
                  '&:hover': {
                    backgroundColor: '#1d4ed8',
                  },
                },
                formFieldLabel: {
                  color: '#ffffff',
                },
                formFieldInput: {
                  backgroundColor: '#374151',
                  color: '#ffffff',
                  borderColor: '#4b5563',
                },
                'formFieldInput::placeholder': {
                  color: '#9ca3af',
                },
                profileSectionPrimaryButton: {
                  color: '#60a5fa',
                  '&:hover': {
                    color: '#93c5fd',
                  },
                },
                badge: {
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                },
                accordionTriggerButton: {
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
                accordionContent: {
                  backgroundColor: '#374151',
                },
                modalContent: {
                  backgroundColor: '#1f2937',
                },
                modalBackdrop: {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              },
            },
          }}
        />
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

