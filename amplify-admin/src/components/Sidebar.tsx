import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Music, ListMusic, Users } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tracks', icon: Music, label: 'Tracks' },
    { to: '/playlists', icon: ListMusic, label: 'Playlists' },
    { to: '/users', icon: Users, label: 'Users' },
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen text-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Amplify Admin</h1>
      </div>

      <nav className="mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${isActive ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`
            }
          >
            <item.icon size={20} />
            <span className="ml-3">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
