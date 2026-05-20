import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart2, BookOpen, ClipboardList, Calendar, TrendingDown, Trophy, Zap, ArrowRight } from "lucide-react";
import api from "../../services/api";
import useAuthStore from "../../stores/authStore";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard").then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto animate-pulse">
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}</div>
      <div className="grid grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-60 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}</div>
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
    { label: "Tests Taken",        value: stats.total_tests ?? 0,            icon: ClipboardList, grad: "from-blue-500 to-indigo-600" },
    { label: "Avg Score",          value: `${Math.round(stats.avg_score ?? 0)}%`, icon: BarChart2,     grad: "from-emerald-500 to-teal-600" },
    { label: "Practice Sessions",  value: stats.practice_sessions ?? 0,      icon: BookOpen,      grad: "from-violet-500 to-purple-600" },
    { label: "Day Streak",         value: `${stats.streak ?? 0}d`,           icon: Zap,           grad: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">Here is your placement preparation overview</p>
        </div>
        <Link to="/student/practice"
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          <Zap size={15} /> Start Practice <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, icon: Icon, grad }) => (
          <div key={label} className={"shadow-sm p-5 " + C}>
            <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 " + grad}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Plan progress */}
      {planProgress && (
        <div className={"p-4 mb-6 shadow-sm flex items-center justify-between " + C}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Calendar size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Study Plan Progress</p>
              <p className="text-xs text-gray-400">{planProgress.completed}/{planProgress.total} tasks done</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all"
                style={{ width: `${Math.round((planProgress.completed / planProgress.total) * 100)}%` }} />
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{Math.round((planProgress.completed / planProgress.total) * 100)}%</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar */}
        <div className={"p-5 shadow-sm " + C}>
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 text-sm">
            <TrendingDown size={16} className="text-red-500" /> Weak Areas
          </h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <BookOpen size={28} className="mb-2 text-gray-300" />
              <p className="text-sm">No data yet. Start practicing!</p>
            </div>
          )}
        </div>

        {/* Bar chart */}
        <div className={"p-5 shadow-sm " + C}>
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 text-sm">
            <BarChart2 size={16} className="text-indigo-500" /> Recent Test Scores
          </h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "none", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }}
                  formatter={(v) => [`${v}%`, "Score"]}
                />
                <Bar dataKey="score" fill="url(#grad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <BarChart2 size={28} className="mb-2 text-gray-300" />
              <p className="text-sm">No test attempts yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming tests + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={"p-5 shadow-sm " + C}>
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-4 flex items-center gap-2">
            <ClipboardList size={16} className="text-indigo-500" /> Upcoming Tests
          </h2>
          {upcomingTests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No upcoming tests scheduled</p>
          ) : (
            <div className="space-y-2">
              {upcomingTests.slice(0, 4).map(t => (
                <div key={t.test_id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.duration_minutes}min · {t.total_marks}marks</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                    {new Date(t.scheduled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={"p-5 shadow-sm " + C}>
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" /> Quick Links
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: "/student/materials", label: "Study Materials", grad: "from-violet-500 to-purple-600", Icon: BookOpen },
              { to: "/student/practice",  label: "Practice Now",    grad: "from-blue-500 to-cyan-600",    Icon: Zap },
              { to: "/student/companies", label: "Company Corner",  grad: "from-orange-500 to-amber-500", Icon: Calendar },
              { to: "/student/leaderboard",label: "Leaderboard",   grad: "from-emerald-500 to-teal-600", Icon: Trophy },
            ].map(({ to, label, grad, Icon }) => (
              <Link key={to} to={to}
                className={"flex items-center gap-2.5 p-3.5 rounded-xl bg-gradient-to-r text-white hover:opacity-90 transition-opacity " + grad}>
                <Icon size={16} />
                <span className="text-sm font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
