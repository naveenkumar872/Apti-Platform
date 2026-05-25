import { useEffect, useState } from 'react';
import {
  TrendingDown, Loader2, Trophy, AlertTriangle,
  BarChart2, BookOpen, Target, Info, FlaskConical, ClipboardList
} from 'lucide-react';
import api from '../../services/api';

const CARD = 'bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl';

function severityColor(acc) {
  if (acc < 30) return { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500', badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300', label: 'Critical' };
  if (acc < 50) return { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300', label: 'Weak' };
  return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-400', badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300', label: 'Borderline' };
}

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* Single topic row — used in both tabs */
function TopicRow({ topicName, subjectName, acc, correct, total, date, overallAcc }) {
  const c = severityColor(acc);
  return (
    <div className={CARD + ' overflow-hidden'}>
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <TrendingDown size={16} className={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">{topicName}</p>
          <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">{subjectName}</p>
        </div>
        <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${c.badge} flex-shrink-0`}>
          {c.label} · {acc}%
        </span>
        <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
          <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
            {Number(correct)}/{Number(total)} correct
          </p>
          {overallAcc != null && overallAcc !== acc && (
            <p className="text-[10.5px] text-slate-400 mt-0.5">Overall: {overallAcc}%</p>
          )}
          {date && <p className="text-[10.5px] text-slate-400 mt-0.5">{fmt(date)}</p>}
        </div>
      </div>
      <div className="h-1 bg-slate-100 dark:bg-white/[0.04] mx-5 mb-1 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${acc}%` }} />
      </div>
    </div>
  );
}

