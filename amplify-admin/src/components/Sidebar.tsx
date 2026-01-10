import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Music, ListMusic, Users, Menu, X, ChevronLeft } from 'lucide-react';
import Logo from './Logo';

export default function Sidebar() {
  // State management
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [, setIsMobile] = useState(false);

  // Persist sidebar state and detect mobile
  useEffect(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    if (saved !== null) {
      setIsExpanded(JSON.parse(saved));
    }

    // Check screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('sidebarExpanded', JSON.stringify(newState));
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tracks', icon: Music, label: 'Tracks' },
    { to: '/playlists', icon: ListMusic, label: 'Playlists' },
    { to: '/users', icon: Users, label: 'Users' },
  ];

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div
      className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'
        }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {isExpanded && (
          <>
            <Logo size="lg" variant="full" />
            <h1 className="text-md font-semibold text-gray-700 truncate">
              Admin
            </h1>
          </>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
              } ${!isExpanded && 'justify-center'}`
            }
            title={!isExpanded ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="ml-3">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );

  // Mobile Hamburger Menu Button
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsMobileOpen(true)}
      className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6 text-gray-700" />
    </button>
  );

  // Mobile Drawer
  const MobileDrawer = () => (
    <>
      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className='flex items-center'>
            <Logo size="lg" variant="full" />
            <h1 className="text-md font-semibold text-gray-700 truncate">
              Admin
            </h1>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="ml-3">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileMenuButton />
      <MobileDrawer />
    </>
  );
}
