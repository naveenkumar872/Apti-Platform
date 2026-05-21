import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, CalendarDays, FileText,
  Users, BarChart2, LogOut, Sun, Moon, Sparkles, Target, HelpCircle, Building2
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/diagnostics',   icon: Target,          label: 'Diagnostics' },
  { to: '/admin/tests',         icon: ClipboardList,   label: 'Test Builder' },
  { to: '/admin/question-bank', icon: HelpCircle,      label: 'Question Bank' },
  { to: '/admin/simulator',     icon: Building2,       label: 'Simulator' },
  { to: '/admin/questions',     icon: CalendarDays,    label: 'Study Plans' },
  { to: '/admin/materials',     icon: FileText,        label: 'Materials' },
  { to: '/admin/users',         icon: Users,           label: 'Users' },
  { to: '/admin/reports',       icon: BarChart2,       label: 'Reports' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

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
    <div className="flex h-screen bg-slate-50 dark:bg-[#09090d] transition-colors">
      <aside className="w-64 flex-shrink-0 flex flex-col z-10
                        bg-white dark:bg-[#0c0c12]
                        border-r border-slate-200 dark:border-white/[0.06]">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-white dark:text-slate-900" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-slate-900 dark:text-white leading-tight tracking-tight">
                AptitudePrep
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5 font-medium tracking-[0.16em] uppercase">
                Admin
              </p>
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
                'group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors ' +
                (isActive
                  ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/[0.03]')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={15}
                    className={isActive
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-white/[0.06] space-y-1">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-violet-700 dark:text-violet-300 text-[13px] font-semibold flex-shrink-0">
              {(user?.name?.[0] || 'A').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
            <button
              onClick={() => setDark(d => !d)}
              className="p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0"
              title={dark ? 'Switch to light' : 'Switch to dark'}
              aria-label="Toggle theme"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.08] transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
