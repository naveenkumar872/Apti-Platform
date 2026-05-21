import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2, Clock, Target, ArrowLeft, ArrowRight, CheckCircle2, XCircle,
  Loader2, Flag, AlertTriangle, ShieldAlert, Sparkles, Maximize2, Trophy
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CARD = 'bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl';

function fmtTime(secs) {
  const s = Math.max(0, Math.round(secs || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/* ─────────────────────────────────────────────────
   LANDING — list company patterns
   ───────────────────────────────────────────────── */
export function SimulatorLanding() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/student/simulator/companies')
      .then(r => setCompanies(r.data.companies || []))
      .catch(() => toast.error('Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (companyId) => {
    setStarting(companyId);
    try {
      const r = await api.post('/student/simulator/start', { company_id: companyId });
      navigate(`/student/simulator/attempt/${r.data.attempt_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start');
      setStarting(null);
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <p className="text-white/70 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Placement simulators</p>
          <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Company Exam Simulator</h1>
          <p className="text-white/80 text-sm mt-1.5">Full-length, section-locked mocks that mirror real placement papers.</p>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-56 bg-slate-200 dark:bg-white/[0.04] rounded-2xl animate-pulse" />)}
          </div>
        ) : companies.length === 0 ? (
          <div className={CARD + ' p-10 text-center'}>
            <Building2 size={28} className="text-slate-400 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">No simulators set up yet</p>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">Ask your admin to enable a company exam pattern.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => (
              <div key={c.company_id} className={CARD + ' p-5 flex flex-col'}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight truncate">{c.name}</h3>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">{c.section_count} sections · {c.total_questions} Qs · {c.duration_minutes} min</p>
                  </div>
                </div>

                {/* Section bars */}
                <div className="space-y-1.5 mb-4">
                  {c.sections.slice(0, 4).map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
                      <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 ml-2">
                        {s.question_count}Q · {s.duration_minutes}m · cut {s.cutoff_percent}%
                      </span>
                    </div>
                  ))}
                </div>

                {c.my_attempts > 0 && (
                  <div className="text-[11px] mb-3 inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Sparkles size={11} className="text-violet-500" />
                    {c.my_attempts} attempt{c.my_attempts === 1 ? '' : 's'}{c.my_best != null && ` · best ${c.my_best}%`}
                  </div>
                )}

                <button onClick={() => handleStart(c.company_id)}
                  disabled={starting === c.company_id}
                  className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
                  {starting === c.company_id ? <><Loader2 size={13} className="animate-spin" /> Setting up</> : <>Start mock <ArrowRight size={13} /></>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   RUNNER — proctored fullscreen test
   ───────────────────────────────────────────────── */
export function SimulatorRunner() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeSec, setActiveSec] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers]     = useState({});            // question_id → 'A' | 'B' | …
  const [flagged, setFlagged]     = useState({});            // question_id → true
  const [secStartedAt, setSecStartedAt] = useState(Date.now());
  const [secTimeLeft, setSecTimeLeft]   = useState(0);
  const [violations, setViolations]     = useState(0);
  const [warning, setWarning]           = useState(null);
  const [needsFullscreen, setNeedsFullscreen] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [confirmExit, setConfirmExit]   = useState(false);
  const submittingRef = useRef(false);
  const qStartRef     = useRef(Date.now());

  /* Load attempt */
  useEffect(() => {
    setLoading(true);
    api.get(`/student/simulator/attempt/${id}`)
      .then(r => {
        const d = r.data;
        setData(d);
        setActiveSec(d.current_section || 0);
        setActiveIdx(0);
        // Pre-populate any saved answers/flags
        const ans = {}, flg = {};
        for (const s of (d.sections || [])) {
          for (const q of (s.questions || [])) {
            if (q.selected_answer) ans[q.question_id] = q.selected_answer;
            if (q.flagged)         flg[q.question_id] = true;
          }
        }
        setAnswers(ans);
        setFlagged(flg);
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to load attempt');
        navigate('/student/simulator');
      })
      .finally(() => setLoading(false));
  }, [id]);

  /* Section timer */
  useEffect(() => {
    if (!data) return;
    const sec = data.sections[activeSec];
    if (!sec) return;
    const dur = (parseInt(sec.duration_minutes, 10) || 0) * 60;
    setSecStartedAt(Date.now());
    setSecTimeLeft(dur);
  }, [activeSec, data]);

  useEffect(() => {
    if (secTimeLeft <= 0) return;
    const t = setInterval(() => {
      setSecTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          // Auto-advance the section
          handleSubmitSection(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secTimeLeft > 0]);

  /* Proctoring guards */
  useEffect(() => {
    const enterFS = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch { setNeedsFullscreen(true); }
    };
    enterFS();

    const block = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    const onVis = () => {
      if (document.hidden && !submittingRef.current) {
        setViolations(v => v + 1);
        setWarning({ title: 'Tab switch detected', message: 'Stay on this tab — every switch is logged on your attempt.' });
      }
    };
    const onFS = () => {
      if (!document.fullscreenElement && !submittingRef.current) {
        setNeedsFullscreen(true);
        setViolations(v => v + 1);
      }
    };
    const onKey = (e) => {
      const k = (e.key || '').toLowerCase();
      const blocked = ['c', 'v', 'x', 'a', 'p', 's', 'u'];
      if ((e.ctrlKey || e.metaKey) && blocked.includes(k)) return block(e);
      if (k === 'f12') return block(e);
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k)) return block(e);
    };
    const onBeforeUnload = (e) => {
      if (submittingRef.current) return;
      e.preventDefault();
      e.returnValue = 'Your simulator attempt is in progress. Leave anyway?';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('fullscreenchange', onFS);
    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('fullscreenchange', onFS);
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('dragstart', block);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const reEnterFS = async () => {
    try { await document.documentElement.requestFullscreen(); setNeedsFullscreen(false); }
    catch { /* leave overlay up */ }
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-50 dark:bg-[#09090d]">
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const section = data.sections[activeSec];
  const sectionQuestions = section?.questions || [];
  const q = sectionQuestions[activeIdx];
  if (!q) return null;

  const optionsArr = Array.isArray(q.options)
    ? q.options.map((o, i) => typeof o === 'string' ? { id: String.fromCharCode(65 + i), text: o } : o)
    : (q.options && typeof q.options === 'object'
        ? Object.entries(q.options).map(([id, text]) => ({ id, text }))
        : []);

  const selected = answers[q.question_id];
  const isFlagged = !!flagged[q.question_id];

  const choose = async (id) => {
    if (selected === id) return;
    setAnswers(prev => ({ ...prev, [q.question_id]: id }));
    const elapsedQ = Math.max(1, Math.floor((Date.now() - qStartRef.current) / 1000));
    try {
      await api.post('/student/simulator/answer', {
        attempt_id: data.attempt_id,
        question_id: q.question_id,
        selected_answer: id,
        time_taken_seconds: elapsedQ,
        flagged: isFlagged,
      });
    } catch { /* non-fatal */ }
  };

  const toggleFlag = async () => {
    const newFlag = !isFlagged;
    setFlagged(prev => ({ ...prev, [q.question_id]: newFlag }));
    try {
      await api.post('/student/simulator/answer', {
        attempt_id: data.attempt_id,
        question_id: q.question_id,
        selected_answer: selected || null,
        time_taken_seconds: 0,
        flagged: newFlag,
      });
    } catch { /* non-fatal */ }
  };

  const goTo = (idx) => {
    if (idx < 0 || idx >= sectionQuestions.length) return;
    qStartRef.current = Date.now();
    setActiveIdx(idx);
  };

  const handleSubmitSection = async (auto = false) => {
    if (!auto) {
      const unanswered = sectionQuestions.filter(q => !answers[q.question_id]).length;
      if (unanswered > 0) {
        setWarning({
          title: 'Submit section?',
          message: `${unanswered} of ${sectionQuestions.length} questions are unanswered in this section. Once submitted you can't return.`,
          action: { label: 'Submit section', run: () => doSubmitSection(false) },
        });
        return;
      }
    }
    doSubmitSection(auto);
  };

  const doSubmitSection = async (auto) => {
    setWarning(null);
    const isLast = activeSec + 1 >= data.sections.length;
    try {
      await api.post('/student/simulator/submit-section', {
        attempt_id: data.attempt_id,
        section_index: activeSec,
      });
      if (auto) toast(`Time's up — moving on${isLast ? ' to final submit' : ''}`, { icon: '⏰' });
      if (isLast) {
        await finalSubmit();
      } else {
        setActiveSec(s => s + 1);
        setActiveIdx(0);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not advance section');
    }
  };

  const finalSubmit = async () => {
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await api.post('/student/simulator/submit', {
        attempt_id: data.attempt_id,
        violations,
      });
      navigate(`/student/simulator/result/${data.attempt_id}`);
    } catch (err) {
      submittingRef.current = false;
      setSubmitting(false);
      toast.error(err.response?.data?.error || 'Submission failed');
    }
  };

  const answeredInSection = sectionQuestions.filter(q => answers[q.question_id]).length;
  const flaggedInSection  = sectionQuestions.filter(q => flagged[q.question_id]).length;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-slate-50 dark:bg-[#09090d] overflow-hidden"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Proctor status bar */}
      <div className="flex-shrink-0 bg-white dark:bg-[#0e0e15] border-b border-slate-200 dark:border-white/[0.06] px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Building2 size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {data.company_name} · Proctored
            </p>
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
              {section.name} — Q{activeIdx + 1} / {sectionQuestions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Section pills */}
          <div className="hidden md:inline-flex items-center gap-1 mr-1">
            {data.sections.map((s, i) => (
              <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                i < activeSec ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' :
                i === activeSec ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300' :
                                  'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-500'
              }`}>
                {i + 1}. {(s.name || '').split(' ')[0]}
              </span>
            ))}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-md ${
            secTimeLeft < 60
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
              : 'bg-slate-100 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200'
          }`}>
            <Clock size={12} /> {fmtTime(secTimeLeft)}
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
        <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
          style={{ width: `${((activeIdx + 1) / sectionQuestions.length) * 100}%` }} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Question column */}
          <div>
            <div className={CARD + ' p-6 sm:p-7 mb-4'}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md">
                  {q.subject_name || section.name}
                </span>
                {q.topic_name && (
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{q.topic_name}</span>
                )}
                <button onClick={toggleFlag}
                  className={`ml-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${
                    isFlagged
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}>
                  <Flag size={11} /> {isFlagged ? 'Flagged' : 'Flag for review'}
                </button>
              </div>

              <p className="text-[15px] sm:text-[16px] text-slate-900 dark:text-white leading-relaxed mb-5 whitespace-pre-line">
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

            <div className="flex items-center justify-between gap-3">
              <button onClick={() => goTo(activeIdx - 1)} disabled={activeIdx === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <ArrowLeft size={13} /> Previous
              </button>
              {activeIdx + 1 < sectionQuestions.length ? (
                <button onClick={() => goTo(activeIdx + 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-semibold transition-colors">
                  Next <ArrowRight size={13} />
                </button>
              ) : (
                <button onClick={() => handleSubmitSection(false)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors">
                  {activeSec + 1 >= data.sections.length ? 'Finish & submit' : 'Submit section'} <CheckCircle2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Question palette */}
          <aside className={CARD + ' p-5 h-fit'}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12.5px] font-semibold text-slate-900 dark:text-white">Question palette</p>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                {answeredInSection}/{sectionQuestions.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {sectionQuestions.map((qq, i) => {
                const isCurrent = i === activeIdx;
                const isAns = !!answers[qq.question_id];
                const isFlag = !!flagged[qq.question_id];
                let cls = 'bg-slate-100 text-slate-500 dark:bg-white/[0.04] dark:text-slate-400';
                if (isFlag && isAns) cls = 'bg-purple-200 text-purple-800 dark:bg-purple-500/30 dark:text-purple-200';
                else if (isFlag)     cls = 'bg-amber-200 text-amber-800 dark:bg-amber-500/30 dark:text-amber-300';
                else if (isAns)      cls = 'bg-emerald-200 text-emerald-800 dark:bg-emerald-500/30 dark:text-emerald-300';
                if (isCurrent) cls += ' ring-2 ring-violet-500';
                return (
                  <button key={i} onClick={() => goTo(i)}
                    className={`w-9 h-9 rounded-md text-[11px] font-bold transition-all ${cls}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10.5px]">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-400" /> Answered ({answeredInSection})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-400" /> Flagged ({flaggedInSection})</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-300" /> Not visited</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-400" /> Both</div>
            </div>

            <button onClick={() => handleSubmitSection(false)}
              className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-bold transition-colors">
              <CheckCircle2 size={12} /> Submit section
            </button>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-2 text-center">
              Once submitted, you can't return to this section.
            </p>
          </aside>
        </div>
      </div>

      {/* Fullscreen prompt */}
      {needsFullscreen && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6">
          <div className="bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Maximize2 size={20} className="text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">Return to fullscreen</h3>
            </div>
            <p className="text-[13px] text-slate-600 dark:text-slate-400">
              The simulator must be taken in fullscreen. Click below to re-enter.
            </p>
            <button onClick={reEnterFS}
              className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13.5px] font-bold transition-colors">
              <Maximize2 size={13} /> Enter fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Warning modal */}
      {warning && !needsFullscreen && (
        <div className="absolute inset-0 z-[65] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-6">
          <div className="bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900 dark:text-white">{warning.title}</h3>
            </div>
            <p className="text-[13px] text-slate-600 dark:text-slate-400">{warning.message}</p>
            <div className="mt-5 flex gap-2">
              {warning.action && (
                <button onClick={() => warning.action.run()}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold transition-colors">
                  {warning.action.label}
                </button>
              )}
              <button onClick={() => setWarning(null)}
                className={`${warning.action ? 'flex-1' : 'w-full'} inline-flex items-center justify-center px-4 py-2.5 rounded-lg ${warning.action ? 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.03]' : 'bg-violet-600 hover:bg-violet-700 text-white'} text-[13px] font-bold transition-colors`}>
                {warning.action ? 'Keep working' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   RESULT PAGE
   ───────────────────────────────────────────────── */
export function SimulatorResult({ adminMode = false }) {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = adminMode ? `/admin/simulator/attempts/${id}` : `/student/simulator/result/${id}`;
    api.get(url)
      .then(r => setData(r.data))
      .catch(err => toast.error(err.response?.data?.error || 'Failed to load result'))
      .finally(() => setLoading(false));
  }, [id, adminMode]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>;
  }
  if (!data) return null;

  const passed = data.overall_passed;

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className={`relative px-6 pt-8 pb-7 md:px-10 overflow-hidden ${
        passed
          ? 'bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600'
          : 'bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600'
      }`}>
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative">
          <p className="text-white/70 text-[11px] font-semibold tracking-[0.18em] uppercase mb-2">Simulator result</p>
          <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">{data.company_name}</h1>
          <p className="text-white/85 text-sm mt-1.5">
            {passed
              ? "✓ You'd clear this company's cutoff at today's level."
              : "Below cutoff at today's level — work through the focus topics in your plan."}
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8 space-y-5 max-w-5xl mx-auto w-full">
        {/* Headline cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={CARD + ' p-4'}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Score</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1">
              {Math.round(data.accuracy_percent)}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{data.correct_count}/{data.total_questions} correct</p>
          </div>
          <div className={CARD + ' p-4'}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cutoff</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1">{data.overall_cutoff_percent}%</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">company target</p>
          </div>
          <div className={CARD + ' p-4'}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Verdict</p>
            <p className={`text-base font-bold mt-1 inline-flex items-center gap-1.5 ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {passed ? <><Trophy size={15} /> Clears</> : <><XCircle size={15} /> Below cutoff</>}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">overall</p>
          </div>
          <div className={CARD + ' p-4'}>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Time</p>
            <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1">{fmtTime(data.time_taken_seconds)}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">total</p>
          </div>
        </div>

        {/* Section breakdown */}
        <div className={CARD + ' p-5 sm:p-6'}>
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} className="text-violet-600 dark:text-violet-400" />
            <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white tracking-tight">Section results</h2>
          </div>
          <div className="space-y-4">
            {(data.section_results || []).map((s, i) => {
              const pct = s.accuracy_percent || 0;
              const cut = s.cutoff_percent || 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <p className="text-[13.5px] font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        s.passed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                      }`}>
                        {s.passed ? 'Passed' : 'Below cutoff'}
                      </span>
                    </div>
                    <span className="text-[12.5px] font-bold text-slate-700 dark:text-slate-200">{pct}%</span>
                  </div>
                  <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 ${s.passed ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    <div className="absolute top-0 bottom-0 w-px bg-slate-400 dark:bg-white/30" style={{ left: `${cut}%` }} title={`Cutoff ${cut}%`} />
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1">
                    {s.correct}/{s.total} correct · {s.answered} answered · cutoff {cut}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {!adminMode && (
          <div className="flex gap-3">
            <Link to="/student/simulator"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors">
              Try another company
            </Link>
            <Link to="/student/plan"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
              Open my study plan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
