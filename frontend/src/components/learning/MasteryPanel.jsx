import { useEffect, useState } from 'react';
import { Target, Trophy, Loader2, TrendingUp, Sparkles } from 'lucide-react';
import api from '../../services/api';

/**
 * Per-topic mastery panel. Re-usable:
 *   <MasteryPanel />                            // current student via /student/mastery
 *   <MasteryPanel adminStudentId="abc..." />    // admin viewing a student
 *
 * Set `compact` to hide the subject roll-up and only show the top 5 topics.
 */
export default function MasteryPanel({ adminStudentId, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    const url = adminStudentId
      ? `/admin/students/${adminStudentId}/mastery`
      : `/student/mastery`;
    api.get(url)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminStudentId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0e0e15] p-5 flex items-center justify-center">
        <Loader2 size={16} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const topics = data?.topics || [];

  if (topics.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0e0e15] p-6 text-center">
        <Target size={22} className="text-slate-400 mx-auto mb-2" />
        <p className="text-[13.5px] font-semibold text-slate-700 dark:text-slate-200">Mastery will appear here</p>
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
          Take practice or tests on a topic and your mastery bar builds up automatically.
        </p>
      </div>
    );
  }

  const visible = showAll ? topics : topics.slice(0, compact ? 5 : 8);
  const overall = data.overall_mastery ?? 0;
  const target = data.target_mastery ?? 85;
  const summary = data.summary || {};

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0e0e15] overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <Trophy size={17} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">Topic mastery</p>
            <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Get every topic to {target}%+ to be placement-ready</p>
          </div>
        </div>

        {/* Overall mastery */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10.5px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">Overall</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{overall}%</p>
          </div>
          <div className="w-20 h-20 relative flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-slate-100 dark:text-white/[0.06]" strokeWidth="3.2" />
              <circle cx="18" cy="18" r="15" fill="none"
                stroke={overall >= 70 ? '#10b981' : overall >= 40 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="3.2"
                strokeDasharray={`${overall * 0.9424} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">/ {target}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary tiers */}
      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/[0.06] border-b border-slate-200 dark:border-white/[0.06]">
        {[
          { label: 'Mastered', value: summary.mastered_count, dot: 'bg-emerald-500',  text: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Building', value: summary.building_count, dot: 'bg-amber-500',    text: 'text-amber-600 dark:text-amber-400' },
          { label: 'Weak',     value: summary.weak_count,     dot: 'bg-rose-500',     text: 'text-rose-600 dark:text-rose-400' },
        ].map(t => (
          <div key={t.label} className="px-4 py-3 flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${t.dot} flex-shrink-0`} />
            <div className="min-w-0">
              <p className={`text-[15px] font-semibold ${t.text}`}>{t.value ?? 0}</p>
              <p className="text-[10.5px] uppercase tracking-wider font-medium text-slate-500 dark:text-slate-400">{t.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Topic bars */}
      <div className="p-5 sm:p-6 space-y-3.5">
        {visible.map(t => {
          const tone = t.tier === 'mastered'
            ? { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', chip: 'bg-emerald-50 dark:bg-emerald-500/10' }
            : t.tier === 'building'
            ? { bar: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',   chip: 'bg-amber-50 dark:bg-amber-500/10' }
            : { bar: 'bg-rose-500',    text: 'text-rose-600 dark:text-rose-400',     chip: 'bg-rose-50 dark:bg-rose-500/10' };
          return (
            <div key={t.topic_id}>
              <div className="flex items-center justify-between mb-1.5 gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{t.topic_name}</p>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                    {t.subject_name} · {t.total_attempts} attempt{t.total_attempts === 1 ? '' : 's'}
                    {t.days_since != null && t.days_since !== 0 && ` · ${t.days_since}d ago`}
                    {t.days_since === 0 && ' · today'}
                  </p>
                </div>
                <span className={`text-[12.5px] font-bold ${tone.text} flex-shrink-0`}>{t.accuracy_percent}%</span>
              </div>
              <div className="relative w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                <div className={`absolute inset-y-0 left-0 ${tone.bar} rounded-full transition-all duration-500`} style={{ width: `${t.accuracy_percent}%` }} />
                {/* Target marker */}
                <div className="absolute top-0 bottom-0 w-px bg-slate-300 dark:bg-white/20" style={{ left: `${target}%` }} title={`Target ${target}%`} />
              </div>
            </div>
          );
        })}

        {topics.length > visible.length && (
          <button onClick={() => setShowAll(true)}
            className="w-full text-[12px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 py-2 -mb-1 transition-colors">
            Show all {topics.length} topics
          </button>
        )}
      </div>

      {/* Quick wins */}
      {data.next_wins && data.next_wins.length > 0 && (
        <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2.5">
            <Sparkles size={13} className="text-violet-600 dark:text-violet-400" />
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Closest wins</p>
          </div>
          <div className="space-y-2">
            {data.next_wins.map(t => (
              <div key={t.topic_id} className="flex items-center gap-2.5">
                <TrendingUp size={12} className="text-violet-500" />
                <span className="text-[12.5px] text-slate-700 dark:text-slate-300 flex-1 min-w-0 truncate">
                  <span className="font-semibold text-slate-900 dark:text-white">{t.topic_name}</span>
                  <span className="text-slate-500 dark:text-slate-400"> — needs +{target - t.accuracy_percent}% to master</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
