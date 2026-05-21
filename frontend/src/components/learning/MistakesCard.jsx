import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, ArrowRight, Trophy, Loader2 } from 'lucide-react';
import api from '../../services/api';

/**
 * Compact mistake-queue card for the student Dashboard.
 * Hidden entirely when the queue is empty AND no recoveries yet — keeps the
 * dashboard tidy for fresh accounts.
 */
export default function MistakesCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/mistakes')
      .then(r => setData(r.data?.summary || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0e0e15] p-5 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-slate-400" />
      </div>
    );
  }

  // Hide the card entirely if there's nothing here yet.
  if (!data || data.total === 0) return null;

  const pending = data.pending_count || 0;
  const mastered = data.mastered_count || 0;
  const total = data.total || 0;
  const rate = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const cleared = pending === 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0e0e15] p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        cleared
          ? 'bg-emerald-50 dark:bg-emerald-500/10'
          : 'bg-rose-50 dark:bg-rose-500/10'
      }`}>
        {cleared
          ? <Trophy size={18} className="text-emerald-600 dark:text-emerald-400" />
          : <RotateCcw size={18} className="text-rose-600 dark:text-rose-400" />
        }
      </div>
      <div className="flex-1 min-w-0">
        {cleared ? (
          <>
            <p className="text-[14px] font-semibold text-slate-900 dark:text-white">No mistakes pending</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              You've mastered all {mastered} mistakes. Keep practising to push further.
            </p>
          </>
        ) : (
          <>
            <p className="text-[14px] font-semibold text-slate-900 dark:text-white">
              Review {pending} {pending === 1 ? 'mistake' : 'mistakes'}
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {mastered} mastered · {rate}% recovery rate
            </p>
          </>
        )}
      </div>
      <Link to="/student/mistakes"
        className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-colors ${
          cleared
            ? 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
            : 'bg-violet-600 hover:bg-violet-700 text-white'
        }`}>
        {cleared ? 'View' : 'Start replay'} <ArrowRight size={13} />
      </Link>
    </div>
  );
}
