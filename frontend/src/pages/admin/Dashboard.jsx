import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, ClipboardList, BookOpen, TrendingUp, Award, BarChart2, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";

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
      <div className="h-36 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600" />
      <div className="p-5 md:p-8 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />)}</div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    </div>
  );

  const cards = [
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: Users, grad: 'from-blue-500 to-indigo-600' },
    { label: 'Active Today', value: stats?.active_today ?? 0, icon: TrendingUp, grad: 'from-emerald-500 to-teal-600' },
    { label: 'Tests This Week', value: stats?.tests_this_week ?? 0, icon: ClipboardList, grad: 'from-violet-500 to-purple-600' },
    { label: 'Avg Score', value: `${Math.round(stats?.avg_score ?? 0)}%`, icon: Award, grad: 'from-orange-500 to-amber-500' },
  ];

  const performanceData = (stats?.top_performers || []).slice(0, 8).map(p => ({
    name: p.name.split(' ')[0],
    score: Math.round(p.avg_score),
  }));

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={15} className="text-white/70" />
            <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Admin Dashboard</h1>
          <p className="text-white/70 text-sm mt-1.5">Platform overview &amp; analytics</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className={C + " p-4 shadow-sm"}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Top Performers Chart */}
        {performanceData.length > 0 && (
          <div className={C + " p-5 shadow-sm mb-6"}>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Top Performers</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(75 85 99 / 0.3)" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
                  formatter={(v) => [`${v}%`, 'Avg Score']}
                />
                <Bar dataKey="score" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Violations */}
        {stats?.recent_violations?.length > 0 && (
          <div className={C + " p-5 shadow-sm"}>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-500" /> Recent Violations
            </h2>
            <div className="space-y-2">
              {stats.recent_violations.slice(0, 5).map(v => (
                <div key={v.violation_id} className="flex items-center justify-between text-sm p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{v.student_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{v.violation_type.replace('_', ' ')}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(v.occurred_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}</div>;

  const cards = [
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: Users, color: 'blue' },
    { label: 'Active Today', value: stats?.active_today ?? 0, icon: TrendingUp, color: 'green' },
    { label: 'Tests This Week', value: stats?.tests_this_week ?? 0, icon: ClipboardList, color: 'purple' },
    { label: 'Avg Score', value: `${Math.round(stats?.avg_score ?? 0)}%`, icon: Award, color: 'orange' },
  ];

  const performanceData = (stats?.top_performers || []).slice(0, 8).map(p => ({
    name: p.name.split(' ')[0],
    score: Math.round(p.avg_score),
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center mb-3`}>
              <Icon size={20} className={`text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {performanceData.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Top Performers</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, 'Avg Score']} />
              <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Violations */}
      {stats?.recent_violations?.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-3">Recent Violations</h2>
          <div className="space-y-2">
            {stats.recent_violations.slice(0, 5).map(v => (
              <div key={v.violation_id} className="flex items-center justify-between text-sm p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{v.student_name}</p>
                  <p className="text-xs text-gray-500">{v.violation_type.replace('_', ' ')}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(v.occurred_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
