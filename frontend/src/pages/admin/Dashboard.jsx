import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users, ClipboardList, TrendingUp, Award, ShieldAlert, AlertTriangle,
  Activity, Clock, Target, FileText, ArrowRight, Plus, BookOpen, Flame
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const CARD = 'bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl';

/* ── helpers ── */
function relativeTime(date) {
  if (!date) return 'never';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ── small UI primitives ── */
function StatCard({ label, value, icon: Icon, tint, bg, hint }) {
  return (
    <div className={CARD + ' p-5'}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={16} className={tint} strokeWidth={2.25} />
        </div>
        {hint && (
          <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            {hint}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-start gap-2.5">
        {Icon && (
          <span className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center">
            <Icon size={15} className="text-slate-700 dark:text-slate-300" />
          </span>
        )}
        <div>
          <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon = Activity, title, hint, cta }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
        <Icon size={18} className="text-slate-400" />
      </div>
      <p className="text-[13.5px] font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      {hint && <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{hint}</p>}
      {cta}
    </div>
  );
}

/* ══════════════════════════════════════════ */

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full min-h-full flex flex-col animate-pulse bg-slate-50 dark:bg-[#09090d]">
      <div className="h-40 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600" />
      <div className="p-5 md:p-8 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />)}</div>
        <div className="h-64 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">{[...Array(2)].map((_, i) => <div key={i} className="h-56 bg-slate-200 dark:bg-white/[0.04] rounded-2xl" />)}</div>
      </div>
    </div>
  );

  const totalStudents = data?.total_students ?? 0;
  const activeToday = data?.active_today ?? 0;
  const testsThisWeek = data?.tests_this_week ?? 0;
  const avgScore = data?.avg_score ?? 0;

  const cards = [
    { label: 'Total students',  value: totalStudents,         icon: Users,         tint: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10',     hint: totalStudents > 0 ? 'enrolled' : null },
    { label: 'Active today',    value: activeToday,           icon: TrendingUp,    tint: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', hint: totalStudents > 0 ? `${Math.round((activeToday / totalStudents) * 100)}%` : null },
    { label: 'Tests this week', value: testsThisWeek,         icon: ClipboardList, tint: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10', hint: 'submitted' },
    { label: 'Avg score (30d)', value: `${Math.round(avgScore)}%`, icon: Award,    tint: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10',   hint: 'class avg' },
  ];

  const trend = data?.activity_trend || [];
  const trendData = trend.map(t => ({
    day: dayLabel(t.day),
    tests: Number(t.tests) || 0,
    practices: Number(t.practices) || 0,
  }));
  const trendTotal = trendData.reduce((sum, d) => sum + d.tests + d.practices, 0);

  const topPerformers = data?.top_performers || [];
  const atRisk = data?.at_risk_students || [];
  const weakTopics = data?.weak_topics || [];
  const recentActivity = data?.recent_activity || [];
  const recentViolations = data?.recent_violations || [];

  const riskLabel = {
    never_logged_in: 'Never logged in',
    inactive_7d:    'Inactive 7d+',
    low_score:      'Low avg score',
  };

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-8 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-end justify-between gap-4 animate-fade-in-up">
          <div>
            <p className="text-white/60 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Overview</p>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Admin dashboard</h1>
            <p className="text-white/70 text-sm mt-1.5">Monitor student engagement, performance, and platform health.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Link to="/admin/tests"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[12.5px] font-semibold px-3.5 py-2 rounded-lg transition-colors">
              <Plus size={13} /> Test
            </Link>
            <Link to="/admin/materials"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[12.5px] font-semibold px-3.5 py-2 rounded-lg transition-colors">
              <Plus size={13} /> Material
            </Link>
            <Link to="/admin/users"
              className="inline-flex items-center gap-1.5 bg-white text-slate-900 hover:bg-slate-100 text-[12.5px] font-semibold px-3.5 py-2 rounded-lg transition-colors">
              <Users size={13} /> Students
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => <StatCard key={c.label} {...c} />)}
        </div>

        {/* Activity trend */}
        <div className={CARD + ' p-5 md:p-6'}>
          <SectionHeading
            icon={Activity}
            title="Engagement — last 7 days"
            subtitle={trendTotal > 0
              ? `${trendTotal} total activities this week`
              : 'No activity yet — assign a test or create a study plan to get going'}
          />
          {trendTotal > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="aTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.40} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="aPractice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.18)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  cursor={{ stroke: 'rgb(139 92 246 / 0.4)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  contentStyle={{
                    background: 'white',
                    border: '1px solid rgb(226 232 240)',
                    borderRadius: 10,
                    boxShadow: '0 4px 16px -4px rgb(15 23 42 / 0.08)',
                    color: '#0f172a',
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="tests"     stroke="#8b5cf6" strokeWidth={2} fill="url(#aTests)" />
                <Area type="monotone" dataKey="practices" stroke="#22d3ee" strokeWidth={2} fill="url(#aPractice)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={Activity}
              title="Quiet here for now"
              hint="Once students start submitting tests and practice sessions, you'll see the daily trend here."
            />
          )}
          {trendTotal > 0 && (
            <div className="mt-3 flex items-center gap-5 text-[11.5px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-violet-500" />Tests submitted</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />Practice completed</span>
            </div>
          )}
        </div>

        {/* Top performers + At-risk students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top performers */}
          <div className={CARD + ' p-5 md:p-6'}>
            <SectionHeading
              icon={Award}
              title="Top performers"
              subtitle="Highest average accuracy this month"
              action={topPerformers.length > 0 && (
                <Link to="/admin/reports"
                  className="text-[11.5px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 inline-flex items-center gap-1">
                  All reports <ArrowRight size={11} />
                </Link>
              )}
            />
            {topPerformers.length > 0 ? (
              <div className="space-y-2">
                {topPerformers.map((p, i) => (
                  <div key={p.user_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.test_count || 0} test{p.test_count == 1 ? '' : 's'} taken</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{Math.round(p.avg_score)}%</p>
                      <p className="text-[10px] text-slate-400">avg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Award} title="No test results yet" hint="Top performers will appear here once students complete tests." />
            )}
          </div>

          {/* At-risk */}
          <div className={CARD + ' p-5 md:p-6'}>
            <SectionHeading
              icon={AlertTriangle}
              title="Students needing attention"
              subtitle="Inactive, never logged in, or low avg score"
              action={atRisk.length > 0 && (
                <Link to="/admin/users"
                  className="text-[11.5px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 inline-flex items-center gap-1">
                  All students <ArrowRight size={11} />
                </Link>
              )}
            />
            {atRisk.length > 0 ? (
              <div className="space-y-2">
                {atRisk.map(s => (
                  <div key={s.user_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="w-7 h-7 rounded-md bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10.5px] font-bold flex items-center justify-center flex-shrink-0">
                      {initials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{s.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 whitespace-nowrap">
                        {riskLabel[s.risk_reason] || 'At risk'}
                      </span>
                      <span className="text-[10px] text-slate-400">{relativeTime(s.last_login)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="Everyone's on track" hint="No students with concerning activity right now." />
            )}
          </div>
        </div>

        {/* Weak topics + Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weak topics */}
          <div className={CARD + ' p-5 md:p-6'}>
            <SectionHeading
              icon={Target}
              title="Class-wide weak topics"
              subtitle="Lowest average accuracy across the platform"
            />
            {weakTopics.length > 0 ? (
              <div className="space-y-3">
                {weakTopics.map(t => {
                  const pct = Math.max(0, Math.min(100, Number(t.avg_accuracy) || 0));
                  const tone = pct < 40 ? 'bg-rose-500' : pct < 60 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <div key={t.topic_id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 truncate">{t.topic_name}</p>
                          <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            {t.subject_name} · {t.student_count} student{t.student_count == 1 ? '' : 's'}
                          </p>
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 tracking-tight flex-shrink-0 ml-3">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                        <div className={`h-full ${tone} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Target} title="No skill data yet" hint="As students attempt practice and tests, topic-level weaknesses will surface here." />
            )}
          </div>

          {/* Recent activity */}
          <div className={CARD + ' p-5 md:p-6'}>
            <SectionHeading
              icon={Clock}
              title="Recent activity"
              subtitle="Latest test submissions & practice sessions"
            />
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      a.kind === 'test'
                        ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    }`}>
                      {a.kind === 'test' ? <ClipboardList size={14} /> : <Flame size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-800 dark:text-slate-100">
                        <span className="font-semibold">{a.student_name}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {' '}{a.kind === 'test' ? 'submitted' : 'completed'}{' '}
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{a.detail}</span>
                      </p>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">{relativeTime(a.at)}</p>
                    </div>
                    {a.score != null && (
                      <span className={`text-[11.5px] font-bold flex-shrink-0 ${
                        a.score >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                        a.score >= 50 ? 'text-amber-600 dark:text-amber-400' :
                                        'text-rose-600 dark:text-rose-400'
                      }`}>
                        {Math.round(a.score)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Clock} title="Nothing yet" hint="Activity will stream in here as students take tests and practice." />
            )}
          </div>
        </div>

        {/* Recent violations — only render if any */}
        {recentViolations.length > 0 && (
          <div className={CARD + ' p-5 md:p-6'}>
            <SectionHeading
              icon={ShieldAlert}
              title="Recent proctoring violations"
              subtitle="Incidents flagged during proctored tests"
            />
            <div className="space-y-2">
              {recentViolations.slice(0, 5).map(v => (
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

        {/* When the whole platform is empty, surface a friendly getting-started panel */}
        {totalStudents === 0 && (
          <div className={CARD + ' p-6 md:p-8'}>
            <SectionHeading icon={BookOpen} title="Get started" subtitle="Set up the platform for your students" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { to: '/admin/users',     icon: Users,         label: 'Invite students',     desc: 'Add accounts in bulk or one by one' },
                { to: '/admin/materials', icon: FileText,      label: 'Upload materials',    desc: 'Add videos, PDFs, shortcut sheets' },
                { to: '/admin/tests',     icon: ClipboardList, label: 'Build your first test', desc: 'Create or AI-generate a question set' },
              ].map(item => (
                <Link key={item.to} to={item.to}
                  className="group rounded-xl border border-slate-200 dark:border-white/[0.06] p-4 hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                  <item.icon size={16} className="text-slate-500 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                  <p className="mt-3 text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">{item.label}</p>
                  <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
