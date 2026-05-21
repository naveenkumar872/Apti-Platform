import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Zap, CheckCircle2, XCircle, RotateCcw, Play, Trash2, Loader2,
  Upload, BookOpen, Shuffle, Clock, BarChart3, Target, ArrowLeft,
  X, Plus, Minus, CheckSquare, Square, BarChart2, Sparkles,
} from "lucide-react";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";
const BTN_PRIMARY = "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed";
const BTN_OUTLINE = "flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors";

const SUBJECTS = [
  { subject_id: "00000000-0000-0000-0000-000000000001", name: "Quantitative Aptitude" },
  { subject_id: "00000000-0000-0000-0000-000000000002", name: "Logical Reasoning" },
  { subject_id: "00000000-0000-0000-0000-000000000003", name: "Verbal Ability" },
  { subject_id: "00000000-0000-0000-0000-000000000004", name: "Data Interpretation" },
];

const DIFF_COLORS = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500",
  hard: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  mixed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const AI_STEPS = ["Analyzing your selection...", "Selecting optimal questions...", "Generating personalized quiz..."];

/* ── Generating spinner ── */
function GeneratingOverlay({ steps, step }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
        <Zap size={28} className="text-white animate-pulse" />
      </div>
      <div className="space-y-2 text-center">
        {steps.map((s, i) => (
          <p key={i} className={"text-sm transition-all duration-500 " +
            (i <= step ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-gray-300 dark:text-gray-700")}>
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   METHOD 1 — Topic-Based
═══════════════════════════════════════════ */
function TopicMethod({ onStart, loading }) {
  const [step, setStep] = useState(1); // 1=subject, 2=topics, 3=config
  const [selSubject, setSelSubject] = useState(null);
  const [allTopics, setAllTopics] = useState([]);
  const [selTopics, setSelTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [concepts, setConcepts] = useState({});
  const [selConcepts, setSelConcepts] = useState({});
  const [conceptsLoading, setConceptsLoading] = useState({});
  const [cfg, setCfg] = useState({ num_questions: 10, difficulty: "mixed", time_limit: false, time_minutes: 15 });

  const loadTopics = async (sub) => {
    setSelSubject(sub);
    setTopicsLoading(true);
    try {
      const r = await api.get("/student/smart-topics", { params: { subject_id: sub.subject_id } });
      setAllTopics(r.data.topics || []);
      setSelTopics([]);
      setStep(2);
    } catch { toast.error("Failed to load topics"); }
    setTopicsLoading(false);
  };

  const toggleTopic = async (t) => {
    const isNowSelected = !selTopics.find(s => s.topic_id === t.topic_id);
    setSelTopics(prev =>
      isNowSelected ? [...prev, t] : prev.filter(s => s.topic_id !== t.topic_id)
    );
    if (isNowSelected && !concepts[t.topic_id]) {
      setConceptsLoading(prev => ({ ...prev, [t.topic_id]: true }));
      try {
        const r = await api.get(`/student/topics/${t.topic_id}/concepts`);
        setConcepts(prev => ({ ...prev, [t.topic_id]: r.data.concepts || [] }));
      } catch {}
      setConceptsLoading(prev => ({ ...prev, [t.topic_id]: false }));
    }
  };

  const toggleConcept = (topicId, conceptId) => {
    setSelConcepts(prev => {
      const s = new Set(prev[topicId] || []);
      s.has(conceptId) ? s.delete(conceptId) : s.add(conceptId);
      return { ...prev, [topicId]: s };
    });
  };

  const handleStart = () => {
    if (selTopics.length === 0) { toast.error("Select at least one topic"); return; }
    const selectedConceptIds = Object.values(selConcepts).flatMap(s => [...s]);
    const topicNames = selTopics.map(t => t.name).join(", ");
    const title = `${selSubject.name} – ${topicNames.length > 40 ? topicNames.slice(0, 40) + "…" : topicNames}`;
    onStart({
      topic_ids: selTopics.map(t => t.topic_id),
      concept_ids: selectedConceptIds,
      ...cfg,
      time_limit: cfg.time_limit ? cfg.time_minutes : null,
      title,
      method: "topic",
      config: { subject: selSubject.name, topics: selTopics.map(t => t.name), difficulty: cfg.difficulty, count: cfg.num_questions },
    });
  };

  // Step 1: subject picker
  if (step === 1) return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a subject to begin</p>
      {topicsLoading ? (
        <div className="flex items-center gap-2 text-sm text-indigo-500"><Loader2 size={15} className="animate-spin" />Loading topics…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUBJECTS.map((s, i) => {
            const grads = ["from-violet-500 to-purple-600","from-blue-500 to-cyan-600","from-emerald-500 to-teal-600","from-orange-500 to-amber-500"];
            return (
              <button key={s.subject_id} onClick={() => loadTopics(s)}
                className={"w-full text-left rounded-2xl p-5 border-2 border-transparent bg-gradient-to-br " + grads[i] + " text-white hover:scale-[1.02] transition-transform"}>
                <p className="font-bold text-base">{s.name}</p>
                <p className="text-white/60 text-xs mt-1">Click to select topics →</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // Step 2: topic + concept checkboxes
  if (step === 2) return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { setStep(1); setAllTopics([]); setSelTopics([]); }}
          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={15} className="text-gray-500" />
        </button>
        <div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{selSubject.name}</p>
          <p className="text-xs text-gray-400">{selTopics.length} topic{selTopics.length !== 1 ? "s" : ""} selected</p>
        </div>
        {selTopics.length > 0 && (
          <button onClick={() => setStep(3)}
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold hover:opacity-90">
            Configure →
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {allTopics.map(t => {
          const isSelected = !!selTopics.find(s => s.topic_id === t.topic_id);
          return (
            <div key={t.topic_id} className={"rounded-xl border-2 transition-all " + (isSelected ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900")}>
              <button onClick={() => toggleTopic(t)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                {isSelected ? <CheckSquare size={17} className="text-indigo-500 flex-shrink-0" /> : <Square size={17} className="text-gray-300 flex-shrink-0" />}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex-1">{t.name}</span>
                {conceptsLoading[t.topic_id] && <Loader2 size={13} className="animate-spin text-indigo-400" />}
              </button>
              {isSelected && concepts[t.topic_id] && concepts[t.topic_id].length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                  {concepts[t.topic_id].map(c => {
                    const isSel = (selConcepts[t.topic_id] || new Set()).has(c.concept_id);
                    return (
                      <button key={c.concept_id} onClick={() => toggleConcept(t.topic_id, c.concept_id)}
                        className={"text-xs px-2.5 py-1 rounded-full font-medium transition-colors border " +
                          (isSel ? "bg-indigo-500 text-white border-indigo-400" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300")}>
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Step 3: config
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setStep(2)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={15} className="text-gray-500" />
        </button>
        <div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Configure Session</p>
          <p className="text-xs text-gray-400">{selTopics.map(t => t.name).join(", ")}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Number of Questions</label>
          <div className="flex gap-2 flex-wrap">
            {[10, 20, 30, 50].map(n => (
              <button key={n} onClick={() => setCfg(c => ({ ...c, num_questions: n }))}
                className={"px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors " +
                  (cfg.num_questions === n ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-300")}>
                {n}
              </button>
            ))}
            <div className="flex items-center gap-2">
              <button onClick={() => setCfg(c => ({ ...c, num_questions: Math.max(5, c.num_questions - 5) }))}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                <Minus size={13} className="text-gray-500" />
              </button>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-8 text-center">{cfg.num_questions}</span>
              <button onClick={() => setCfg(c => ({ ...c, num_questions: Math.min(50, c.num_questions + 5) }))}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                <Plus size={13} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Difficulty</label>
          <div className="flex gap-2 flex-wrap">
            {["easy","medium","hard","mixed"].map(d => (
              <button key={d} onClick={() => setCfg(c => ({ ...c, difficulty: d }))}
                className={"px-3 py-1.5 rounded-xl text-xs font-bold capitalize border-2 transition-colors " +
                  (cfg.difficulty === d ? "border-indigo-500 " + DIFF_COLORS[d] : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300")}>
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Time Limit</span>
          </div>
          <div className="flex items-center gap-3">
            {cfg.time_limit && (
              <select value={cfg.time_minutes} onChange={e => setCfg(c => ({ ...c, time_minutes: Number(e.target.value) }))}
                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                {[10,15,20,30,45,60].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            )}
            <button onClick={() => setCfg(c => ({ ...c, time_limit: !c.time_limit }))}
              className={"w-10 h-6 rounded-full transition-colors relative " + (cfg.time_limit ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-700")}>
              <div className={"w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform " + (cfg.time_limit ? "left-5" : "left-1")} />
            </button>
          </div>
        </div>
      </div>
      <button onClick={handleStart} disabled={loading}
        className={BTN_PRIMARY + " w-full justify-center mt-5"}>
        {loading ? <><Loader2 size={15} className="animate-spin" />Generating…</> : <><Sparkles size={15} />Start Practice</>}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   METHOD 2 — Syllabus Upload
═══════════════════════════════════════════ */
function SyllabusMethod({ onStart, loading }) {
  const [uploadState, setUploadState] = useState("idle");
  const [topics, setTopics] = useState([]);
  const [selTopics, setSelTopics] = useState([]);
  const [cfg, setCfg] = useState({ num_questions: 15, difficulty: "mixed" });
  const [newTopic, setNewTopic] = useState("");
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (max 5 MB)"); return; }
    setUploadState("parsing");
    try {
      const form = new FormData();
      form.append("syllabus", file);
      const r = await api.post("/student/practice/syllabus-extract", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const extracted = r.data.topics || [];
      setTopics(extracted);
      setSelTopics(extracted);
      setUploadState("topics");
    } catch {
      toast.error("Failed to extract topics. Try a plain text file.");
      setUploadState("idle");
    }
  };

  const toggleTopic = (t) => setSelTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const addTopic = () => {
    if (!newTopic.trim()) return;
    if (!topics.includes(newTopic.trim())) setTopics(prev => [...prev, newTopic.trim()]);
    if (!selTopics.includes(newTopic.trim())) setSelTopics(prev => [...prev, newTopic.trim()]);
    setNewTopic("");
  };

  const handleStart = () => {
    if (selTopics.length === 0) { toast.error("Select at least one topic"); return; }
    const title = `Syllabus Practice – ${selTopics.slice(0, 2).join(", ")}${selTopics.length > 2 ? "…" : ""}`;
    onStart({
      topic_ids: [],
      topic_names: selTopics,
      ...cfg,
      title,
      method: "syllabus",
      config: { topics: selTopics, difficulty: cfg.difficulty, count: cfg.num_questions },
    });
  };

  if (uploadState === "parsing") return (
    <div className="flex flex-col items-center py-12 gap-4">
      <Loader2 size={32} className="animate-spin text-indigo-500" />
      <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Extracting topics from your syllabus…</p>
    </div>
  );

  if (uploadState === "topics") return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Extracted Topics</p>
        <button onClick={() => { setUploadState("idle"); setTopics([]); setSelTopics([]); }}
          className="text-xs text-gray-400 hover:text-indigo-500">← Re-upload</button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3 max-h-40 overflow-y-auto">
        {topics.map(t => {
          const isSel = selTopics.includes(t);
          return (
            <button key={t} onClick={() => toggleTopic(t)}
              className={"text-xs px-3 py-1.5 rounded-full font-medium transition-colors border-2 " +
                (isSel ? "bg-indigo-500 text-white border-indigo-400" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300")}>
              {isSel ? "✓ " : ""}{t}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 mb-4">
        <input value={newTopic} onChange={e => setNewTopic(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTopic()}
          placeholder="Add a topic…"
          className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button onClick={addTopic} className="px-3 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 transition-colors">
          <Plus size={15} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {["10","15","20","30"].map(n => (
          <button key={n} onClick={() => setCfg(c => ({ ...c, num_questions: Number(n) }))}
            className={"px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors " +
              (cfg.num_questions === Number(n) ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300")}>
            {n} Qs
          </button>
        ))}
        {["easy","medium","hard","mixed"].map(d => (
          <button key={d} onClick={() => setCfg(c => ({ ...c, difficulty: d }))}
            className={"px-3 py-1.5 rounded-xl text-xs font-bold capitalize border-2 transition-colors " +
              (cfg.difficulty === d ? "border-indigo-500 " + DIFF_COLORS[d] : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300")}>
            {d}
          </button>
        ))}
      </div>
      <button onClick={handleStart} disabled={loading || selTopics.length === 0}
        className={BTN_PRIMARY + " w-full justify-center"}>
        {loading ? <><Loader2 size={15} className="animate-spin" />Generating…</> : <><Sparkles size={15} />Start Practice ({selTopics.length} topics)</>}
      </button>
    </div>
  );

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload your syllabus — AI extracts topics for a personalised quiz.</p>
      <div onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-2xl p-10 text-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors">
        <Upload size={32} className="text-indigo-400 mx-auto mb-3" />
        <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm mb-1">Click to upload your syllabus</p>
        <p className="text-xs text-gray-400">Supports PDF, DOCX, TXT — max 5 MB</p>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   METHOD 3 — Quick Practice
═══════════════════════════════════════════ */
function QuickMethod({ onStart, loading, sessions }) {
  const lastIncomplete = sessions.find(s => s.status === "in_progress");

  const actions = [
    {
      key: "continue",
      icon: Play,
      title: "Continue Last Session",
      desc: lastIncomplete ? `Resume: ${lastIncomplete.title || "Practice Session"}` : "No incomplete session",
      color: "from-indigo-500 to-purple-600",
      disabled: !lastIncomplete,
    },
    {
      key: "weak",
      icon: Target,
      title: "Practice Weakest Topic",
      desc: "AI picks your lowest-accuracy topic",
      color: "from-rose-500 to-pink-600",
      disabled: false,
    },
    {
      key: "random",
      icon: Shuffle,
      title: "Random Mixed Practice",
      desc: "20 random questions across all topics",
      color: "from-amber-500 to-orange-500",
      disabled: false,
    },
  ];

  const handleAction = (key) => {
    if (key === "continue" && lastIncomplete) {
      onStart(null, lastIncomplete.session_id);
      return;
    }
    if (key === "weak") {
      onStart({ quick: "weak", num_questions: 15, difficulty: "mixed", title: "Weakest Topic Practice", method: "quick", config: { quick_type: "weak" } });
      return;
    }
    onStart({ quick: "random", num_questions: 20, difficulty: "mixed", title: "Random Mixed Practice", method: "quick", config: { quick_type: "random" } });
  };

  return (
    <div className="space-y-3">
      {actions.map(a => (
        <button key={a.key} onClick={() => !a.disabled && handleAction(a.key)}
          disabled={a.disabled || loading}
          className={"w-full flex items-center gap-4 p-4 rounded-2xl text-left border-2 transition-all " +
            (a.disabled ? "opacity-40 cursor-not-allowed border-gray-100 dark:border-gray-800 " + C
              : "border-transparent bg-gradient-to-r " + a.color + " text-white hover:scale-[1.01] hover:shadow-lg")}>
          <div className={"w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 " + (a.disabled ? "bg-gray-100 dark:bg-gray-800" : "bg-white/20")}>
            <a.icon size={18} className={a.disabled ? "text-gray-400" : "text-white"} />
          </div>
          <div>
            <p className={"font-bold text-sm " + (a.disabled ? "text-gray-500 dark:text-gray-400" : "text-white")}>{a.title}</p>
            <p className={"text-xs mt-0.5 " + (a.disabled ? "text-gray-400" : "text-white/70")}>{a.desc}</p>
          </div>
          {loading && <Loader2 size={16} className="ml-auto animate-spin" />}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SESSION HISTORY CARD
═══════════════════════════════════════════ */
function SessionCard({ session, onOpen, onDelete, deleting }) {
  const isComplete = session.status === "completed";
  const pct = session.accuracy_percent || 0;
  const date = session.started_at
    ? new Date(session.started_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";
  const grad = { topic: "from-indigo-500 to-purple-600", syllabus: "from-emerald-500 to-teal-600", quick: "from-amber-500 to-orange-500" }[session.method] || "from-indigo-500 to-purple-600";

  return (
    <div className={"rounded-2xl overflow-hidden hover:shadow-md transition-all " + C}>
      <div className={"h-1 bg-gradient-to-r " + grad} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 line-clamp-2 leading-tight">{session.title || "Practice Session"}</p>
            <p className="text-xs text-gray-400 mt-0.5">{date}</p>
          </div>
          {isComplete ? (
            <div className={"flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br " + grad + " flex items-center justify-center"}>
              <span className="text-white font-black text-sm">{Math.round(pct)}</span>
            </div>
          ) : (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex-shrink-0">In Progress</span>
          )}
        </div>
        {isComplete && (
          <div className="flex gap-1.5 mb-3">
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              {session.score || 0} correct
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
              {session.total_questions || 0} total
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => onOpen(session)}
            className={"flex-1 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r hover:opacity-90 transition-opacity " + grad}>
            {isComplete ? "Review" : "Continue"}
          </button>
          <button onClick={() => onDelete(session.session_id)} disabled={deleting}
            className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors disabled:opacity-40">
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   QUIZ VIEW
═══════════════════════════════════════════ */
function QuizView({ session, onEnd }) {
  const questions = session?.questions || [];
  const [idx,       setIdx]       = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [feedback,  setFeedback]  = useState({});
  const [submitting,setSubmitting]= useState(false);
  const [timeLeft,  setTimeLeft]  = useState(
    session?.time_limit_minutes ? session.time_limit_minutes * 60 : null
  );

  useEffect(() => {
    if (!timeLeft) return;
    const t = setInterval(() => setTimeLeft(s => {
      if (s <= 1) { clearInterval(t); end(); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line

  const q = questions[idx];
  const rawOpts = q?.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : [];
  const opts = rawOpts.map((o, i) => [String.fromCharCode(65 + i), typeof o === "object" ? o.text || o : o]).filter(o => o[1]);
  const fb = feedback[idx];
  const chosen = answers[idx];

  const answer = async (optionKey) => {
    if (answers[idx] !== undefined) return;
    setAnswers(a => ({ ...a, [idx]: optionKey }));
    try {
      const r = await api.post("/student/practice/submit-answer", {
        session_id: session.session_id, question_id: q.question_id, selected_answer: optionKey
      });
      setFeedback(f => ({ ...f, [idx]: r.data }));
    } catch {}
  };

  const end = async () => {
    setSubmitting(true);
    try { const r = await api.post("/student/practice/end", { session_id: session.session_id }); onEnd(r.data); }
    catch { toast.error("Failed to finish session"); }
    setSubmitting(false);
  };

  const dl = (() => {
    if (!q?.difficulty) return "medium";
    return typeof q.difficulty === "number" ? (q.difficulty <= 2 ? "easy" : q.difficulty <= 3 ? "medium" : "hard") : q.difficulty;
  })();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 gap-3">
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Q {idx + 1} / {questions.length}</span>
        <div className="flex gap-1 flex-wrap flex-1 justify-center">
          {questions.map((_, i) => (
            <div key={i} className={"w-2 h-2 rounded-full transition-colors " +
              (answers[i] !== undefined ? (feedback[i]?.is_correct ? "bg-emerald-500" : "bg-red-400")
                : i === idx ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-700")} />
          ))}
        </div>
        {timeLeft !== null && (
          <span className={"text-sm font-bold tabular-nums " + (timeLeft < 60 ? "text-red-500" : "text-gray-500 dark:text-gray-400")}>
            {String(Math.floor(timeLeft / 60)).padStart(2,"0")}:{String(timeLeft % 60).padStart(2,"0")}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-5">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>
      <div className={"rounded-2xl border p-6 mb-4 " + C}>
        <span className={"text-xs font-semibold px-2 py-0.5 rounded-full mb-3 inline-block " + DIFF_COLORS[dl]}>{dl}</span>
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
                <span className="text-sm text-gray-700 dark:text-gray-200 flex-1">{text}</span>
                {chosen !== undefined && key === fb?.correct_answer && <CheckCircle2 size={16} className="ml-auto text-emerald-500 flex-shrink-0" />}
                {chosen !== undefined && key === chosen && !fb?.is_correct && <XCircle size={16} className="ml-auto text-red-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between gap-3">
        <button onClick={() => setIdx(i => i - 1)} disabled={idx === 0} className={BTN_OUTLINE}>Previous</button>
        {idx < questions.length - 1 ? (
          <button onClick={() => setIdx(i => i + 1)} disabled={answers[idx] === undefined} className={BTN_PRIMARY}>Next</button>
        ) : (
          <button onClick={end} disabled={submitting || questions.some((_, i) => answers[i] === undefined)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-opacity">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {submitting ? "Finishing…" : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   RESULT VIEW
═══════════════════════════════════════════ */
function ResultView({ result, sessionTitle, onRestart }) {
  const navigate = useNavigate();
  const [expandedIdx, setExpandedIdx] = useState(null);
  const score   = result?.accuracy_percent || 0;
  const total   = result?.total || 0;
  const correct = result?.score ?? 0;
  const wrong   = total - correct;
  const answers = result?.answers || [];

  const topicMap = {};
  for (const a of answers) {
    const t = a.topic_name || "General";
    if (!topicMap[t]) topicMap[t] = { correct: 0, total: 0 };
    topicMap[t].total++;
    if (a.is_correct) topicMap[t].correct++;
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">

      {/* ── Score card ── */}
      <div className={"rounded-2xl border p-6 " + C}>
        <div className="flex items-center gap-5 mb-5">
          <div className={"w-20 h-20 rounded-2xl bg-gradient-to-br flex-shrink-0 " +
            (score >= 80 ? "from-emerald-400 to-teal-500" : score >= 50 ? "from-indigo-500 to-purple-600" : "from-rose-500 to-pink-600") +
            " flex items-center justify-center shadow-lg"}>
            <span className="text-2xl font-black text-white">{Math.round(score)}<span className="text-sm font-bold">%</span></span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Practice Complete!</h2>
            <p className="text-sm text-gray-400 mt-0.5 truncate">{sessionTitle || "Great effort!"}</p>
            <p className={"text-xs font-semibold mt-2 " +
              (score >= 80 ? "text-emerald-600 dark:text-emerald-400" : score >= 50 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400")}>
              {score >= 80 ? "Excellent work! Strong grasp on this topic."
               : score >= 60 ? "Good job! A bit more practice will sharpen your skills."
               : score >= 40 ? "Keep going! Focus on the topics where you struggled."
               : "Don't give up! Review the explanations below and try again."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{correct}</p>
            <p className="text-xs text-gray-400">Correct</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-red-500 dark:text-red-400">{wrong}</p>
            <p className="text-xs text-gray-400">Wrong</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-gray-600 dark:text-gray-300">{total}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
        </div>

        {Object.keys(topicMap).length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Topic Breakdown</p>
            <div className="space-y-2">
              {Object.entries(topicMap).map(([topic, data]) => {
                const pct = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={topic}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-300 font-medium truncate">{topic}</span>
                      <span className="text-gray-400 flex-shrink-0 ml-2">{data.correct}/{data.total} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div className={"h-2 rounded-full transition-all " + (pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500")}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold hover:opacity-90">
            <RotateCcw size={14} />Practice Again
          </button>
          <button onClick={() => navigate("/student/reports")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
            <BarChart2 size={14} />See Full Report
          </button>
        </div>
      </div>

      {/* ── Question Review ── */}
      {answers.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 mb-3">Question Review</h3>
          <div className="space-y-3">
            {answers.map((a, i) => {
              const rawOpts = a.options
                ? (typeof a.options === "string" ? JSON.parse(a.options) : a.options)
                : [];
              const opts = rawOpts.map((o, j) => [String.fromCharCode(65 + j), typeof o === "object" ? o.text || o : o]);
              const isOpen = expandedIdx === i;

              return (
                <div key={a.question_id || i} className={"rounded-2xl border overflow-hidden transition-all " +
                  (a.is_correct ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-900")}>
                  {/* Header row — click to expand */}
                  <button onClick={() => setExpandedIdx(isOpen ? null : i)}
                    className={"w-full flex items-start gap-3 p-4 text-left " +
                      (a.is_correct ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-red-50 dark:bg-red-950/20")}>
                    <div className={"mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 " +
                      (a.is_correct ? "bg-emerald-500" : "bg-red-500")}>
                      {a.is_correct
                        ? <CheckCircle2 size={13} className="text-white" />
                        : <XCircle size={13} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-gray-400">Q{i + 1}</span>
                        {a.topic_name && <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">{a.topic_name}</span>}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug pr-4">{a.question_text}</p>
                    </div>
                    <div className={"flex-shrink-0 transition-transform mt-1 " + (isOpen ? "rotate-180" : "")}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded: options + explanation */}
                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-gray-900 space-y-4">
                      {/* Options */}
                      <div className="space-y-2">
                        {opts.map(([key, text]) => {
                          const isCorrect = key === a.correct_answer;
                          const isChosen  = key === a.selected_answer;
                          let cls = "border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500 opacity-60";
                          if (isCorrect) cls = "border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-gray-700 dark:text-gray-200";
                          else if (isChosen && !a.is_correct) cls = "border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-gray-700 dark:text-gray-200";
                          return (
                            <div key={key} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl " + cls}>
                              <span className={"w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 " +
                                (isCorrect ? "bg-emerald-500 text-white" : isChosen ? "bg-red-400 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500")}>
                                {key}
                              </span>
                              <span className="text-sm flex-1">{text}</span>
                              {isCorrect && <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />}
                              {isChosen && !a.is_correct && <XCircle size={15} className="text-red-400 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {a.explanation && (
                        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50 dark:bg-indigo-950/25 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                              <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                            </div>
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">Explanation</span>
                          </div>
                          <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{a.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function Practice() {
  const [method,     setMethod]     = useState("topic");
  const [view,       setView]       = useState("home");
  const [session,    setSession]    = useState(null);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [aiStep,     setAiStep]     = useState(-1);
  const [sessions,   setSessions]   = useState([]);
  const [sessLoading,setSessLoading]= useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadSessions = useCallback(async () => {
    setSessLoading(true);
    try {
      const r = await api.get("/student/practice/sessions");
      setSessions(r.data.sessions || []);
    } catch {}
    setSessLoading(false);
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleStart = async (cfg, resumeSessionId = null) => {
    if (resumeSessionId) {
      const sess = sessions.find(s => s.session_id === resumeSessionId);
      if (!sess) return;
      setLoading(true); setAiStep(0);
      const t1 = setTimeout(() => setAiStep(1), 600);
      const t2 = setTimeout(() => setAiStep(2), 1200);
      try {
        const cfgParsed = sess.config
          ? (typeof sess.config === "string" ? JSON.parse(sess.config) : sess.config)
          : {};
        const r = await api.post("/student/practice/start", {
          num_questions: sess.total_questions || 10,
          difficulty: cfgParsed.difficulty || "mixed",
          title: sess.title,
          method: sess.method || "quick",
          config: cfgParsed,
        });
        clearTimeout(t1); clearTimeout(t2);
        setSession({ ...r.data, title: sess.title });
        setView("quiz");
        loadSessions();
      } catch { toast.error("Failed to resume session"); }
      setLoading(false); setAiStep(-1);
      return;
    }

    setLoading(true); setAiStep(0);
    const t1 = setTimeout(() => setAiStep(1), 700);
    const t2 = setTimeout(() => setAiStep(2), 1400);
    try {
      const r = await api.post("/student/practice/start", cfg);
      clearTimeout(t1); clearTimeout(t2);
      setSession({ ...r.data, title: cfg.title });
      setView("quiz");
      loadSessions();
    } catch {
      clearTimeout(t1); clearTimeout(t2);
      toast.error("Failed to start practice. Please try again.");
    }
    setLoading(false); setAiStep(-1);
  };

  const handleEnd = useCallback((data) => {
    setResult(data);
    setView("result");
    loadSessions();
  }, [loadSessions]);

  const handleRestart = () => { setSession(null); setResult(null); setView("home"); };

  const handleDeleteSession = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/student/practice/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.session_id !== id));
      toast.success("Session deleted");
    } catch { toast.error("Failed to delete"); }
    setDeletingId(null);
  };

  const handleOpenSession = (sess) => {
    if (sess.status === "completed") {
      // Navigate to reports page
      window.location.href = "/student/reports";
      return;
    }
    handleStart(null, sess.session_id);
  };

  /* ── Quiz view ── */
  if (view === "quiz") return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-5 md:px-10 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center gap-3">
          <button onClick={() => { setView("home"); setSession(null); }}
            className="p-2 rounded-xl bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-colors flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{session?.title || "Practice"}</h1>
            <p className="text-white/60 text-xs">{session?.total} questions · AI-generated</p>
          </div>
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">
        <QuizView session={session} onEnd={handleEnd} />
      </div>
    </div>
  );

  /* ── Result view ── */
  if (view === "result") return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-5 md:px-10 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Session Results</h1>
            <p className="text-white/60 text-xs">Review your performance below</p>
          </div>
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">
        <ResultView result={result} sessionTitle={session?.title} onRestart={handleRestart} />
      </div>
    </div>
  );

  /* ── Home ── */
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + (parseFloat(s.accuracy_percent) || 0), 0) / sessions.length)
    : null;

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Practice Arena</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">AI-Powered Quiz</h1>
            <p className="text-white/70 text-sm mt-1.5">Adaptive questions tailored to your level</p>
          </div>
          <div className="hidden sm:flex gap-3 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-center min-w-[76px]">
              <p className="text-xl font-black text-white">{sessions.length}</p>
              <p className="text-white/60 text-xs mt-0.5">Sessions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 text-center min-w-[76px]">
              <p className="text-xl font-black text-white">
                {avgScore !== null ? <>{avgScore}<span className="text-sm font-bold">%</span></> : <span className="text-lg opacity-50">—</span>}
              </p>
              <p className="text-white/60 text-xs mt-0.5">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 p-5 md:p-8 space-y-6">
        {loading ? (
          <GeneratingOverlay steps={AI_STEPS} step={aiStep} />
        ) : (
          <>
            <div className={"rounded-2xl shadow-sm p-6 " + C}>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl w-full mb-5">
                {[
                  ["topic",    BookOpen, "Topic Based"],
                  ["syllabus", Upload,   "Syllabus Upload"],
                  ["quick",    Zap,      "Quick Practice"],
                ].map(([key, Icon, label]) => (
                  <button key={key} onClick={() => setMethod(key)}
                    className={"flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all " +
                      (method === key
                        ? "bg-white dark:bg-gray-700 shadow-md text-indigo-700 dark:text-indigo-300"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}>
                    <Icon size={13} />{label}
                  </button>
                ))}
              </div>
              {method === "topic"    && <TopicMethod    onStart={handleStart} loading={loading} />}
              {method === "syllabus" && <SyllabusMethod onStart={handleStart} loading={loading} />}
              {method === "quick"    && <QuickMethod    onStart={handleStart} loading={loading} sessions={sessions} />}
            </div>

            {sessLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[0,1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />)}
              </div>
            ) : sessions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-1 mb-4">
                  <BarChart3 size={14} className="text-indigo-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Past Sessions</h3>
                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{sessions.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sessions.map(s => (
                    <SessionCard key={s.session_id} session={s}
                      onOpen={handleOpenSession}
                      onDelete={handleDeleteSession}
                      deleting={deletingId === s.session_id} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

