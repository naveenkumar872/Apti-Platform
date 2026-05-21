import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, ClipboardList, TrendingUp, Award, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CARD = "bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full min-h-full flex flex-col animate-pulse">
      <div className="h-40 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600" />
      <div className="p-5 md:p-8 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />)}</div>
        <div className="h-64 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
      </div>
    </div>
  );

  const cards = [
    { label: 'Total Students',  value: stats?.total_students ?? 0,           icon: Users,         tint: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Active Today',    value: stats?.active_today ?? 0,             icon: TrendingUp,    tint: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Tests This Week', value: stats?.tests_this_week ?? 0,          icon: ClipboardList, tint: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { label: 'Avg Score',       value: `${Math.round(stats?.avg_score ?? 0)}%`, icon: Award,      tint: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ];

  const performanceData = (stats?.top_performers || []).slice(0, 8).map(p => ({
    name: p.name.split(' ')[0],
    score: Math.round(p.avg_score),
  }));

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-8 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative animate-fade-in-up">
          <p className="text-white/60 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Overview</p>
          <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Admin dashboard</h1>
          <p className="text-white/70 text-sm mt-1.5">Platform overview and analytics, at a glance.</p>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map(({ label, value, icon: Icon, tint, bg }) => (
            <div key={label} className={CARD + ' p-5'}>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                <Icon size={16} className={tint} strokeWidth={2.25} />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Top Performers */}
        {performanceData.length > 0 && (
          <div className={CARD + ' p-6 mb-6'}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Top performers</h2>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Highest average scores this period</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={performanceData} barCategoryGap={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.18)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
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
                  formatter={(v) => [`${v}%`, 'Avg Score']}
                />
                <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Violations */}
        {stats?.recent_violations?.length > 0 && (
          <div className={CARD + ' p-5'}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={15} className="text-rose-500" />
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Recent violations</h2>
            </div>
            <div className="space-y-2">
              {stats.recent_violations.slice(0, 5).map(v => (
                <div key={v.violation_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className="w-1 h-7 rounded-full bg-rose-500" />
                    <div>
                      <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">{v.student_name}</p>
                      <p className="text-[11.5px] text-rose-600 dark:text-rose-400 capitalize">{v.violation_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">{new Date(v.occurred_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
