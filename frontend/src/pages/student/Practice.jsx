import { useEffect, useState, useRef } from "react";
import api from "../../services/api";
import { Zap, ChevronDown, CheckCircle2, XCircle, RotateCcw, Play } from "lucide-react";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";
const SEL = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none";

const AI_STEPS = ["Analyzing your performance...", "Selecting optimal questions...", "Generating personalized quiz..."];

function SetupView({ onStart }) {
  const [subjects, setSubjects] = useState([]);
  const [cfg, setCfg] = useState({ subject_id: "", topic_id: "", difficulty: "mixed", num_questions: 10 });
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiStep, setAiStep] = useState(-1);

  useEffect(() => {
    api.get("/student/subjects").then(r => setSubjects(r.data.subjects || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (cfg.subject_id) {
      const sub = subjects.find(s => s.subject_id == cfg.subject_id);
      setTopics(sub?.topics || []);
      setCfg(c => ({ ...c, topic_id: "" }));
    }
  }, [cfg.subject_id, subjects]);

  const start = async () => {
    if (!cfg.subject_id) return;
    setLoading(true); setAiStep(0);
    const t1 = setTimeout(() => setAiStep(1), 700);
    const t2 = setTimeout(() => setAiStep(2), 1400);
    try {
      const r = await api.post("/student/practice/start", { ...cfg, subject_id: Number(cfg.subject_id), topic_id: cfg.topic_id ? Number(cfg.topic_id) : null });
      clearTimeout(t1); clearTimeout(t2);
      onStart(r.data);
    } catch { clearTimeout(t1); clearTimeout(t2); }
    setLoading(false); setAiStep(-1);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
        <Zap size={28} className="text-white animate-pulse" />
      </div>
      <div className="space-y-2 text-center">
        {AI_STEPS.map((step, i) => (
          <p key={i} className={"text-sm transition-all duration-500 " + (i <= aiStep ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-gray-300 dark:text-gray-600")}>{step}</p>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <div className={"rounded-2xl border p-6 " + C}>
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-5">Configure Practice Session</h2>
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Subject *</label>
            <select value={cfg.subject_id} onChange={e => setCfg(c => ({ ...c, subject_id: e.target.value }))} className={SEL}>
              <option value="">Select subject...</option>
              {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-[2.35rem] text-gray-400 pointer-events-none" />
          </div>
          {topics.length > 0 && (
            <div className="relative">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Topic (optional)</label>
              <select value={cfg.topic_id} onChange={e => setCfg(c => ({ ...c, topic_id: e.target.value }))} className={SEL}>
                <option value="">All topics</option>
                {topics.map(t => <option key={t.topic_id} value={t.topic_id}>{t.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-[2.35rem] text-gray-400 pointer-events-none" />
            </div>
          )}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Difficulty</label>
            <select value={cfg.difficulty} onChange={e => setCfg(c => ({ ...c, difficulty: e.target.value }))} className={SEL}>
              <option value="mixed">Mixed</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-[2.35rem] text-gray-400 pointer-events-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Number of Questions: {cfg.num_questions}</label>
            <input type="range" min="5" max="30" step="5" value={cfg.num_questions} onChange={e => setCfg(c => ({ ...c, num_questions: Number(e.target.value) }))}
              className="w-full accent-indigo-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>5</span><span>30</span></div>
          </div>
        </div>
        <button onClick={start} disabled={!cfg.subject_id}
          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
          <Play size={16} />
          Start Practice
        </button>
      </div>
    </div>
  );
}

function QuestionView({ session, onEnd }) {
  const questions = session?.questions || [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const q = questions[idx];

  const answer = async (optionKey) => {
    if (answers[idx] !== undefined) return;
    setAnswers(a => ({ ...a, [idx]: optionKey }));
    try {
      const r = await api.post(`/student/practice/submit-answer`, { session_id: session.session_id, question_id: q.question_id, selected_answer: optionKey });
      setFeedback(f => ({ ...f, [idx]: r.data }));
    } catch {}
  };

  const end = async () => {
    setSubmitting(true);
    try { const r = await api.post(`/student/practice/end`, { session_id: session.session_id }); onEnd(r.data); }
    catch {}
    setSubmitting(false);
  };

  const rawOpts = q?.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
  const opts = rawOpts.map((o, i) => [String.fromCharCode(65 + i), typeof o === 'object' ? o.text || o : o]).filter(o => o[1]);
  const fb = feedback[idx];
  const chosen = answers[idx];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Question {idx + 1} / {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={"w-2 h-2 rounded-full transition-colors " + (answers[i] !== undefined ? (feedback[i]?.is_correct ? "bg-emerald-500" : "bg-red-400") : i === idx ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-700")} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-6">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question card */}
      <div className={"rounded-2xl border p-6 mb-4 " + C}>
        {q?.difficulty && (() => { const dl = typeof q.difficulty === 'number' ? (q.difficulty <= 2 ? 'easy' : q.difficulty <= 3 ? 'medium' : 'hard') : q.difficulty; return <span className={"text-xs font-semibold px-2 py-0.5 rounded-full mb-3 inline-block " + (dl === "hard" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : dl === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400")}>{dl}</span>; })()}
        <p className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-5">{q?.question_text}</p>
        <div className="space-y-2.5">
          {opts.map(([key, text]) => {
            let cls = "border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/30";
            if (chosen !== undefined) {
              if (key === fb?.correct_answer) cls = "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-600";
              else if (key === chosen && !fb?.is_correct) cls = "border-red-400 bg-red-50 dark:bg-red-950/30 dark:border-red-600";
              else cls = "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40 opacity-60";
            }
            return (
              <button key={key} onClick={() => answer(key)} disabled={chosen !== undefined}
                className={"w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all " + cls}>
                <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">{key}</span>
                <span className="text-sm text-gray-700 dark:text-gray-200">{text}</span>
                {chosen !== undefined && key === fb?.correct_answer && <CheckCircle2 size={16} className="ml-auto text-emerald-500 flex-shrink-0" />}
                {chosen !== undefined && key === chosen && !fb?.is_correct && <XCircle size={16} className="ml-auto text-red-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        {fb?.explanation && chosen !== undefined && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold mb-0.5">Explanation</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">{fb.explanation}</p>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex justify-between gap-3">
        <button onClick={() => setIdx(i => i - 1)} disabled={idx === 0}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
          Previous
        </button>
        {idx < questions.length - 1 ? (
          <button onClick={() => setIdx(i => i + 1)} disabled={answers[idx] === undefined}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
            Next
          </button>
        ) : (
          <button onClick={end} disabled={submitting || questions.some((_, i) => answers[i] === undefined)}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
            {submitting ? "Finishing..." : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultView({ result, onRestart }) {
  const score = result?.accuracy_percent || 0;
  const total = result?.total || 0;
  const correct = result?.correct || result?.score || 0;
  const wrong = result?.wrong || (total - correct);
  const r = { correct, wrong, skipped: Math.max(0, total - correct - wrong) };
  return (
    <div className="max-w-md mx-auto text-center">
      <div className={"rounded-2xl border p-8 " + C}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
          <span className="text-3xl font-black text-white">{Math.round(score)}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Practice Complete!</h2>
        <p className="text-gray-400 text-sm mb-6">Here is how you did</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{r.correct || 0}</p>
            <p className="text-xs text-gray-400">Correct</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
            <p className="text-xl font-bold text-red-500 dark:text-red-400">{r.wrong || 0}</p>
            <p className="text-xs text-gray-400">Wrong</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
            <p className="text-xl font-bold text-gray-600 dark:text-gray-300">{r.skipped || 0}</p>
            <p className="text-xs text-gray-400">Skipped</p>
          </div>
        </div>
        <button onClick={onRestart} className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
          <RotateCcw size={15} />
          Practice Again
        </button>
      </div>
    </div>
  );
}

export default function Practice() {
  const [view, setView] = useState("setup");
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Practice</h1>
          <p className="text-xs text-gray-400">AI-powered adaptive quiz</p>
        </div>
      </div>

      {view === "setup" && <SetupView onStart={data => { setSession(data); setView("quiz"); }} />}
      {view === "quiz" && <QuestionView session={session} onEnd={data => { setResult(data); setView("result"); }} />}
      {view === "result" && <ResultView result={result} onRestart={() => { setSession(null); setResult(null); setView("setup"); }} />}
    </div>
  );
}
