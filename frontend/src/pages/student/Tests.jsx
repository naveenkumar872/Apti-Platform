import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { ClipboardList, Clock, Maximize2, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Zap } from "lucide-react";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";

function useProctor(attemptId, enabled) {
  const violRef = useRef(0);
  const report = useCallback(async (type) => {
    try { await api.post(`/student/tests/attempts/${attemptId}/violation`, { type }); } catch {}
  }, [attemptId]);

  useEffect(() => {
    if (!enabled || !attemptId) return;
    const onVis = () => { if (document.hidden) { violRef.current++; report("tab_switch"); } };
    const onCtx = e => { e.preventDefault(); report("right_click"); };
    const onCopy = () => report("copy");
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("copy", onCopy);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("copy", onCopy);
    };
  }, [enabled, attemptId, report]);

  return violRef;
}

function Timer({ endTime, onExpire }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000));
      setSecs(left);
      if (left === 0) onExpire();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime, onExpire]);
  const m = Math.floor(secs / 60), s = secs % 60;
  const urgent = secs < 120;
  return (
    <div className={"flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold " + (urgent ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300")}>
      <Clock size={14} className={urgent ? "animate-pulse" : ""} />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}

function TestInterface({ test, attempt, onSubmit }) {
  const questions = attempt?.questions || attempt?.test?.questions || [];
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const violRef = useProctor(attempt?.attempt_id, true);

  const answer = async (qid, opt) => {
    setAnswers(a => ({ ...a, [qid]: opt }));
    try { await api.post(`/student/tests/attempts/${attempt.attempt_id}/answer`, { question_id: qid, selected_answer: opt }); } catch {}
  };

  const submit = async () => {
    setSubmitting(true);
    try { const r = await api.post(`/student/tests/attempts/${attempt.attempt_id}/submit`); onSubmit(r.data); }
    catch {}
    setSubmitting(false);
  };

  const q = questions[idx];
  // Support both {id, text} options array and flat option_a/b/c/d
  const opts = q ? (
    Array.isArray(q.options) && q.options.length > 0
      ? q.options.map(o => [o.id, o.text])
      : [["A", q.option_a], ["B", q.option_b], ["C", q.option_c], ["D", q.option_d]]
  ).filter(([, text]) => text) : [];
  const answered = Object.keys(answers).length;

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Question panel */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className={"flex items-center justify-between px-5 py-3 rounded-2xl border mb-4 " + C}>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{test?.title}</span>
          <div className="flex items-center gap-3">
            {violRef.current > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                <AlertTriangle size={13} />
                {violRef.current} violation{violRef.current > 1 ? "s" : ""}
              </span>
            )}
            {attempt?.end_time && <Timer endTime={attempt.end_time} onExpire={submit} />}
          </div>
        </div>

        {/* Question card */}
        <div className={"flex-1 rounded-2xl border p-6 overflow-auto " + C}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400">Q{idx + 1} of {questions.length}</span>
            {q?.difficulty && <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (q.difficulty === "hard" || q.difficulty === 5 ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : q.difficulty === "medium" || q.difficulty === 3 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")}>{typeof q.difficulty === 'number' ? (q.difficulty >= 4 ? 'hard' : q.difficulty >= 2 ? 'medium' : 'easy') : q.difficulty}</span>}
          </div>
          <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-5">{q?.question_text}</p>
          <div className="space-y-2.5">
            {opts.map(([key, text]) => {
              const chosen = answers[q?.question_id] === key;
              return (
                <button key={key} onClick={() => answer(q.question_id, key)}
                  className={"w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all " + (chosen ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-500" : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-gray-800/60")}>
                  <span className={"w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 " + (chosen ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300")}>{key}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{text}</span>
                  {chosen && <CheckCircle2 size={15} className="ml-auto text-indigo-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex justify-between gap-3 mt-4">
          <button onClick={() => setIdx(i => i - 1)} disabled={idx === 0}
            className={"flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors " + C + " disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"}>
            <ChevronLeft size={15} /> Previous
          </button>
          {idx < questions.length - 1 ? (
            <button onClick={() => setIdx(i => i + 1)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          )}
        </div>
      </div>

      {/* Question navigator sidebar */}
      <div className={"w-44 rounded-2xl border p-4 flex-shrink-0 h-fit sticky top-0 " + C}>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3">Navigator</p>
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {questions.map((q2, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={"w-7 h-7 rounded-lg text-xs font-bold transition-colors " + (i === idx ? "bg-indigo-600 text-white" : answers[q2.question_id] ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700")}>
              {i + 1}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/40 inline-block" />Answered ({answered})</div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800 inline-block" />Not answered ({questions.length - answered})</div>
        </div>
      </div>
    </div>
  );
}

function SubmittedView({ result, onBack }) {
  const score = result?.score ?? 0;
  const total = result?.total_marks ?? 0;
  const accuracy = result?.accuracy_percent ?? 0;
  const correct = result?.correct_count ?? 0;
  const totalAnswered = result?.total_answered ?? 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : Math.round(accuracy);

  return (
    <div className="max-w-lg mx-auto">
      <div className={"rounded-2xl border p-8 text-center " + C}>
        {/* Score circle */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex flex-col items-center justify-center mx-auto mb-5 shadow-xl">
          <span className="text-3xl font-black text-white leading-none">{percentage}%</span>
          <span className="text-white/70 text-[10px] font-semibold">SCORE</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Test Submitted!</h2>
        <p className="text-gray-400 text-sm mb-6">Great effort. Review your performance below.</p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Marks', value: `${score}/${total}` },
            { label: 'Accuracy', value: `${Math.round(accuracy)}%` },
            { label: 'Correct', value: `${correct}/${totalAnswered || correct + (result?.total_questions || 0)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl py-3 px-2">
              <p className="text-base font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Performance indicator */}
        <div className={`rounded-xl py-3 px-4 mb-6 text-sm font-semibold ${percentage >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : percentage >= 60 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
          {percentage >= 80 ? '🎉 Excellent! You scored above 80%.' : percentage >= 60 ? '👍 Good attempt. Aim for 80%+!' : '📚 Needs improvement. Keep practising!'}
        </div>

        <button onClick={onBack} className="w-full px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
          Back to Tests
        </button>
      </div>
    </div>
  );
}

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const start = async (test) => {
    setStarting(test.test_id);
    try {
      const r = await api.post(`/student/tests/${test.test_id}/start`);
      setActive(test);
      setAttempt(r.data);
    } catch {}
    setStarting(null);
  };

  useEffect(() => {
    api.get("/student/tests")
      .then(r => {
        const fetchedTests = r.data.tests || [];
        setTests(fetchedTests);
        if (location.state?.retakeTestId) {
          const targetTestId = location.state.retakeTestId;
          navigate(location.pathname, { replace: true, state: null });
          const found = fetchedTests.find(t => t.test_id === targetTestId);
          if (found) {
            start(found);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location, navigate]);

  if (result) return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Result</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Test Complete</h1>
            <p className="text-white/70 text-sm mt-1.5">Review your performance below</p>
          </div>
          <button
            onClick={() => { setActive(null); setAttempt(null); setResult(null); }}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0">
            <ChevronLeft size={15} /> Back to Tests
          </button>
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">
        <SubmittedView result={result} onBack={() => { setActive(null); setAttempt(null); setResult(null); }} />
      </div>
    </div>
  );

  if (active && attempt) return (
    <div className="w-full h-full p-5 md:p-6">
      <TestInterface test={active} attempt={attempt} onSubmit={data => { setResult(data); }} />
    </div>
  );

  const availableTests = tests.length;
  const practiceMode = tests.filter(t => t.mode === "practice").length;
  const testMode = tests.filter(t => t.mode === "test").length;
  const liveAssessments = tests.filter(t => t.status === "live").length;

  const STAT_CARDS = [
    { label: "Available Tests", value: availableTests, icon: ClipboardList, grad: "from-blue-500 to-indigo-600" },
    { label: "Practice Mode", value: practiceMode, icon: BookOpen, grad: "from-emerald-500 to-teal-600" },
    { label: "Test Mode", value: testMode, icon: Clock, grad: "from-violet-500 to-purple-600" },
    { label: "Live Assessments", value: liveAssessments, icon: Zap, grad: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Assessments</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Tests</h1>
            <p className="text-white/70 text-sm mt-1.5">Scheduled assessments &amp; mock tests</p>
          </div>
          <div className="hidden sm:flex gap-3 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-center min-w-[72px]">
              <p className="text-xl font-black text-white">{tests.length}</p>
              <p className="text-white/60 text-xs mt-0.5">Available</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">

        {/* Stat cards */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {STAT_CARDS.map(({ label, value, icon: Icon, grad }) => (
              <div key={label} className={"shadow-sm p-5 " + C}>
                <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 " + grad}>
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
      ) : tests.length === 0 ? (
        <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-14 text-center " + C}>
          <ClipboardList size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No tests available</p>
          <p className="text-gray-400 text-sm mt-1">Check back later for scheduled tests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(t => (
            <div key={t.test_id} className={"rounded-2xl border p-5 flex items-center gap-4 " + C}>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <ClipboardList size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{t.duration_minutes} min</span>
                  <span className="text-xs text-gray-400">{t.total_questions || t.question_count || "?"} questions</span>
                  {t.status === "completed" && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Completed</span>}
                  {t.attempt_count > 0 && (
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      Attempted {t.attempt_count}x
                    </span>
                  )}
                </div>
              </div>
              {t.attempt_status === "submitted" || t.status === "completed" ? (
                <button onClick={() => start(t)} disabled={starting === t.test_id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0 disabled:opacity-60">
                  <Maximize2 size={12} />
                  {starting === t.test_id ? "Starting..." : "Retake"}
                </button>
              ) : (
                <button onClick={() => start(t)} disabled={starting === t.test_id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-opacity flex-shrink-0 disabled:opacity-60">
                  <Maximize2 size={12} />
                  {starting === t.test_id ? "Starting..." : "Start"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