/* ── Diagnostic Tab ─────────────────────────────── */
function DiagnosticTab({ diagBreakdown }) {
  if (diagBreakdown.length === 0) {
    return (
      <div className={CARD + ' p-10 flex flex-col items-center gap-2 text-center'}>
        <Trophy size={22} className="text-emerald-500" />
        <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">No weak areas in Diagnostic</p>
        <p className="text-[12.5px] text-slate-500">You scored ≥60% on every topic in the diagnostic test.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {diagBreakdown.map((r, i) => (
        <TopicRow
          key={r.topic_id ?? `subj-${r.subject_id}-${i}`}
          topicName={r.topic_name}
          subjectName={r.subject_name}
          acc={Number(r.accuracy_in_test) || 0}
          correct={r.correct_questions}
          total={r.total_questions}
          date={r.submitted_at}
        />
      ))}
    </div>
  );
}

/* ── Practice Tab ──────────────────────────────── */
function PracticeTab({ practiceBreakdown, weakTopicsMap }) {
  if (practiceBreakdown.length === 0) {
    return (
      <div className={CARD + ' p-10 flex flex-col items-center gap-2 text-center'}>
        <BookOpen size={22} className="text-slate-400" />
        <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">No weak areas in Practice</p>
        <p className="text-[12.5px] text-slate-500">Complete practice sessions to see weak topic breakdown here.</p>
      </div>
    );
  }

  // Group by session title
  const bySession = {};
  for (const r of practiceBreakdown) {
    const key = r.session_title || 'Practice Session';
    if (!bySession[key]) bySession[key] = [];
    bySession[key].push(r);
  }

  return (
    <div className="space-y-6">
      {Object.entries(bySession).map(([sessionTitle, rows]) => (
        <div key={sessionTitle}>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={13} className="text-teal-400" />
            <h3 className="text-[12px] font-semibold text-teal-500 dark:text-teal-400 uppercase tracking-widest truncate">
              {sessionTitle}
            </h3>
            <span className="ml-1 flex-shrink-0 text-[10.5px] bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {rows.length} topic{rows.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {rows
              .sort((a, b) => Number(a.accuracy_in_test) - Number(b.accuracy_in_test))
              .map((r, i) => {
                const overall = weakTopicsMap[r.topic_id]?.accuracy_percent;
                return (
                  <TopicRow
                    key={`${r.session_id}-${r.topic_id ?? i}`}
                    topicName={r.topic_name}
                    subjectName={r.subject_name}
                    acc={Number(r.accuracy_in_test) || 0}
                    correct={r.correct_questions}
                    total={r.total_questions}
                    date={r.submitted_at}
                    overallAcc={overall != null ? Number(overall) : null}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tests Tab ──────────────────────────────────── */
function TestsTab({ testBreakdown, weakTopicsMap }) {
  if (testBreakdown.length === 0) {
    return (
      <div className={CARD + ' p-10 flex flex-col items-center gap-2 text-center'}>
        <ClipboardList size={22} className="text-slate-400" />
        <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">No test data yet</p>
        <p className="text-[12.5px] text-slate-500">Take tests to see per-test weak topic breakdown here.</p>
      </div>
    );
  }

  // Group by test_title
  const byTest = {};
  for (const r of testBreakdown) {
    const key = r.test_title || 'Unknown Test';
    if (!byTest[key]) byTest[key] = [];
    byTest[key].push(r);
  }

  return (
    <div className="space-y-6">
      {Object.entries(byTest).map(([testTitle, rows]) => (
        <div key={testTitle}>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={13} className="text-violet-400" />
            <h3 className="text-[12px] font-semibold text-violet-500 dark:text-violet-400 uppercase tracking-widest truncate">
              {testTitle}
            </h3>
            <span className="ml-1 flex-shrink-0 text-[10.5px] bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {rows.length} topic{rows.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {rows
              .sort((a, b) => Number(a.accuracy_in_test) - Number(b.accuracy_in_test))
              .map((r, i) => {
                const overall = weakTopicsMap[r.topic_id]?.accuracy_percent;
                return (
                  <TopicRow
                    key={`${r.attempt_id}-${r.topic_id ?? i}`}
                    topicName={r.topic_name}
                    subjectName={r.subject_name}
                    acc={Number(r.accuracy_in_test) || 0}
                    correct={r.correct_questions}
                    total={r.total_questions}
                    date={r.submitted_at}
                    overallAcc={overall != null ? Number(overall) : null}
                  />
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WeakTopics() {
  const [loading, setLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState([]);
  const [testBreakdown, setTestBreakdown] = useState([]);
  const [diagBreakdown, setDiagBreakdown] = useState([]);
  const [practiceBreakdown, setPracticeBreakdown] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('diagnostic');

  useEffect(() => {
    setLoading(true);
    api.get('/student/weak-topics')
      .then(r => {
        setWeakTopics(r.data.weak_topics || []);
        setTestBreakdown(r.data.test_breakdown || []);
        setDiagBreakdown(r.data.diag_breakdown || []);
        setPracticeBreakdown(r.data.practice_breakdown || []);
      })
      .catch(() => setError('Failed to load weak topics. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const weakTopicsMap = weakTopics.reduce((m, t) => { m[t.topic_id] = t; return m; }, {});
  const criticalCount = weakTopics.filter(t => Number(t.accuracy_percent) < 30).length;
  const weakCount = weakTopics.filter(t => Number(t.accuracy_percent) >= 30 && Number(t.accuracy_percent) < 50).length;

  const tabs = [
    { id: 'diagnostic', label: 'Diagnostic Test', icon: FlaskConical,  count: diagBreakdown.length },
    { id: 'tests',      label: 'Tests',            icon: ClipboardList, count: testBreakdown.length },
    { id: 'practice',   label: 'Practice',         icon: BookOpen,      count: practiceBreakdown.length },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white">Weak Topics</h1>
        </div>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 ml-10.5">
          Topics where your accuracy is below 60%. Improve your score to clear them.
        </p>
      </div>

      {loading && (
        <div className={CARD + ' p-12 flex flex-col items-center gap-3'}>
          <Loader2 size={22} className="animate-spin text-slate-400" />
          <p className="text-[13px] text-slate-400">Analysing your performance…</p>
        </div>
      )}

      {error && !loading && (
        <div className={CARD + ' p-8 flex flex-col items-center gap-2 text-center'}>
          <AlertTriangle size={22} className="text-red-400" />
          <p className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className={CARD + ' p-4 flex items-center gap-3'}>
              <Target size={18} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-[20px] font-bold text-slate-900 dark:text-white">{weakTopics.length}</p>
                <p className="text-[11px] text-slate-500">Weak topics</p>
              </div>
            </div>
            <div className={CARD + ' p-4 flex items-center gap-3'}>
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-[20px] font-bold text-red-600 dark:text-red-400">{criticalCount}</p>
                <p className="text-[11px] text-slate-500">Critical (&lt;30%)</p>
              </div>
            </div>
            <div className={CARD + ' p-4 flex items-center gap-3'}>
              <BarChart2 size={18} className="text-orange-400 flex-shrink-0" />
              <div>
                <p className="text-[20px] font-bold text-orange-600 dark:text-orange-400">{weakCount}</p>
                <p className="text-[11px] text-slate-500">Weak (30–50%)</p>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
            <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-[12.5px] text-blue-700 dark:text-blue-300 leading-relaxed">
              Weak topics are computed from <strong>all your tests combined</strong>. Re-attempt tests after studying — once your overall accuracy rises above 60%, the topic is automatically cleared.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                    active
                      ? 'bg-white dark:bg-[#0e0e15] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-white/[0.08]'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={14} className={active ? (tab.id === 'diagnostic' ? 'text-indigo-500' : tab.id === 'tests' ? 'text-violet-500' : 'text-teal-500') : ''} />
                  {tab.label}
                  <span className={`text-[10.5px] px-1.5 py-0.5 rounded-full font-bold ${
                    active
                      ? tab.id === 'diagnostic'
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                        : tab.id === 'tests'
                          ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                          : 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300'
                      : 'bg-slate-200 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {activeTab === 'diagnostic' && (
            <DiagnosticTab diagBreakdown={diagBreakdown} />
          )}
          {activeTab === 'tests' && (
            <TestsTab testBreakdown={testBreakdown} weakTopicsMap={weakTopicsMap} />
          )}
          {activeTab === 'practice' && (
            <PracticeTab practiceBreakdown={practiceBreakdown} weakTopicsMap={weakTopicsMap} />
          )}
        </>
      )}
    </div>
  );
}

