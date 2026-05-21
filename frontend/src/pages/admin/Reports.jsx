import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Users, TrendingUp, ClipboardList, Award, ChevronLeft,
  BarChart2, BookOpen, Shield, CheckCircle, XCircle
} from 'lucide-react';

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";

// ── Test Report Detail ────────────────────────────────────────────────────────
function TestReportView({ test, onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/reports/tests/${test.test_id}`)
      .then(r => setReport(r.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [test.test_id]);

  const chartData = (report?.students || []).slice(0, 15).map(s => ({
    name: s.student_name?.split(' ')[0] || 'Student',
    score: Math.round(s.percentage || 0),
  }));

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-br from-rose-600 via-pink-600 to-purple-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <button onClick={onBack}
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft size={16} /> Back to Reports
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-white">{test.title}</h1>
          <p className="text-white/70 text-sm mt-1.5">Test Report</p>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : report ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Attempts', value: report.total_attempts ?? 0 },
                { label: 'Average Score', value: `${Math.round(report.avg_score || 0)}%` },
                { label: 'Highest Score', value: `${Math.round(report.max_score || 0)}%` },
              ].map(({ label, value }) => (
                <div key={label} className={C + ' p-4 shadow-sm text-center'}>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {chartData.length > 0 && (
              <div className={C + ' p-5 shadow-sm mb-6'}>
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

            <div className={C + ' shadow-sm overflow-hidden'}>
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">Leaderboard</h2>
              </div>
              {(report.students || []).length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No attempts yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Rank</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Student</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Score</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Percentage</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Accuracy</th>
                      <th className="text-left px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.students || []).map((s, idx) => (
                      <tr key={s.attempt_id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-400 dark:text-gray-500 text-xs">#{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 dark:text-gray-100">{s.student_name}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.score}/{s.total_marks}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            s.percentage >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : s.percentage >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          }`}>
                            {Math.round(s.percentage || 0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                          {s.accuracy_percent != null ? `${Math.round(s.accuracy_percent)}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                          {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-center py-10">No report data available</p>
        )}
      </div>
    </div>
  );
}

// ── Student Report Detail ─────────────────────────────────────────────────────
function StudentReportView({ student, onBack }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    api.get(`/admin/reports/students/${student.user_id}`)
      .then(r => setReport(r.data))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [student.user_id]);

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <button onClick={onBack}
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft size={16} /> Back to Reports
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-white">{student.name}</h1>
          <p className="text-white/70 text-sm mt-1.5">{student.email}</p>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {[
            { key: 'history', label: 'Attempt History' },
            { key: 'performance', label: 'Performance Analysis' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === key
                  ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : report ? (
          <>
            {/* Performance Analysis Tab */}
            {activeTab === 'performance' && (
              (report.skills || []).length === 0 ? (
                <div className={C + ' p-10 text-center shadow-sm'}>
                  <p className="text-gray-400 text-sm">No skill data yet — student needs to attempt more sessions</p>
                </div>
              ) : (
                <div className={C + ' p-5 shadow-sm'}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-100">Topic Performance</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Strong</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Needs work</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {report.skills.map((sk, i) => {
                      const pct = Math.min(100, Math.round(sk.avg_score || 0));
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {sk.topic_name}
                              <span className="text-gray-400 font-normal ml-1">({sk.subject_name})</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{pct}%</span>
                              <span className={sk.is_weak ? 'text-red-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                                {sk.is_weak ? 'Needs work' : 'Strong'}
                              </span>
                            </div>
                          </div>
                          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${sk.is_weak ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                            <span>{sk.correct_count ?? 0} correct / {sk.total_attempts ?? 0} attempts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* Attempt History Tab */}
            {activeTab === 'history' && (
            <div className={C + ' shadow-sm overflow-hidden'}>
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">Attempt History</h2>
                <span className="text-xs text-gray-400">{(report.attempts || []).length} attempts</span>
              </div>
              {(report.attempts || []).length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No attempts yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">#</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Test Name</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Assigned By</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Mode</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Topic(s)</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Score</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Grade</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {report.attempts.map((a, idx) => {
                        const pct = Math.round(a.percentage || 0);
                        const gradeLabel = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'D';
                        const gradeCls = pct >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : pct >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
                        return (
                          <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 text-xs">{idx + 1}</td>
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{a.title || 'Practice'}</p>
                              {a.violations_count > 0 && (
                                <p className="text-[10px] text-red-400 mt-0.5">{a.violations_count} violation{a.violations_count !== 1 ? 's' : ''}</p>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              {a.type === 'practice' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                                  <BookOpen size={10} /> Self
                                </span>
                              ) : a.assigned_by_name ? (
                                <span className="inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
                                  {a.assigned_by_name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${
                                a.mode === 'test' || a.mode === 'proctored'
                                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              }`}>
                                {a.mode === 'test' || a.mode === 'proctored'
                                  ? <><Shield size={10} /> Test</>
                                  : <><BookOpen size={10} /> Practice</>}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-wrap gap-1 max-w-[180px]">
                                {a.topics ? a.topics.split(', ').map((t, i) => (
                                  <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">{t}</span>
                                )) : <span className="text-gray-400 text-xs">General</span>}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 dark:text-gray-100">{pct}%</span>
                                <div className="w-14 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5">{a.score}/{a.total_marks} marks</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${gradeCls}`}>
                                {gradeLabel}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                              {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            )}
          </>
        ) : (
          <p className="text-gray-400 text-center py-10">No data available</p>
        )}
      </div>
    </div>
  );
}

// ── Main Reports page ─────────────────────────────────────────────────────────
export default function AdminReports() {
  const [tab, setTab] = useState('tests');
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/admin/tests').then(r => setTests(r.data.tests || [])),
      api.get('/admin/users?role=student').then(r => setStudents(r.data.users || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (selectedTest) {
    return <TestReportView test={selectedTest} onBack={() => setSelectedTest(null)} />;
  }
  if (selectedStudent) {
    return <StudentReportView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  const statCards = [
    { label: 'Total Students', value: stats?.total_students ?? students.length, icon: Users, grad: 'from-blue-500 to-indigo-600' },
    { label: 'Active Today', value: stats?.active_today ?? 0, icon: TrendingUp, grad: 'from-emerald-500 to-teal-600' },
    { label: 'Tests This Week', value: stats?.tests_this_week ?? 0, icon: ClipboardList, grad: 'from-violet-500 to-purple-600' },
    { label: 'Avg Score', value: `${Math.round(stats?.avg_score ?? 0)}%`, icon: Award, grad: 'from-orange-500 to-amber-500' },
  ];

  const publishedTests = tests.filter(t => t.status !== 'draft');
  const draftTests = tests.filter(t => t.status === 'draft');

  const statusColors = {
    live: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-rose-600 via-pink-600 to-purple-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
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
          {statCards.map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className={C + ' p-4 shadow-sm'}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          {[{ key: 'tests', label: 'Test Reports' }, { key: 'students', label: 'Student Reports' }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === key
                  ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : tab === 'tests' ? (
          <>
            {publishedTests.length === 0 && draftTests.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">No tests created yet</p>
            ) : (
              <>
                {publishedTests.length > 0 && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Published Tests</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                      {publishedTests.map(t => (
                        <button key={t.test_id} onClick={() => setSelectedTest(t)}
                          className={C + ' p-5 shadow-sm text-left hover:shadow-md transition-all hover:border-rose-200 dark:hover:border-rose-900 group'}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{t.title}</h3>
                            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${statusColors[t.status] || statusColors.draft}`}>
                              {t.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.duration_minutes} min · {t.total_marks} marks</p>
                          <p className="text-xs text-rose-500 dark:text-rose-400 mt-3 font-medium">View report →</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {draftTests.length > 0 && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Drafts</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {draftTests.map(t => (
                        <div key={t.test_id} className={C + ' p-5 opacity-50'}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-gray-700 dark:text-gray-300">{t.title}</h3>
                            <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors.draft}`}>draft</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.duration_minutes} min · {t.total_marks} marks</p>
                          <p className="text-xs text-gray-400 mt-3">Publish to see reports</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {students.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">No students registered yet</p>
            ) : (
              <div className={C + ' shadow-sm overflow-hidden'}>
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">All Students</h2>
                  <span className="text-xs text-gray-400">{students.length} registered</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">#</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Student</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Batch</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">College / Branch</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Year</th>
                        <th className="text-left px-5 py-3 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">Last Login</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {students.map((s, idx) => (
                        <tr key={s.user_id}
                          className="hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors group cursor-pointer"
                          onClick={() => setSelectedStudent(s)}>
                          <td className="px-5 py-3.5 text-gray-400 dark:text-gray-500 text-xs font-medium">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {(s.name || 'S').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">{s.name}</p>
                                <p className="text-xs text-gray-400 truncate">{s.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {s.batch_name
                              ? <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 px-2.5 py-1 rounded-full font-medium">{s.batch_name}</span>
                              : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">
                            {s.college || '—'}
                            {s.branch ? <span className="text-gray-400"> · {s.branch}</span> : ''}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">
                            {s.year ? `Year ${s.year}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                            {s.last_login ? new Date(s.last_login).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-xs text-violet-500 dark:text-violet-400 font-semibold group-hover:underline whitespace-nowrap">
                              View Report →
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
