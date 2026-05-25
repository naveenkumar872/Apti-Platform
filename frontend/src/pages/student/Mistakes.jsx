import { useEffect, useState, useRef } from 'react';
import {
  RotateCcw, ArrowRight, ArrowLeft, CheckCircle2, XCircle,
  Loader2, Trophy, BookOpen, Sparkles, AlertTriangle, Layers
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CARD = 'bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl';

/* Render AI explanation with step-by-step formatting */
function ExplanationBlock({ text }) {
  if (!text) return null;

  // Strip leading label like "Step-by-step:" or "Solution:"
  const cleaned = text.replace(/^(step[\s-]*by[\s-]*step|solution|explanation)\s*[:\-–]\s*/i, '').trim();

  // Try to split on explicit "Step N:" markers
  const stepPattern = /(?:^|\s)(step\s*\d+\s*[:\-–])/gi;
  const hasSteps = stepPattern.test(cleaned);

  if (hasSteps) {
    const parts = cleaned.split(/(?=step\s*\d+\s*[:\-–])/i).filter(Boolean);
    return (
      <div className="mt-2 space-y-2">
        {parts.map((part, i) => {
          const match = part.match(/^(step\s*\d+\s*[:\-–])\s*/i);
          if (match) {
            return (
              <div key={i} className="flex gap-2 text-[12.5px]">
                <span className="font-bold text-violet-600 dark:text-violet-400 flex-shrink-0 pt-0.5">{match[1].replace(/\s+/g, ' ')}</span>
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{part.slice(match[0].length)}</span>
              </div>
            );
          }
          return <p key={i} className="text-[12.5px] text-slate-700 dark:text-slate-300 leading-relaxed">{part.trim()}</p>;
        })}
      </div>
    );
  }

  // Split into sentences, group calculation lines separately
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length <= 2) {
    return <p className="mt-2 text-[12.5px] text-slate-700 dark:text-slate-300 leading-relaxed">{cleaned}</p>;
  }

  return (
    <ul className="mt-2 space-y-1.5">
      {sentences.map((s, i) => (
        <li key={i} className="flex gap-2 text-[12.5px]">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{s.trim()}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────────
   Replay session — answer wrong questions one at a time
   ───────────────────────────────────────────────── */
function ReplaySession({ topicId, onExit }) {
  const [loading, setLoading]     = useState(true);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx]             = useState(0);
  const [answer, setAnswer]       = useState(null);     // student's current selection
  const [feedback, setFeedback]   = useState(null);     // server response { is_correct, correct_answer, explanation }
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults]     = useState([]);       // accumulated outcomes for the wrap-up
  const qStartRef = useRef(Date.now());

  useEffect(() => {
    setLoading(true);
    api.get('/student/mistakes/replay', { params: topicId ? { topic_id: topicId } : {} })
      .then(r => setQuestions(r.data.questions || []))
      .catch(() => toast.error('Failed to load replay'))
      .finally(() => setLoading(false));
  }, [topicId]);

  if (loading) {
    return (
      <div className={CARD + ' p-10 max-w-2xl mx-auto text-center'}>
        <Loader2 className="animate-spin text-slate-400 mx-auto mb-3" />
        <p className="text-[13px] text-slate-500 dark:text-slate-400">Loading your mistakes…</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={CARD + ' p-10 max-w-2xl mx-auto text-center'}>
        <Trophy size={26} className="text-emerald-500 mx-auto mb-3" />
        <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Nothing to replay right now</p>
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 mb-5">You've cleared every mistake. Practice more to fill the queue.</p>
        <button onClick={onExit}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold transition-colors">
          Back to mistakes
        </button>
      </div>
    );
  }

  /* Session-complete wrap-up */
  if (idx >= questions.length) {
    const mastered = results.filter(r => r.is_correct).length;
    const stillWrong = results.length - mastered;
    return (
      <div className={CARD + ' p-8 max-w-2xl mx-auto text-center'}>
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
          <Sparkles size={22} className="text-emerald-500" />
        </div>
        <p className="text-[15px] font-semibold text-slate-900 dark:text-white">Replay session done</p>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
          You mastered <span className="font-bold text-emerald-600 dark:text-emerald-400">{mastered}</span> of {results.length} questions.
          {stillWrong > 0 && <> The remaining {stillWrong} stayed in your queue for next time.</>}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { setIdx(0); setResults([]); setAnswer(null); setFeedback(null); window.location.reload(); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold transition-colors">
            <RotateCcw size={13} /> Replay another batch
          </button>
          <button onClick={onExit}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
            Back
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const optionsArr = Array.isArray(q.options)
    ? q.options.map((o, i) => typeof o === 'string' ? { id: String.fromCharCode(65 + i), text: o } : o)
    : (q.options && typeof q.options === 'object'
        ? Object.entries(q.options).map(([id, text]) => ({ id, text }))
        : []);

  const submit = async () => {
    if (!answer || submitting) return;
    const elapsed = Math.max(1, Math.floor((Date.now() - qStartRef.current) / 1000));
    setSubmitting(true);
    try {
      const r = await api.post('/student/mistakes/answer', {
        entry_id: q.entry_id,
        selected_answer: answer,
        time_taken_seconds: elapsed,
      });
      setFeedback(r.data);
      setResults(prev => [...prev, { entry_id: q.entry_id, is_correct: r.data.is_correct }]);
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    setIdx(i => i + 1);
    setAnswer(null);
    setFeedback(null);
    qStartRef.current = Date.now();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress strip */}
      <div className={CARD + ' p-4 flex items-center gap-4'}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              Replay {idx + 1} of {questions.length}
            </span>
            <span className="text-[12px] text-slate-500 dark:text-slate-400">
              {results.filter(r => r.is_correct).length} mastered
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
            <div className="h-full bg-violet-500 transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className={CARD + ' p-6 sm:p-7'}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md">
            {q.subject_name || 'Aptitude'}
          </span>
          {q.topic_name && (
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{q.topic_name}</span>
          )}
          {q.replay_attempts > 0 && (
            <span className="ml-auto text-[10px] font-medium text-slate-500 dark:text-slate-400">
              {q.replay_attempts} previous {q.replay_attempts === 1 ? 'attempt' : 'attempts'}
            </span>
          )}
        </div>

        <p className="text-[15px] sm:text-[16px] text-slate-900 dark:text-white leading-relaxed mb-5 whitespace-pre-line">
          {q.question_text}
        </p>

        <div className="space-y-2">
          {optionsArr.map((o, i) => {
            const id = o.id || String.fromCharCode(65 + i);
            const text = typeof o === 'string' ? o : o.text;
            const isSel = answer === id;
            const isAnswered = !!feedback;
            const isRight = feedback && feedback.correct_answer === id;
            const isWrong = feedback && answer === id && !feedback.is_correct;

            let cls = 'border-slate-200 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.02]';
            if (isAnswered) {
              if (isRight) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
              else if (isWrong) cls = 'border-rose-500 bg-rose-50 dark:bg-rose-500/10';
              else cls = 'border-slate-200 dark:border-white/[0.06] opacity-50';
            } else if (isSel) {
              cls = 'border-violet-500 bg-violet-50 dark:bg-violet-500/10';
            }

            return (
              <button key={id}
                disabled={isAnswered}
                onClick={() => !isAnswered && setAnswer(id)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all disabled:cursor-default ${cls}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                  isAnswered && isRight ? 'bg-emerald-600 text-white' :
                  isAnswered && isWrong ? 'bg-rose-600 text-white' :
                  isSel                  ? 'bg-violet-600 text-white' :
                                           'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                }`}>
                  {id}
                </span>
                <span className="flex-1 text-[14px] text-slate-800 dark:text-slate-200 pt-0.5">{text}</span>
                {isAnswered && isRight && <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />}
                {isAnswered && isWrong && <XCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback / explanation */}
        {feedback && (
          <div className={`mt-5 p-4 rounded-xl border ${
            feedback.is_correct
              ? 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-500/[0.06]'
              : 'border-rose-200 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-500/[0.06]'
          }`}>
            <p className={`text-[13px] font-bold ${feedback.is_correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {feedback.is_correct ? '✓ Mastered — removed from your queue' : `✗ Still tricky — correct answer is ${feedback.correct_answer}`}
            </p>
            {feedback.explanation && (
              <ExplanationBlock text={feedback.explanation} />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={onExit}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
          <ArrowLeft size={13} /> Exit
        </button>
        {!feedback ? (
          <button onClick={submit} disabled={!answer || submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50">
            {submitting ? <><Loader2 size={13} className="animate-spin" /> Checking</> : <>Submit answer</>}
          </button>
        ) : (
          <button onClick={next}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors">
            {idx + 1 < questions.length ? <>Next <ArrowRight size={13} /></> : <>Finish <CheckCircle2 size={13} /></>}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Mistakes list — main view
   ───────────────────────────────────────────────── */
export default function Mistakes() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replayMode, setReplayMode] = useState(null); // { topicId? } | null

  const load = () => {
    setLoading(true);
    api.get('/student/mistakes')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load mistakes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const exitReplay = () => {
    setReplayMode(null);
    load(); // refresh counts
  };

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <p className="text-white/70 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Learning loop</p>
          <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Review mistakes</h1>
          <p className="text-white/80 text-sm mt-1.5">Every wrong answer is collected here so you can master it.</p>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8">
        {replayMode ? (
          <ReplaySession topicId={replayMode.topicId} onExit={exitReplay} />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        ) : (
          <MistakesOverview data={data} onStartReplay={(topicId) => setReplayMode({ topicId })} />
        )}
      </div>
    </div>
  );
}

function MistakesOverview({ data, onStartReplay }) {
  const summary = data?.summary || {};
  const byTopic = data?.by_topic || [];
  const pending = data?.pending || [];
  const totalRate = summary.total > 0
    ? Math.round((summary.mastered_count / summary.total) * 100)
    : 0;

  if (summary.total === 0) {
    return (
      <div className={CARD + ' p-10 max-w-2xl mx-auto text-center'}>
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
          <Trophy size={22} className="text-emerald-500" />
        </div>
        <p className="text-[15px] font-semibold text-slate-900 dark:text-white">No mistakes yet</p>
        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          As you practice and take tests, anything you get wrong shows up here so you can re-attempt and master it.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top stats + CTA */}
      <div className={CARD + ' p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4'}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
            <RotateCcw size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">
              {summary.pending_count} question{summary.pending_count === 1 ? '' : 's'} to review
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              {summary.mastered_count} mastered out of {summary.total} total mistakes  · {totalRate}% recovery rate
            </p>
          </div>
        </div>
        <button onClick={() => onStartReplay(null)} disabled={summary.pending_count === 0}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors disabled:opacity-50">
          <RotateCcw size={13} /> Start replay
        </button>
      </div>

      {/* Recovery progress bar */}
      <div className={CARD + ' p-5 sm:p-6'}>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">Recovery progress</p>
          <span className="text-[12px] text-slate-500 dark:text-slate-400">{summary.mastered_count}/{summary.total}</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totalRate}%` }} />
        </div>
      </div>

      {/* By topic */}
      {byTopic.length > 0 && (
        <div className={CARD + ' p-5 sm:p-6'}>
          <div className="flex items-center gap-2 mb-4">
            <Layers size={14} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">By topic</h2>
          </div>
          <div className="space-y-2">
            {byTopic.map(t => (
              <button key={t.topic_id || 'untagged'}
                onClick={() => t.topic_id && onStartReplay(t.topic_id)}
                disabled={!t.topic_id}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors text-left disabled:cursor-default disabled:hover:bg-transparent">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-1 h-9 rounded-full bg-rose-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{t.topic_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.subject_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[12.5px] font-bold text-rose-600 dark:text-rose-400">{t.pending}</span>
                  {t.topic_id && <ArrowRight size={13} className="text-slate-300 dark:text-slate-600" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent pending questions list */}
      {pending.length > 0 && (
        <div className={CARD + ' p-5 sm:p-6'}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-rose-500" />
            <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">In your queue</h2>
            <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">{pending.length} pending</span>
          </div>
          <div className="space-y-2">
            {pending.slice(0, 8).map(p => (
              <div key={p.entry_id} className="p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                      {p.question_text}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                      {p.subject_name && <span>{p.subject_name}</span>}
                      {p.topic_name && <span>· {p.topic_name}</span>}
                      <span>· From {p.source || '—'}</span>
                      {p.replay_attempts > 0 && <span>· {p.replay_attempts} previous {p.replay_attempts === 1 ? 'attempt' : 'attempts'}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {pending.length > 8 && (
              <p className="text-[12px] text-slate-500 dark:text-slate-400 text-center pt-1">
                +{pending.length - 8} more — start a replay to work through them.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
