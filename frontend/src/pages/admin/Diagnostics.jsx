import { useEffect, useState } from 'react';
import {
  Target, CheckCircle2, Clock, Search, ArrowLeft, Users as UsersIcon,
  TrendingUp, Award, AlertTriangle, Loader2, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { DiagnosticReport } from '../student/Diagnostic';
import MasteryPanel from '../../components/learning/MasteryPanel';

const CARD = 'bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl';

function tone(pct) {
  if (pct == null) return { text: 'text-slate-400', bg: 'bg-slate-100 dark:bg-white/[0.04]', label: '—' };
  if (pct >= 75) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Strong' };
  if (pct >= 50) return { text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10',     label: 'On track' };
  return            { text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-500/10',       label: 'Weak' };
}

function relativeTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ─────────────────────────────────────────────────
   Student detail view
   ───────────────────────────────────────────────── */
function StudentDetail({ studentId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/diagnostics/${studentId}`)
      .then(r => setData(r.data))
      .catch(err => toast.error(err.response?.data?.error || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [studentId]);

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <button onClick={onBack}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-[12.5px] font-semibold mb-3 transition-colors">
            <ArrowLeft size={13} /> All diagnostics
          </button>
          <p className="text-white/70 text-[11px] font-semibold tracking-[0.18em] uppercase">Diagnostic report</p>
          <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight mt-1">
            {data?.student?.name || 'Loading…'}
          </h1>
          {data?.student?.email && (
            <p className="text-white/75 text-sm mt-0.5">
              {data.student.email}{data.student.branch ? ` · ${data.student.branch}` : ''}{data.student.year ? ` · Year ${data.student.year}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : data ? (
          <>
            <DiagnosticReport data={data} isAdmin />
            {/* Mastery snapshot since the diagnostic (updates from every practice & test) */}
            <div className="max-w-5xl mx-auto w-full">
              <MasteryPanel adminStudentId={studentId} />
            </div>
          </>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-10 text-sm">No data.</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   List view
   ───────────────────────────────────────────────── */
export default function Diagnostics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | completed | pending
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/diagnostics')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load diagnostics'))
      .finally(() => setLoading(false));
  }, []);

  if (selectedId) {
    return <StudentDetail studentId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const students = data?.students || [];
  const summary = data?.summary || {};

  const filtered = students.filter(s => {
    if (filter === 'completed' && !s.completed) return false;
    if (filter === 'pending' && s.completed) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const cards = [
    { label: 'Total students',   value: summary.total_students ?? 0,                       icon: UsersIcon, tint: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Completed',        value: summary.completed_count ?? 0,                      icon: CheckCircle2, tint: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Pending',          value: summary.pending_count ?? 0,                        icon: Clock,     tint: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Avg class score',  value: `${Math.round(summary.avg_accuracy ?? 0)}%`,       icon: TrendingUp, tint: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  ];

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <p className="text-white/70 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Assessment</p>
          <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Diagnostic reports</h1>
          <p className="text-white/80 text-sm mt-1.5">First-time aptitude assessment for every enrolled student.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-8 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className={CARD + ' p-5'}>
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
                <c.icon size={16} className={c.tint} strokeWidth={2.25} />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{c.value}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={CARD + ' p-4 flex flex-wrap items-center gap-3'}>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-[3px] focus:ring-violet-500/15 transition-all"
            />
          </div>
          <div className="inline-flex bg-slate-100 dark:bg-white/[0.04] rounded-lg p-0.5">
            {[
              { v: 'all',       label: 'All' },
              { v: 'completed', label: 'Completed' },
              { v: 'pending',   label: 'Pending' },
            ].map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                  filter === f.v
                    ? 'bg-white dark:bg-[#161620] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <div className={CARD + ' p-10 text-center'}>
            <Target size={28} className="text-slate-400 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">No matching students</p>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
              {filter === 'pending'   ? 'Everyone has taken the diagnostic.' :
               filter === 'completed' ? 'No students have taken the diagnostic yet.' :
                                        'Try a different search term.'}
            </p>
          </div>
        ) : (
          <div className={CARD + ' overflow-hidden'}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.03]">
                  <tr>
                    <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</th>
                    <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Section snapshot</th>
                    <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taken</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {filtered.map(s => {
                    const t = tone(s.accuracy_percent);
                    return (
                      <tr key={s.user_id}
                          onClick={() => s.completed && setSelectedId(s.user_id)}
                          className={`group transition-colors ${
                            s.completed
                              ? 'hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer'
                              : ''}`}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                              {initials(s.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{s.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {s.completed ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              <CheckCircle2 size={11} /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
                              <Clock size={11} /> Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {s.completed ? (
                            <span className={`text-[14px] font-bold ${t.text}`}>{Math.round(s.accuracy_percent)}%</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-[13px]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {s.completed && Array.isArray(s.sections) && s.sections.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {s.sections.slice(0, 4).map((sec, i) => {
                                const st = tone(sec.accuracy_percent);
                                return (
                                  <span key={i}
                                    title={`${sec.subject_name}: ${sec.accuracy_percent}%`}
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${st.bg} ${st.text}`}>
                                    {(sec.subject_name || '').match(/^(Q|L|V|D)/i)?.[1]?.toUpperCase() || '?'}{sec.accuracy_percent}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-[12px]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-[12px] text-slate-500 dark:text-slate-400">
                          {relativeTime(s.completed_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {s.completed && (
                            <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-violet-500 transition-colors" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
