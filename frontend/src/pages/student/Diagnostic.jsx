import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Target, ClipboardList, Clock, ArrowLeft, ArrowRight, CheckCircle2,
  Loader2, BarChart3, Trophy, AlertTriangle, Zap, Award,
  Sparkles, FileText, RotateCcw, Maximize2, ShieldAlert
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';

const CARD = 'bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl';

/* ─────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────── */

function fmtTime(secs) {
  const s = Math.max(0, Math.round(secs || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function tone(pct) {
  if (pct >= 75) return { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Strong' };
  if (pct >= 50) return { dot: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10',   label: 'On track' };
  return            { dot: 'bg-rose-500',    text: 'text-rose-600 dark:text-rose-400',       bg: 'bg-rose-50 dark:bg-rose-500/10',     label: 'Needs work' };
}

/* ─────────────────────────────────────────────────
   Intro screen — before the student starts
   ───────────────────────────────────────────────── */
function Intro({ onStart, starting }) {
  return (
    <div className={CARD + ' p-8 max-w-3xl mx-auto'}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <Target size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Aptitude Diagnostic</h2>
          <p className="text-[13px] text-slate-500 dark:text-slate-400">Baseline assessment across all 4 sections.</p>
        </div>
      </div>

      <p className="text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
        This <span className="font-semibold">one-time test</span> tells us your starting strengths and weak areas
        across <span className="font-semibold">Quantitative Aptitude, Logical Reasoning, Verbal Ability,</span> and
        <span className="font-semibold"> Data Interpretation</span>. Your entire personalised study plan is built from this result.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Questions', value: '~30', Icon: ClipboardList, tint: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
          { label: 'Sections',  value: '4',  Icon: BarChart3,     tint: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Time',      value: '~30 min', Icon: Clock,    tint: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Attempts',  value: 'One',Icon: Trophy,        tint: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 dark:border-white/[0.06] p-3">
            <div className={`w-7 h-7 rounded-md ${s.bg} flex items-center justify-center mb-2`}>
              <s.Icon size={14} className={s.tint} />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="text-[15px] font-semibold text-slate-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-4 mb-6">
        <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Before you begin</p>
        <ul className="space-y-1.5 text-[13px] text-slate-700 dark:text-slate-300">
          <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Find a quiet place. You'll be locked into the test once started.</li>
          <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> No back-and-forth across questions is required — work top to bottom.</li>
          <li className="flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" /> Don't worry about a low score — that's the point of a diagnostic.</li>
        </ul>
      </div>

      <button onClick={onStart} disabled={starting}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[14px] font-semibold transition-colors disabled:opacity-60">
        {starting
          ? <><Loader2 size={14} className="animate-spin" /> Building your test… (~15s)</>
          : <>Start diagnostic <ArrowRight size={14} /></>}
      </button>
      {starting && (
        <p className="mt-3 text-[11.5px] text-slate-500 dark:text-slate-400">
          Generating fresh questions across all four sections — this only happens the first time.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Test taking screen — proctored, fullscreen overlay
   ─────────────────────────────────────────────────
   Renders as a fixed inset-0 overlay (covers the sidebar + header),
   requests browser fullscreen on mount, blocks copy/paste/right-click,
   and counts tab-switch / fullscreen-exit violations.
   ───────────────────────────────────────────────── */
function TestRunner({ attemptId, questions, onSubmitted }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState(null);          // { title, message, action? }
  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  const startRef = useRef(Date.now());
  const qStartRef = useRef(Date.now());
  const submittingRef = useRef(false);                   // avoid spurious warnings during submit unmount

  /* ── Timer ── */
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Proctoring guards ── */
  useEffect(() => {
    // Enter fullscreen — this works because TestRunner mounts directly
    // following the user's "Start diagnostic" click (user-gesture context).
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        setNeedsFullscreen(true);
      }
    };
    enterFullscreen();

    const block = (e) => { e.preventDefault(); e.stopPropagation(); return false; };

    const onVisibility = () => {
      if (document.hidden && !submittingRef.current) {
        setViolations(v => v + 1);
        setWarning({
          title: 'Tab switch detected',
          message: 'Please stay on the diagnostic tab. Every switch is logged on your attempt.',
        });
      }
    };

    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !submittingRef.current) {
        setNeedsFullscreen(true);
        setViolations(v => v + 1);
      }
    };

    const onKeyDown = (e) => {
      const k = (e.key || '').toLowerCase();
      // Block copy/cut/paste/select-all/print/save/view-source
      const blockedCtrl = ['c', 'v', 'x', 'a', 'p', 's', 'u'];
      if ((e.ctrlKey || e.metaKey) && blockedCtrl.includes(k)) return block(e);
      // Block dev tools shortcuts
      if (k === 'f12') return block(e);
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k)) return block(e);
    };

    const onBeforeUnload = (e) => {
      if (submittingRef.current) return;
      e.preventDefault();
      e.returnValue = 'Your diagnostic is in progress. Leave anyway?';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('dragstart', block);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const reEnterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setNeedsFullscreen(false);
    } catch {
      // browser refused — leave the overlay up so the test stays on top of the chrome
    }
  };

  const q = questions[idx];
  if (!q) return null;
  const optionsArr = Array.isArray(q.options)
    ? q.options
    : (q.options && typeof q.options === 'object' ? Object.entries(q.options).map(([id, text]) => ({ id, text })) : []);
  const selected = answers[q.question_id];
  const answeredCount = Object.keys(answers).length;
  const isLast = idx === questions.length - 1;

  const choose = async (optId) => {
    if (selected === optId) return;
    setAnswers(prev => ({ ...prev, [q.question_id]: optId }));
    const elapsedQ = Math.max(1, Math.floor((Date.now() - qStartRef.current) / 1000));
    try {
      await api.post('/student/diagnostic/answer', {
        attempt_id: attemptId,
        question_id: q.question_id,
        selected_answer: optId,
        time_taken_seconds: elapsedQ,
      });
    } catch { /* non-fatal */ }
  };

  const go = (delta) => {
    const next = idx + delta;
    if (next < 0 || next >= questions.length) return;
    qStartRef.current = Date.now();
    setIdx(next);
  };

  const submit = async () => {
    if (answeredCount < questions.length) {
      setWarning({
        title: 'Submit early?',
        message: `You've answered ${answeredCount} of ${questions.length} questions. Submit anyway?`,
        action: { label: 'Submit now', run: doSubmit },
      });
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    submittingRef.current = true;
    setSubmitting(true);
    setWarning(null);
    try {
      await api.post('/student/diagnostic/submit', { attempt_id: attemptId, violations });
      onSubmitted();
    } catch (err) {
      submittingRef.current = false;
      toast.error(err.response?.data?.error || 'Submission failed');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-slate-50 dark:bg-[#09090d] overflow-hidden"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Proctor status bar */}
      <div className="flex-shrink-0 bg-white dark:bg-[#0e0e15] border-b border-slate-200 dark:border-white/[0.06] px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Target size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Diagnostic · Proctored</p>
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
              Question {idx + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-md">
            <Clock size={12} /> {fmtTime(elapsed)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-md">
            {answeredCount}/{questions.length}
          </span>
          {violations > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">
              <ShieldAlert size={11} /> {violations}
            </span>
          )}
        </div>
      </div>

      {/* Progress strip */}
      <div className="flex-shrink-0 h-1 bg-slate-100 dark:bg-white/[0.04]">
        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Question card */}
          <div className={CARD + ' p-6 sm:p-8 mb-5'}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md">
                {q.subject_name || 'Aptitude'}
              </span>
              {q.topic_name && (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{q.topic_name}</span>
              )}
            </div>

            <p className="text-[15px] sm:text-[16px] text-slate-900 dark:text-white leading-relaxed mb-6 whitespace-pre-line">
              {q.question_text}
            </p>

            <div className="space-y-2">
              {optionsArr.map((o, i) => {
                const id = o.id || String.fromCharCode(65 + i);
                const text = typeof o === 'string' ? o : o.text;
                const isSel = selected === id;
                return (
                  <button key={id} onClick={() => choose(id)}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      isSel
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                        : 'border-slate-200 dark:border-white/[0.06] hover:border-violet-300 dark:hover:border-violet-500/40 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                    }`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                      isSel ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                    }`}>
                      {id}
                    </span>
                    <span className="flex-1 text-[14px] text-slate-800 dark:text-slate-200 pt-0.5">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => go(-1)} disabled={idx === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ArrowLeft size={13} /> Previous
            </button>

            {isLast ? (
              <button onClick={submit} disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
                {submitting ? <><Loader2 size={13} className="animate-spin" /> Submitting</> : <>Submit diagnostic <CheckCircle2 size={13} /></>}
              </button>
            ) : (
              <button onClick={() => go(1)} disabled={!selected}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold transition-colors disabled:opacity-50">
                Next <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen-required nudge (covers everything until they accept) */}
      {needsFullscreen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6">
          <div className="bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Maximize2 size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Return to fullscreen</h3>
            </div>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
              The diagnostic must be taken in fullscreen mode. Click below to re-enter fullscreen and continue.
            </p>
            <button onClick={reEnterFullscreen}
              className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13.5px] font-bold transition-colors">
              <Maximize2 size={13} /> Enter fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Warning modal (tab switch + early submit confirmation) */}
      {warning && !needsFullscreen && (
        <div className="absolute inset-0 z-[65] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-6">
          <div className="bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{warning.title}</h3>
            </div>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">{warning.message}</p>
            <div className="mt-5 flex gap-2">
              {warning.action && (
                <button onClick={() => warning.action.run()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold transition-colors">
                  {warning.action.label}
                </button>
              )}
              <button onClick={() => setWarning(null)}
                className={`${warning.action ? 'flex-1' : 'w-full'} inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg ${warning.action ? 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.03]' : 'bg-violet-600 hover:bg-violet-700 text-white'} text-[13px] font-bold transition-colors`}>
                {warning.action ? 'Keep working' : 'Continue test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Report screen
   ───────────────────────────────────────────────── */
export function DiagnosticReport({ data, isAdmin = false }) {
  if (!data) return null;
  const acc = Math.round(Number(data.accuracy_percent) || 0);
  const accTone = tone(acc);

  const sections = data.sections || [];
  const radarData = sections.map(s => ({
    subject: (s.subject_name || '').split(' ').slice(0, 2).join(' '),
    score: s.accuracy_percent || 0,
  }));

  const focus = data.focus_topics || [];
  const strong = data.strong_topics || [];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Headline */}
      <div className={CARD + ' p-6 sm:p-8'}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
          <div className="flex items-center gap-4">
            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center ${accTone.bg}`}>
              <span className={`text-3xl font-semibold tracking-tight ${accTone.text}`}>{acc}%</span>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Overall accuracy</p>
              <p className={`text-[14px] font-semibold ${accTone.text}`}>{accTone.label}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
                {data.correct_count} of {data.total_questions} correct · {fmtTime(data.time_taken_seconds)} total
              </p>
            </div>
          </div>
          <div className="flex-1 min-w-0 sm:border-l sm:border-slate-200 sm:dark:border-white/[0.06] sm:pl-8 sm:py-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">What this means</p>
            <p className="text-[14px] text-slate-700 dark:text-slate-300 leading-relaxed">{data.recommendation?.headline}</p>
            {(data.violations_count || 0) > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">
                <AlertTriangle size={11} /> {data.violations_count} proctoring flag{data.violations_count === 1 ? '' : 's'} during the test
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section breakdown + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <div className={CARD + ' p-5 sm:p-6'}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} className="text-violet-600 dark:text-violet-400" />
            <h3 className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">Section breakdown</h3>
          </div>
          <div className="space-y-4">
            {sections.length === 0 && (
              <p className="text-[13px] text-slate-500 dark:text-slate-400">No section data available.</p>
            )}
            {sections.map(s => {
              const pct = s.accuracy_percent || 0;
              const t = tone(pct);
              return (
                <div key={s.subject_id || s.subject_name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full ${t.dot} flex-shrink-0`} />
                      <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{s.subject_name}</p>
                    </div>
                    <span className={`text-[12.5px] font-bold ${t.text} flex-shrink-0`}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div className={`h-full ${t.dot} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {s.correct} / {s.total} correct
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={CARD + ' p-5 sm:p-6'}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-indigo-500" />
            <h3 className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">Skill radar</h3>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgb(148 163 184 / 0.22)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.18} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">No radar data.</p>
          )}
        </div>
      </div>

      {/* Focus + Strong */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className={CARD + ' p-5 sm:p-6'}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-rose-500" />
            <h3 className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">Focus on these topics</h3>
          </div>
          {focus.length === 0 ? (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">No weak topics — keep at it!</p>
          ) : (
            <div className="space-y-2">
              {focus.map(t => (
                <div key={t.topic_id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                  <span className="w-1 h-9 rounded-full bg-rose-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{t.topic_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.subject_name} · {t.correct}/{t.total} correct · avg {fmtTime(t.avg_time_seconds)} per Q
                    </p>
                  </div>
                  <span className="text-[12px] font-bold text-rose-600 dark:text-rose-400 flex-shrink-0">{t.accuracy_percent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={CARD + ' p-5 sm:p-6'}>
          <div className="flex items-center gap-2 mb-4">
            <Award size={15} className="text-emerald-500" />
            <h3 className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">Your strong areas</h3>
          </div>
          {strong.length === 0 ? (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Once you build accuracy in topics, they'll show up here.</p>
          ) : (
            <div className="space-y-2">
              {strong.map(t => (
                <div key={t.topic_id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
                  <span className="w-1 h-9 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{t.topic_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.subject_name} · {t.correct}/{t.total} correct
                    </p>
                  </div>
                  <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">{t.accuracy_percent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA — generate plan from these weak areas */}
      {!isAdmin && (
        <div className={CARD + ' p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Zap size={17} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Next: generate your personalised plan</p>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400">Your study plan will focus on the topics above and give you daily practice.</p>
            </div>
          </div>
          <Link to="/student/plan"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors flex-shrink-0">
            Open study plan <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────── */
export default function Diagnostic() {
  const { user, init } = useAuthStore();
  const navigate = useNavigate();

  const [statusLoading, setStatusLoading] = useState(true);
  const [completed, setCompleted] = useState(!!user?.diagnostic_completed_at);
  const [tab, setTab] = useState(completed ? 'report' : 'test');

  const [starting, setStarting] = useState(false);
  const [attempt, setAttempt] = useState(null);  // { attempt_id, questions }

  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null);

  // Load status (in case the user object is stale).
  useEffect(() => {
    api.get('/student/diagnostic/status')
      .then(r => {
        setCompleted(!!r.data.completed);
        if (r.data.completed) setTab('report');
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  // Load report when on report tab + completed.
  useEffect(() => {
    if (tab !== 'report' || !completed) return;
    setReportLoading(true);
    api.get('/student/diagnostic/report')
      .then(r => setReport(r.data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setReportLoading(false));
  }, [tab, completed]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const r = await api.post('/student/diagnostic/start');
      setAttempt({ attempt_id: r.data.attempt_id, questions: r.data.questions || [] });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start diagnostic');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitted = async () => {
    toast.success('Diagnostic submitted! Loading your report…');
    setAttempt(null);
    setCompleted(true);
    setTab('report');
    // Refresh user in store so the rest of the app unlocks.
    await init();
  };

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-white/70 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Aptitude assessment</p>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Diagnostic test</h1>
            <p className="text-white/80 text-sm mt-1.5">A one-time test to baseline your strengths across all four sections.</p>
          </div>
          {completed && (
            <div className="hidden md:inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[12px] font-semibold px-3 py-1.5 rounded-md backdrop-blur-sm">
              <CheckCircle2 size={13} /> Completed
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8">
        {/* Sub-tabs (Test / Report) */}
        <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setTab('test')}
            disabled={completed && tab === 'report' && !attempt}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 ${
              tab === 'test'
                ? 'bg-white dark:bg-[#161620] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            } ${completed ? 'cursor-not-allowed opacity-60' : ''}`}>
            <ClipboardList size={13} /> Test
            {completed && <CheckCircle2 size={12} className="text-emerald-500" />}
          </button>
          <button
            onClick={() => setTab('report')}
            disabled={!completed}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 ${
              tab === 'report'
                ? 'bg-white dark:bg-[#161620] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            } ${!completed ? 'cursor-not-allowed opacity-50' : ''}`}>
            <FileText size={13} /> Report
          </button>
        </div>

        {statusLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : tab === 'test' ? (
          completed ? (
            <div className={CARD + ' p-8 max-w-2xl mx-auto text-center'}>
              <div className="inline-flex w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 items-center justify-center mb-3">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">You've already taken the diagnostic</h2>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 mb-5">
                Your personalised study plan is ready. Open the report tab to see your detailed analysis.
              </p>
              <button onClick={() => setTab('report')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors">
                See my report <ArrowRight size={13} />
              </button>
            </div>
          ) : attempt ? (
            <TestRunner attemptId={attempt.attempt_id} questions={attempt.questions} onSubmitted={handleSubmitted} />
          ) : (
            <Intro onStart={handleStart} starting={starting} />
          )
        ) : (
          /* Report tab */
          reportLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>
          ) : !completed ? (
            <div className={CARD + ' p-8 text-center max-w-xl mx-auto'}>
              <Target size={28} className="text-rose-500 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-slate-900 dark:text-white">Take the test first</p>
              <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">Your detailed report appears here after submission.</p>
            </div>
          ) : (
            <DiagnosticReport data={report} />
          )
        )}
      </div>
    </div>
  );
}
