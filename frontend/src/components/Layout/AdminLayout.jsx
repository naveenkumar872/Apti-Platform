import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, HelpCircle, FileText, Users, BarChart2, LogOut, Sun, Moon } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/tests', icon: ClipboardList, label: 'Test Builder' },
  { to: '/admin/questions', icon: HelpCircle, label: 'Question Bank' },
  { to: '/admin/materials', icon: FileText, label: 'Materials' },
  { to: '/admin/users', icon: Users, label: 'Users & Batches' },
  { to: '/admin/reports', icon: BarChart2, label: 'Reports' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    const html = document.documentElement;
    if (dark) { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [dark]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col z-10">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">AptitudePrep</h1>
              <p className="text-[10px] text-gray-500 mt-0.5 font-medium tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(user?.name?.[0] || 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => setDark(d => !d)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0"
              title="Toggle theme"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
