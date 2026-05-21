import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Clock, Target, Sparkles, Loader2 } from 'lucide-react';
import api from '../../services/api';

/**
 * Today's focus — one specific topic to practice right now.
 * Mounted at the top of the student Dashboard. Driven by /student/focus-today.
 */
export default function DailyFocusCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/focus-today')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0e0e15] p-5 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-slate-400" />
        <span className="text-[13px] text-slate-500 dark:text-slate-400">Finding today's focus…</span>
      </div>
    );
  }

  // Empty/clear state — student has mastered everything in their profile.
  if (!data?.focus) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0e0e15] p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Nothing urgent today</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            {data?.message || "You're on top of every topic you've practiced. Take on a new one in Practice."}
          </p>
        </div>
        <Link to="/student/practice"
          className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300">
          Open Practice <ArrowRight size={11} />
        </Link>
      </div>
    );
  }

  const f = data.focus;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white p-5 sm:p-6 shadow-lg shadow-violet-900/10">
      {/* Subtle dot overlay */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Target size={17} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-white/70">Today's focus</p>
            <h3 className="text-[18px] sm:text-[20px] font-semibold tracking-tight truncate">{f.topic_name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/80">
              {f.subject_name && <span>{f.subject_name}</span>}
              {f.subject_name && (
                <span className="w-1 h-1 rounded-full bg-white/40" />
              )}
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {f.estimated_minutes || 25} min
              </span>
              {f.accuracy_percent > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span>{f.accuracy_percent}% mastered</span>
                </>
              )}
            </div>
            <p className="mt-2 text-[13px] text-white/90 leading-relaxed">{f.explanation}</p>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col gap-2 sm:items-stretch flex-shrink-0">
          <Link
            to={f.cta?.url || '/student/practice'}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white text-violet-700 text-[13px] font-bold hover:bg-violet-50 transition-colors whitespace-nowrap">
            <Zap size={13} /> {f.cta?.label || 'Practice now'}
          </Link>
          <Link
            to="/student/plan"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-white/30 text-white text-[12px] font-semibold hover:bg-white/10 transition-colors whitespace-nowrap">
            Open plan
          </Link>
        </div>
      </div>
    </div>
  );
}
