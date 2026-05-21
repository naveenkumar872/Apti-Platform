import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BookOpen, BarChart2, ClipboardList, Calendar, Building2,
  Trophy, MessageCircle, LayoutDashboard, LogOut, User,
  Sun, Moon, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/student/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/student/materials',  icon: BookOpen,         label: 'Study Materials' },
  { to: '/student/practice',   icon: ClipboardList,    label: 'Practice' },
  { to: '/student/tests',      icon: BarChart2,        label: 'Tests' },
  { to: '/student/reports',    icon: BarChart2,        label: 'Reports' },
  { to: '/student/plan',       icon: Calendar,         label: 'Study Plan' },
  { to: '/student/companies',  icon: Building2,        label: 'Company Corner' },
  { to: '/student/leaderboard',icon: Trophy,           label: 'Leaderboard' },
  { to: '/student/doubts',     icon: MessageCircle,    label: 'Doubts' },
];

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function StudentLayout() {
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
    <div className="flex h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col shadow-sm z-10">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <BookOpen size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">AptitudePrep</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Placement Prep</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ' +
                (isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:text-gray-700 dark:group-hover:text-gray-300'} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={13} className="ml-auto text-indigo-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          {/* Theme toggle */}
          <button onClick={() => setDark(d => !d)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200 transition-all">
            {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-400" />}
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials(user?.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all">
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
