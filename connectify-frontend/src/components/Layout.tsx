import type { ReactNode } from 'react';
import { UserButton } from '@clerk/clerk-react';
import PlayerControls from './PlayerControls';
import { dark } from "@clerk/themes";


interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="bg-black absolute top-0 left-0 right-0 min-h-screen text-white pb-24">
      {/* Header */}
      <header className="px-4 py-2 flex justify-between items-center border-b border-white/10">
        <h1 className="h-[50px] md:h-[60px]">
          <img src="./amplify_logo.png" alt="amplify logo" className="h-[50px] md:h-[60px]" />
        </h1>
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

      {/* pb-24 ensures content isn't hidden behind fixed player */}
      <main>
        {children}
      </main>
      <PlayerControls />
    </div>
  );
};

export default Layout;
