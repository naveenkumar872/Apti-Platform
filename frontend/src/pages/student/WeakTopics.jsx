import { useEffect, useState } from 'react';
import {
  TrendingDown, Loader2, Trophy, AlertTriangle, ChevronDown, ChevronRight,
  BarChart2, BookOpen, Target, Calendar, CheckCircle2, Info
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

/* One row per weak topic with expandable per-test breakdown */
function TopicRow({ topic, breakdown }) {
  const [open, setOpen] = useState(false);
  const acc = Number(topic.accuracy_percent) || 0;
  const c = severityColor(acc);
  const rows = breakdown.filter(b => b.topic_id === topic.topic_id);

  return (
    <div className={CARD + ' overflow-hidden'}>
      {/* Summary row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        {/* Severity icon */}
        <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <TrendingDown size={16} className={c.text} />
        </div>

        {/* Topic name + subject */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">{topic.topic_name}</p>
          <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5">{topic.subject_name}</p>
        </div>

        {/* Accuracy pill */}
        <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full ${c.badge} flex-shrink-0`}>
          {c.label} · {acc}%
        </span>

        {/* Attempts */}
        <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
          <p className="text-[12px] font-medium text-slate-700 dark:text-slate-300">
            {Number(topic.correct_count)}/{Number(topic.total_attempts)} correct
          </p>
          <p className="text-[10.5px] text-slate-400 mt-0.5">Last: {fmt(topic.last_attempted)}</p>
        </div>

        {/* Expand icon */}
        {rows.length > 0 && (
          open ? <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />
               : <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />
        )}
      </button>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-white/[0.04] mx-5 mb-1 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${acc}%` }} />
      </div>

      {/* Per-test breakdown */}
      {open && rows.length > 0 && (
        <div className="px-5 pb-4 pt-3 border-t border-slate-100 dark:border-white/[0.04]">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2.5">Test breakdown</p>
          <div className="space-y-2">
            {rows.map(r => {
              const rowAcc = Number(r.accuracy_in_test) || 0;
              const rc = severityColor(rowAcc < 60 ? rowAcc : 60); // anything ≥60 shown neutral
              const isPoor = rowAcc < 60;
              return (
                <div key={r.attempt_id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-white/[0.03]"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPoor ? rc.bar : 'bg-emerald-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200 truncate">{r.test_title}</p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">{fmt(r.submitted_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[12px] font-bold ${isPoor ? rc.text : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {rowAcc}%
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {Number(r.correct_questions)}/{Number(r.total_questions)} correct
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Group topics by subject */
function SubjectGroup({ subjectName, topics, breakdown }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={13} className="text-slate-400" />
        <h3 className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {subjectName}
        </h3>
        <span className="ml-1 text-[10.5px] bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
          {topics.length}
        </span>
      </div>
      <div className="space-y-2">
        {topics.map(t => (
          <TopicRow key={t.topic_id} topic={t} breakdown={breakdown} />
        ))}
      </div>
    </div>
  );
}

export default function WeakTopics() {
  const [loading, setLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/student/weak-topics')
      .then(r => {
        setWeakTopics(r.data.weak_topics || []);
        setBreakdown(r.data.test_breakdown || []);
      })
      .catch(() => setError('Failed to load weak topics. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  /* Group by subject */
  const bySubject = weakTopics.reduce((acc, t) => {
    if (!acc[t.subject_name]) acc[t.subject_name] = [];
    acc[t.subject_name].push(t);
    return acc;
  }, {});

  const criticalCount = weakTopics.filter(t => Number(t.accuracy_percent) < 30).length;
  const weakCount = weakTopics.filter(t => Number(t.accuracy_percent) >= 30 && Number(t.accuracy_percent) < 50).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white">Weak Topics</h1>
        </div>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 ml-10.5">
          Topics where your cumulative accuracy is below 60% across all tests. Improve your score to clear them.
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

      {!loading && !error && weakTopics.length === 0 && (
        <div className={CARD + ' p-12 flex flex-col items-center gap-3 text-center'}>
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto">
            <Trophy size={24} className="text-emerald-500" />
          </div>
          <p className="text-[15px] font-semibold text-slate-900 dark:text-white">No weak topics right now!</p>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm">
            You're above 60% accuracy on every topic you've attempted. Keep taking tests to track your progress.
          </p>
        </div>
      )}

      {!loading && !error && weakTopics.length > 0 && (
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
              Weak topics are computed from <strong>all your tests combined</strong>, not just the latest one.
              Re-attempt tests after studying — if your overall accuracy for a topic rises above 60%, it will be automatically removed from this list.
            </p>
          </div>

          {/* Topics grouped by subject */}
          <div className="space-y-6">
            {Object.entries(bySubject).map(([subject, topics]) => (
              <SubjectGroup
                key={subject}
                subjectName={subject}
                topics={topics}
                breakdown={breakdown}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
