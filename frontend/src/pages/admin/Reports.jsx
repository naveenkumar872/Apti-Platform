import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, BarChart2, Users, TrendingUp, ClipboardList, Award } from 'lucide-react';

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";

export default function AdminReports() {
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/admin/tests', { params: { status: 'completed' } })
      .then(r => setTests(r.data.tests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadReport = async (test) => {
    setSelected(test);
    setLoadingReport(true);
    try {
      const res = await api.get(`/admin/tests/${test.test_id}/report`);
      setReport(res.data);
    } catch { setReport(null); }
    finally { setLoadingReport(false); }
  };

  if (selected) {
    const chartData = (report?.students || []).slice(0, 15).map(s => ({
      name: s.student_name.split(' ')[0],
      score: Math.round(s.percentage),
    }));

    return (
      <div className="w-full min-h-full flex flex-col">
        <div className="relative bg-gradient-to-br from-rose-600 via-pink-600 to-purple-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="relative">
            <button onClick={() => { setSelected(null); setReport(null); }}
              className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
              <ChevronLeft size={16} /> Back to Tests
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-white">{selected.title}</h1>
            <p className="text-white/70 text-sm mt-1.5">Test Report</p>
          </div>
        </div>

        <div className="flex-1 p-5 md:p-8">
          {loadingReport ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
          ) : report ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Total Attempts', value: report.total_attempts },
                  { label: 'Average Score', value: `${Math.round(report.avg_score || 0)}%` },
                  { label: 'Highest Score', value: `${Math.round(report.max_score || 0)}%` },
                ].map(({ label, value }) => (
                  <div key={label} className={C + " p-4 shadow-sm text-center"}>
                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {chartData.length > 0 && (
                <div className={C + " p-5 shadow-sm mb-6"}>
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Score Distribution</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(75 85 99 / 0.3)" />
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f9fafb' }}
                        formatter={(v) => [`${v}%`, 'Score']}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#e11d48" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className={C + " shadow-sm overflow-hidden"}>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Student</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Score</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Percentage</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.students || []).map(s => (
                      <tr key={s.attempt_id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{s.student_name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.score}/{s.max_score}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${s.percentage >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : s.percentage >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                            {Math.round(s.percentage)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-center py-10">No report data available</p>
          )}
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: Users, grad: 'from-blue-500 to-indigo-600' },
    { label: 'Active Today', value: stats?.active_today ?? 0, icon: TrendingUp, grad: 'from-emerald-500 to-teal-600' },
    { label: 'Tests This Week', value: stats?.tests_this_week ?? 0, icon: ClipboardList, grad: 'from-violet-500 to-purple-600' },
    { label: 'Avg Score', value: `${Math.round(stats?.avg_score ?? 0)}%`, icon: Award, grad: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-rose-600 via-pink-600 to-purple-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 size={15} className="text-white/70" />
            <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Analytics</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Reports</h1>
          <p className="text-white/70 text-sm mt-1.5">View test results &amp; student performance</p>
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
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
        ) : tests.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No completed tests</p>
        ) : (
          <div className="space-y-3">
            {tests.map(t => (
              <button key={t.test_id} onClick={() => loadReport(t)}
                className={"w-full " + C + " p-5 shadow-sm hover:border-rose-400 dark:hover:border-rose-600 transition-all text-left"}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.duration_minutes} min · {t.total_marks} marks</p>
                  </div>
                  <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs px-2 py-1 rounded-full">Completed</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
