import { useEffect, useState, useRef, useCallback } from "react";
import api from "../../services/api";
import { ClipboardList, Clock, Maximize2, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

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
  const questions = attempt?.questions || [];
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const violRef = useProctor(attempt?.attempt_id, true);

  const answer = async (qid, opt) => {
    setAnswers(a => ({ ...a, [qid]: opt }));
    try { await api.post(`/student/tests/attempts/${attempt.attempt_id}/answer`, { question_id: qid, selected_option: opt }); } catch {}
  };

  const submit = async () => {
    setSubmitting(true);
    try { const r = await api.post(`/student/tests/attempts/${attempt.attempt_id}/submit`); onSubmit(r.data); }
    catch {}
    setSubmitting(false);
  };

  const q = questions[idx];
  const opts = q ? [["A", q.option_a], ["B", q.option_b], ["C", q.option_c], ["D", q.option_d]].filter(o => o[1]) : [];
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
            {q?.difficulty && <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (q.difficulty === "hard" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : q.difficulty === "medium" ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")}>{q.difficulty}</span>}
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
  const score = result?.score || 0;
  return (
    <div className="max-w-md mx-auto text-center">
      <div className={"rounded-2xl border p-8 " + C}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="text-3xl font-black text-white">{Math.round(score)}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Test Submitted!</h2>
        <p className="text-gray-400 text-sm mb-5">Your score: {Math.round(score)}%</p>
        <button onClick={onBack} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
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

  useEffect(() => {
    api.get("/student/tests").then(r => setTests(r.data.tests || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const start = async (test) => {
    setStarting(test.test_id);
    try {
      const r = await api.post(`/student/tests/${test.test_id}/start`);
      setActive(test);
      setAttempt(r.data);
    } catch {}
    setStarting(null);
  };

  if (result) return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"><ClipboardList size={18} className="text-white" /></div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tests</h1>
      </div>
      <SubmittedView result={result} onBack={() => { setActive(null); setAttempt(null); setResult(null); }} />
    </div>
  );

  if (active && attempt) return (
    <div className="p-6">
      <TestInterface test={active} attempt={attempt} onSubmit={data => { setResult(data); }} />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <ClipboardList size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Tests</h1>
          <p className="text-xs text-gray-400">Scheduled assessments</p>
        </div>
      </div>

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
                </div>
              </div>
              {t.status !== "completed" && (
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
  );
}
