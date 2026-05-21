import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, BarChart2, ClipboardList, Calendar, Building2,
  LayoutDashboard, LogOut, Sun, Moon, Sparkles, Lock, Target, ArrowRight, RotateCcw
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

// `locked: false` items are always reachable. The Diagnostic + Dashboard items
// stay unlocked while the diagnostic is pending; everything else is gated.
const navItems = [
  { to: '/student/diagnostic', icon: Target,          label: 'Diagnostic',     alwaysOpen: true },
  { to: '/student/dashboard',  icon: LayoutDashboard, label: 'Dashboard',      alwaysOpen: true },
  { to: '/student/materials',  icon: BookOpen,        label: 'Study Materials' },
  { to: '/student/practice',   icon: ClipboardList,   label: 'Practice' },
  { to: '/student/mistakes',   icon: RotateCcw,       label: 'Review' },
  { to: '/student/tests',      icon: BarChart2,       label: 'Tests' },
  { to: '/student/reports',    icon: BarChart2,       label: 'Reports' },
  { to: '/student/plan',       icon: Calendar,        label: 'Study Plan' },
  { to: '/student/simulator',  icon: Building2,       label: 'Company Simulator' },
];

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function StudentLayout() {
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

  const diagnosticDone = !!user?.diagnostic_completed_at;
  // Hide the diagnostic nav item once the student has finished it.
  const visibleNav = navItems.filter(item =>
    !(item.to === '/student/diagnostic' && diagnosticDone)
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#09090d] transition-colors">
      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col z-10
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
                Student
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {visibleNav.map(({ to, icon: Icon, label, alwaysOpen }) => {
            const locked = !diagnosticDone && !alwaysOpen;
            if (locked) {
              return (
                <div key={to}
                  className="group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium text-slate-300 dark:text-slate-600 cursor-not-allowed select-none"
                  title="Take the diagnostic test to unlock"
                >
                  <Icon size={15} className="text-slate-300 dark:text-slate-600" />
                  <span className="flex-1">{label}</span>
                  <Lock size={11} className="text-slate-300 dark:text-slate-600" />
                </div>
              );
            }
            return (
              <NavLink key={to} to={to}
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
                    <span className="flex-1">{label}</span>
                    {to === '/student/diagnostic' && !diagnosticDone && (
                      <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-violet-600 text-white">New</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-200 dark:border-white/[0.06] space-y-1">
          <button onClick={() => setDark(d => !d)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-white/[0.03] transition-colors">
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center text-violet-700 dark:text-violet-300 text-[13px] font-semibold flex-shrink-0">
              {initials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/[0.08] transition-colors">
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {/* Global diagnostic banner — matches platform violet/indigo palette */}
        {!diagnosticDone && (
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white px-5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Target size={15} className="flex-shrink-0" />
              <p className="text-[13px] font-medium truncate">
                <span className="font-bold">Take the diagnostic test</span> to unlock Practice, Tests, Materials, your personalised Study Plan and more.
              </p>
            </div>
            <Link to="/student/diagnostic"
              className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white text-violet-700 text-[12px] font-bold px-3 py-1.5 rounded-md hover:bg-violet-50 transition-colors">
              Start now <ArrowRight size={12} />
            </Link>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
