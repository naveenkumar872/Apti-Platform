import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart2, BookOpen, ClipboardList, Calendar, TrendingDown,
  Trophy, Zap, ArrowRight, Flame
} from "lucide-react";
import api from "../../services/api";
import useAuthStore from "../../stores/authStore";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const CARD = "bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full min-h-full flex flex-col animate-pulse">
      <div className="h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600" />
      <div className="p-5 md:p-8 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />)}</div>
        <div className="grid grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-60 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />)}</div>
      </div>
    </div>
  );

  const stats = data?.stats || {};
  const weakAreas = data?.weak_areas || [];
  const recentAttempts = data?.recent_attempts || [];
  const upcomingTests = data?.upcoming_tests || [];
  const planProgress = data?.plan_progress;

  const radarData = weakAreas.slice(0, 6).map(w => ({
    subject: (w.topic_name || "").split(" ").slice(0, 2).join(" "),
    score: Math.round(w.accuracy_percent || 0),
  }));

  const barData = recentAttempts.slice(0, 6).map(a => ({
    name: (a.title || "Test").slice(0, 12),
    score: Math.round(a.accuracy_percent || 0),
  }));

  const STAT_CARDS = [
    { label: "Tests taken",       value: stats.total_tests ?? 0,                  icon: ClipboardList, tint: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: "Avg score",         value: `${Math.round(stats.avg_score ?? 0)}%`,  icon: BarChart2,     tint: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: "Practice sessions", value: stats.practice_sessions ?? 0,            icon: BookOpen,      tint: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { label: "Day streak",        value: `${stats.streak ?? 0}d`,                 icon: Flame,         tint: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ];

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 pt-8 pb-8 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-start justify-between gap-4 animate-fade-in-up">
          <div>
            <p className="text-white/60 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Dashboard</p>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-white/70 text-sm mt-1.5">Your placement preparation, distilled.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
            <div className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-center min-w-[72px]">
              <p className="text-lg font-semibold text-white tracking-tight">{stats.total_tests ?? 0}</p>
              <p className="text-white/65 text-[10px] mt-0.5 uppercase tracking-wider font-medium">Tests</p>
            </div>
            <div className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2.5 text-center min-w-[72px]">
              <p className="text-lg font-semibold text-white tracking-tight">{Math.round(stats.avg_score ?? 0)}%</p>
              <p className="text-white/65 text-[10px] mt-0.5 uppercase tracking-wider font-medium">Avg</p>
            </div>
            <Link to="/student/practice"
              className="inline-flex items-center gap-1.5 bg-white text-slate-900 text-[13px] font-semibold px-3.5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors">
              <Zap size={13} /> Practice <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map(({ label, value, icon: Icon, tint, bg }) => (
            <div key={label} className={CARD + ' p-5'}>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                <Icon size={16} className={tint} strokeWidth={2.25} />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Plan progress */}
        {planProgress && (
          <div className={CARD + ' p-5 mb-6 flex items-center justify-between gap-4'}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <Calendar size={17} className="text-violet-600 dark:text-violet-400" strokeWidth={2.25} />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Study plan progress</p>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">{planProgress.completed} of {planProgress.total} tasks done</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="hidden md:block w-36 h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((planProgress.completed / planProgress.total) * 100)}%` }} />
              </div>
              <span className="text-lg font-semibold text-violet-600 dark:text-violet-400 tracking-tight">
                {Math.round((planProgress.completed / planProgress.total) * 100)}%
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Radar */}
          <div className={CARD + ' p-6'}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown size={15} className="text-rose-500" />
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Weak areas</h2>
            </div>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgb(148 163 184 / 0.22)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.18} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-slate-400">
                <BookOpen size={26} className="mb-2 opacity-30" />
                <p className="text-[13px]">No data yet — start practicing.</p>
              </div>
            )}
          </div>

          {/* Bar */}
          <div className={CARD + ' p-6'}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={15} className="text-indigo-500" />
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Recent scores</h2>
            </div>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barSize={26}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.18)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgb(167 139 250 / 0.06)' }}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid rgb(226 232 240)',
                      borderRadius: 10,
                      boxShadow: '0 4px 16px -4px rgb(15 23 42 / 0.08)',
                      color: '#0f172a',
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${v}%`, "Score"]}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-44 text-slate-400">
                <BarChart2 size={26} className="mb-2 opacity-30" />
                <p className="text-[13px]">No test attempts yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming tests + quick links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={CARD + ' p-6'}>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={15} className="text-indigo-500" />
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Upcoming tests</h2>
            </div>
            {upcomingTests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <ClipboardList size={26} className="mb-2 opacity-30" />
                <p className="text-[13px]">No upcoming tests scheduled.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTests.slice(0, 4).map(t => (
                  <div key={t.test_id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <span className="w-1 h-7 rounded-full bg-indigo-500" />
                      <div>
                        <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400">{t.duration_minutes} min · {t.total_marks} marks</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                      {new Date(t.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={CARD + ' p-6'}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={15} className="text-amber-500" />
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Quick actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { to: "/student/materials",   label: "Study Materials", Icon: BookOpen },
                { to: "/student/practice",    label: "Practice now",    Icon: Zap },
                { to: "/student/companies",   label: "Company corner",  Icon: Calendar },
                { to: "/student/leaderboard", label: "Leaderboard",     Icon: Trophy },
              ].map(({ to, label, Icon }) => (
                <Link key={to} to={to}
                  className="group flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                  <Icon size={15} className="text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
