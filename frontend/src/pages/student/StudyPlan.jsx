import { useEffect, useState } from "react";
import api from "../../services/api";
import { 
  CalendarDays, Sparkles, CheckCircle2, Circle, RefreshCw, 
  Lock, BookOpen, ExternalLink, ArrowLeft, Loader2, 
  Play, FileText, Check, AlertCircle, Award, ChevronRight, CheckSquare,
  Link as LinkIcon, Sigma, NotebookPen, PlayCircle, Zap, FlaskConical,
  Download, Target, TrendingUp, Clock
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Inline helpers (mirror StudyMaterials) ── */
function getYTId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/);
  return m ? m[1] : null;
}

function VideoThumbCard({ material }) {
  const vid = getYTId(material.file_url);
  const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
  const href = material.file_url?.startsWith('http') ? material.file_url
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(material.description || material.title)}`;
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="aspect-video relative group overflow-hidden bg-gray-900">
        {thumb ? (
          <img src={thumb} alt={material.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center px-4">
            <PlayCircle size={36} className="text-white/80 mb-2" />
            <p className="text-white/60 text-xs text-center line-clamp-2">{material.description}</p>
          </div>
        )}
        <a href={href} target="_blank" rel="noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all">
          <span className="flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl">
            <Play size={13} fill="currentColor" />{vid ? "Watch Video" : "Search YouTube"}
          </span>
        </a>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{material.title}</p>
        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{material.description}</p>
      </div>
    </div>
  );
}

function BulletCard({ title, content, icon: Icon, grad, borderCls }) {
  const [open, setOpen] = useState(true);
  const lines = (content || "").split("\n").filter(l => l.trim());
  const handleDownload = () => {
    const text = `${title}\n${'-'.repeat(50)}\n\n` + lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/[^a-z0-9_\s]/gi, "").trim().replace(/\s+/g,"_") + ".txt";
    a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <div className={"rounded-2xl border-2 overflow-hidden " + borderCls}>
      <div className={"flex items-center justify-between px-5 py-3.5 bg-gradient-to-r " + grad}>
        <div className="flex items-center gap-2.5">
          <Icon size={16} className="text-white" />
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} title="Download"
            className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
            <Download size={12} />
          </button>
          <button onClick={() => setOpen(o => !o)}
            className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
            <ChevronRight size={14} className={"transition-transform " + (open ? "rotate-90" : "")} />
          </button>
        </div>
      </div>
      {open && (
        <div className="p-5">
          {lines.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No content available.</p>
          ) : (
            <ul className="space-y-2">
              {lines.map((line, i) => {
                const text = line.replace(/^[•\-*]\s*/, "").trim();
                return text ? (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span>{text}</span>
                  </li>
                ) : null;
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";
const BTN_PRIMARY = "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 text-sm";
const BTN_OUTLINE = "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300 font-semibold px-5 py-2 rounded-xl transition-all text-sm disabled:opacity-50";

function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function StudyPlan() {
  const [plan, setPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Navigation views: "cards" → "detail" → "resources" / "quiz" / "quiz-result"
  const [mainView, setMainView] = useState("cards"); // "cards" | "detail"
  const [activeTask, setActiveTask] = useState(null);
  const [subView, setSubView]   = useState("list");  // "list" | "resources" | "quiz" | "quiz-result"

  // Resources state
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [generatingMaterials, setGeneratingMaterials] = useState(false);

  // Quiz state
  const [quizSession, setQuizSession] = useState(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizFeedback, setQuizFeedback] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/student/plan")
      .then(r => {
        const allPlans = r.data.plans || (r.data.plan ? [r.data.plan] : []);
        setPlans(allPlans);
        // Keep current plan selection if it still exists, otherwise default to most recent
        setPlan(prev => {
          if (prev) {
            const updated = allPlans.find(p => p.plan_id === prev.plan_id);
            if (updated) return updated;
          }
          return allPlans[0] || null;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Quiz Timer
  useEffect(() => {
    if (subView !== "quiz" || timeLeft === null) return;
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) {
          clearInterval(t);
          submitQuiz();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [subView, timeLeft]);

  const generate = async (topicId = null) => {
    setGenerating(true);
    try { 
      const r = await api.post("/student/plan/generate", topicId ? { topic_id: topicId } : {}); 
      toast.success(topicId ? "Targeted Study Plan generated!" : "Personalized Study Plan generated!");
      setPlan(r.data.plan || null);
      load();
      setMainView("detail"); // After generating, go straight to detail
      setSubView("list");
    } catch {
      toast.error("Failed to generate plan. Please try again.");
    }
    setGenerating(false);
  };

  const completeTask = async (taskId, refId = null) => {
    try {
      const r = await api.post(`/student/plan/tasks/${taskId}/complete`, { reference_id: refId });
      if (r.data.extended) {
        toast.success("Task completed! Additional advanced materials added to your plan.");
      } else {
        toast.success("Task marked complete!");
      }
      load();
      setActiveTask(null);
      setSubView("list"); // back to detail week list
    } catch {
      toast.error("Failed to complete task");
    }
  };

  // Click on a task to start it
  const handleTaskClick = async (task, index, isUnlocked) => {
    if (!isUnlocked) {
      toast.error("Complete previous day tasks to unlock this!");
      return;
    }
    if (task.is_completed) {
      // Completed, let them view again if study material
      if (task.task_type === "video") {
        loadTaskMaterials(task);
      } else {
        toast.info("Task already completed!");
      }
      return;
    }

    setActiveTask(task);
    if (task.task_type === "video") {
      loadTaskMaterials(task);
    } else {
      // Practice or test task
      startTaskQuiz(task);
    }
  };

  // Fetch materials for video task — always AI-generate (returns cached if exists)
  const loadTaskMaterials = async (task) => {
    setSubView("resources");
    setLoadingMaterials(true);
    setMaterials([]);
    try {
      // Step 1: Always call ai-generate — it returns cached if already generated
      setGeneratingMaterials(true);
      const genRes = await api.post("/student/materials/ai-generate", {
        subject_id: task.subject_id || "a0000000-0000-0000-0000-000000000001",
        topic_id: task.topic_id
      });
      const aiList = genRes.data.materials || [];
      setGeneratingMaterials(false);

      // Step 2: Also fetch admin-uploaded materials for this topic (link/pdf/video from admin)
      const adminRes = await api.get("/student/materials", { params: { topic_id: task.topic_id, limit: 20 } });
      const adminList = (adminRes.data.materials || []).filter(
        m => m.type !== "shortcut" && m.type !== "formula" && m.type !== "video"
      );

      // Merge: AI materials first, then admin-uploaded extras
      setMaterials([...aiList, ...adminList]);
    } catch (err) {
      toast.error("Failed to load study materials");
    } finally {
      setLoadingMaterials(false);
      setGeneratingMaterials(false);
    }
  };

  // Start quiz for practice/test task
  const startTaskQuiz = async (task) => {
    setSubView("quiz");
    setLoadingQuiz(true);
    setQuizSession(null);
    setQuizIdx(0);
    setQuizAnswers({});
    setQuizFeedback({});
    setQuizResult(null);

    const isTest = task.task_type === "test";
    const difficulty = task.description.includes("easy") ? "easy" : task.description.includes("medium") ? "medium" : "hard";

    try {
      const res = await api.post("/student/practice/start", {
        topic_ids: [task.topic_id],
        num_questions: 10,
        difficulty: difficulty,
        title: task.description,
        method: "topic",
        task_id: task.task_id
      });
      setQuizSession(res.data);
      setTimeLeft(isTest ? 20 * 60 : null); // 20 minutes limit for tests
    } catch {
      toast.error("Failed to start quiz session");
      setSubView("list");
      setActiveTask(null);
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Submit single answer
  const answerQuizQuestion = async (optionKey) => {
    if (!quizSession) return;
    const questions = quizSession.questions || [];
    const q = questions[quizIdx];
    
    setQuizAnswers(a => ({ ...a, [quizIdx]: optionKey }));
    
    try {
      const res = await api.post("/student/practice/submit-answer", {
        session_id: quizSession.session_id,
        question_id: q.question_id,
        selected_answer: optionKey
      });
      setQuizFeedback(f => ({ ...f, [quizIdx]: res.data }));
    } catch {}
  };

  // Submit complete quiz
  const submitQuiz = async () => {
    if (!quizSession || submittingQuiz) return;
    setSubmittingQuiz(true);
    try {
      const res = await api.post("/student/practice/end", { session_id: quizSession.session_id });
      setQuizResult(res.data);
      setSubView("quiz-result");
    } catch {
      toast.error("Failed to submit quiz");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Process details
  const tasks = plan?.tasks || [];
  const done = tasks.filter(t => t.is_completed).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  // Group tasks by week
  const weeks = {};
  tasks.forEach((task, idx) => {
    // Determine sequential unlocking
    let isUnlocked = false;
    if (idx === 0) {
      isUnlocked = true;
    } else {
      isUnlocked = tasks[idx - 1].is_completed === 1;
    }
    
    const weekNum = task.week_number || 1;
    if (!weeks[weekNum]) {
      weeks[weekNum] = {
        week_number: weekNum,
        topic_name: task.topic_name || "Study Focus",
        tasks: []
      };
    }
    weeks[weekNum].tasks.push({ ...task, originalIdx: idx, isUnlocked });
  });

  const weekList = Object.values(weeks).sort((a, b) => a.week_number - b.week_number);

  const nextTask = tasks.find(t => !t.is_completed);
  const totalWeeks = weekList.length;

  const STAT_CARDS = [
    { label: "Plan Duration", value: `${plan?.duration_weeks || totalWeeks || 0} Weeks`, icon: CalendarDays, grad: "from-blue-500 to-indigo-650" },
    { label: "Completed Tasks", value: `${done} Tasks`, icon: CheckCircle2, grad: "from-emerald-500 to-teal-600" },
    { label: "Pending Tasks", value: `${tasks.length - done} Tasks`, icon: Clock, grad: "from-orange-500 to-amber-500" },
    { label: "Progress", value: `${pct}%`, icon: Target, grad: "from-violet-500 to-purple-600" },
  ];

  /* ── RENDER ── */
  return (
    <div className="w-full min-h-full flex flex-col">

      {/* ── Header Banner ── */}
      <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Study Plan</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight truncate">
              {mainView === "cards"                   && "My Study Plans"}
              {mainView === "detail" && subView === "list"         && (plan?.name || `Your Learning Path`)}
              {mainView === "detail" && subView === "resources"    && `Resources: ${activeTask?.topic_name}`}
              {mainView === "detail" && subView === "quiz"         && `Quiz: ${activeTask?.topic_name}`}
              {mainView === "detail" && subView === "quiz-result"  && `Quiz Summary`}
            </h1>
            <p className="text-white/70 text-sm mt-1.5 truncate">
              {mainView === "cards"                   && "Your AI-generated personalized plans"}
              {mainView === "detail" && subView === "list"         && "AI-generated personal study plan"}
              {mainView === "detail" && subView === "resources"    && "Study resources for this topic"}
              {mainView === "detail" && subView === "quiz"         && `Day ${activeTask?.day_number} interactive practice quiz`}
              {mainView === "detail" && subView === "quiz-result"  && "Review score and solution patterns"}
            </p>
          </div>

          {/* Header right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Back button */}
            {mainView === "detail" && subView === "list" && (
              <button onClick={() => setMainView("cards")}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {mainView === "detail" && subView !== "list" && (
              <button onClick={() => { setActiveTask(null); setSubView("list"); }}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors">
                <ArrowLeft size={14} /> Back to Plan
              </button>
            )}
            {/* Generate / Regenerate */}
            {mainView === "cards" && (
              <button onClick={() => generate()} disabled={generating}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors disabled:opacity-60">
                {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {plan ? "Regenerate" : "Generate Plan"}
              </button>
            )}
            {mainView === "detail" && subView === "list" && (
              <button onClick={() => generate()} disabled={generating}
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors disabled:opacity-60">
                {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 p-5 md:p-8">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />
            ))}
          </div>

        ) : !plan ? (
          /* ── No Plan Yet ── */
          <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-14 text-center " + C}>
            <Sparkles size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No active study plan yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">Start a practice session first, or generate a fresh plan below</p>
            <button onClick={() => generate()} disabled={generating} className={BTN_PRIMARY + " mx-auto"}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Generate Personalized Study Plan
            </button>
          </div>

        ) : (
          <>
            {/* Stat cards only when in cards landing or in detail week list */}
            {((mainView === "cards") || (mainView === "detail" && subView === "list")) && (
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

            {mainView === "cards" ? (
          /* ── CARD VIEW (landing) ── */
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Target size={14} className="text-gray-400" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Plans</p>
              <span className="text-xs text-gray-400 ml-1">— click &quot;View Plan&quot; to open</span>
            </div>

          {/* The active plan card(s) */}
            {plans.length > 1 ? (
              /* ── Multiple plans: show list ── */
              <div className="space-y-4">
                {plans.map((p, idx) => {
                  const ptasks = p.tasks || [];
                  const pdone = ptasks.filter(t => t.is_completed).length;
                  const ppct = ptasks.length ? Math.round((pdone / ptasks.length) * 100) : 0;
                  const pWeeks = [...new Set(ptasks.map(t => t.week_number))].length;
                  const gradients = [
                    "from-emerald-500 to-teal-500",
                    "from-indigo-500 to-purple-500",
                    "from-orange-500 to-amber-500",
                    "from-rose-500 to-pink-500",
                  ];
                  const grad = gradients[idx % gradients.length];
                  return (
                    <div key={p.plan_id} className={"rounded-2xl border shadow-sm overflow-hidden " + C}>
                      <div className={"h-2 bg-gradient-to-r " + grad} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                              <span className="text-xs text-gray-400">{pWeeks} week{pWeeks !== 1 ? "s" : ""}</span>
                              {p.generated_at && <span className="text-xs text-gray-400">{new Date(p.generated_at).toLocaleDateString()}</span>}
                            </div>
                            <h2 className="text-base font-black text-gray-800 dark:text-gray-100 mt-1 truncate">{p.name || `Study Plan #${idx + 1}`}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{ptasks.length} tasks · {ppct}% completed</p>
                          </div>
                          <button
                            onClick={() => { setPlan(p); setSubView("list"); setMainView("detail"); }}
                            className={"flex-shrink-0 flex items-center gap-2 bg-gradient-to-r " + grad + " hover:opacity-90 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"}>
                            View <ChevronRight size={13} />
                          </button>
                        </div>
                        <div className="mt-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className={"h-1.5 rounded-full bg-gradient-to-r transition-all " + grad} style={{ width: `${ppct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
            /* ── Single plan card ── */
            <div className={"rounded-2xl border shadow-sm overflow-hidden " + C}>
              {/* Card top gradient bar */}
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Active Plan
                      </span>
                      <span className="text-xs text-gray-400">{totalWeeks} weeks</span>
                    </div>
                    <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 mt-1">{plan?.name || 'Personalized Study Plan'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {tasks.length} tasks across {totalWeeks} week{totalWeeks !== 1 ? "s" : ""} · AI-generated based on your weak areas
                    </p>
                  </div>
                  <button
                    onClick={() => { setSubView("list"); setMainView("detail"); }}
                    className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm">
                    View Plan <ChevronRight size={14} />
                  </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{pct}%</p>
                    <p className="text-xs text-gray-400 mt-0.5">Completed</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{done}/{tasks.length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tasks Done</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
                    <p className="text-xl font-black text-purple-600 dark:text-purple-400">{totalWeeks}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Weeks</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-gray-500">Overall Progress</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Next task preview */}
                {nextTask && (
                  <div className="mt-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={13} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-indigo-500 font-bold uppercase tracking-wide">Next Up · Day {nextTask.day_number}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{nextTask.description}</p>
                    </div>
                    <button
                      onClick={() => { setSubView("list"); setMainView("detail"); }}
                      className="ml-auto flex-shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                      Open <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>

        ) : (
          /* ── DETAIL VIEW (week-by-week) ── */
          <>
            {/* Overall study plan list */}
            {subView === "list" && (
              <div className="space-y-6">
                {/* Progress bar card */}
                <div className={"rounded-2xl border p-5 " + C}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Overall Progress</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
                    <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{done} of {tasks.length} tasks completed</p>
                </div>

                {/* Weeks Listing */}
                <div className="space-y-6">
                  {weekList.map(week => (
                    <div key={week.week_number} className={"rounded-2xl border overflow-hidden " + C}>
                      {/* Week Header */}
                      <div className="bg-gray-50/50 dark:bg-gray-800/20 px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Week {week.week_number}
                          </span>
                          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mt-1.5">
                            {week.topic_name}
                          </h2>
                        </div>
                      </div>

                      {/* Day Tasks Timeline */}
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {week.tasks.map((task, tIdx) => {
                          const isNextUp = task.isUnlocked && !task.is_completed;
                          return (
                            <div 
                              key={task.task_id}
                              onClick={() => handleTaskClick(task, task.originalIdx, task.isUnlocked)}
                              className={`flex items-center gap-4 p-5 transition-all cursor-pointer select-none group ${
                                task.is_completed 
                                  ? "bg-gray-50/30 dark:bg-gray-900/10 opacity-75"
                                  : task.isUnlocked
                                    ? "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-850"
                                    : "bg-gray-50/40 dark:bg-gray-900/20 opacity-50 cursor-not-allowed"
                              }`}
                            >
                              {/* Left Icon (Checkbox, Circle, or Locked) */}
                              <div className="flex-shrink-0">
                                {task.is_completed ? (
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                                    <Check className="text-emerald-600 dark:text-emerald-400" size={13} strokeWidth={3} />
                                  </div>
                                ) : !task.isUnlocked ? (
                                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-650">
                                    <Lock size={12} />
                                  </div>
                                ) : isNextUp ? (
                                  <div className="w-6 h-6 rounded-full border-2 border-indigo-500 dark:border-indigo-400 flex items-center justify-center relative">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-700" />
                                )}
                              </div>

                              {/* Center Meta */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-semibold ${
                                    task.is_completed
                                      ? "text-gray-400"
                                      : isNextUp
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-gray-500"
                                  }`}>
                                    Day {task.day_number}
                                  </span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-250 dark:bg-gray-750" />
                                  <span className="text-xs text-gray-400 font-medium">~{task.estimated_minutes} min</span>
                                </div>
                                <p className={`text-sm font-semibold mt-1 ${
                                  task.is_completed
                                    ? "line-through text-gray-400 dark:text-gray-550"
                                    : "text-gray-800 dark:text-gray-150 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                                }`}>
                                  {task.description}
                                </p>
                              </div>

                              {/* Right Icon/Button */}
                              <div className="flex-shrink-0 text-gray-400">
                                {task.is_completed ? (
                                  <span className="text-xs font-bold text-gray-400">Completed</span>
                                ) : !task.isUnlocked ? (
                                  <span className="text-xs text-gray-400 flex items-center gap-0.5"><Lock size={10} /> Locked</span>
                                ) : (
                                  <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity">
                                    {task.task_type === "video" ? "Watch Lectures" : "Start Quiz"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inline Resources Viewer */}
            {subView === "resources" && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full uppercase">
                    Topic Material
                  </span>
                  <span className="text-sm font-medium text-gray-400">Day {activeTask?.day_number} Study Module</span>
                </div>

                <div className={"rounded-2xl p-6 " + C}>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {activeTask?.description}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Learn the foundational concepts, formulas, and shortcut tricks below before attempting tests.
                  </p>
                </div>

                {loadingMaterials ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                    <p className="text-sm text-gray-400 font-medium">Fetching learning resources...</p>
                  </div>
                ) : generatingMaterials ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-gray-800/20 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <Sparkles className="animate-pulse text-amber-500 mb-3" size={36} />
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-bold">Generating Study Resources via AI...</p>
                    <p className="text-xs text-gray-400 mt-1">Creating custom videos, shortcut tricks & formula sheets. Please wait...</p>
                  </div>
                ) : materials.length === 0 ? (
                  <div className="p-8 text-center text-gray-450">
                    No resources found for this topic.
                  </div>
                ) : (
                  (() => {
                    const videos     = materials.filter(m => m.type === "video");
                    const shortcuts  = materials.find(m => m.type === "shortcut");
                    const formulas   = materials.find(m => m.type === "formula");
                    const adminNotes = materials.filter(m => m.type === "pdf" || m.type === "doc" || m.type === "ppt");
                    const adminLinks = materials.filter(m => m.type === "link");
                    return (
                      <div className="space-y-6">

                        {/* ── 3 Video Thumbnail Cards ── */}
                        {videos.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2.5 mb-3">
                              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center">
                                <PlayCircle size={15} className="text-white" />
                              </div>
                              <h3 className="font-bold text-gray-800 dark:text-gray-100">Video Tutorials</h3>
                              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{videos.length} videos</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {videos.map(v => <VideoThumbCard key={v.material_id} material={v} />)}
                            </div>
                          </div>
                        )}

                        {/* ── Shortcuts + Formulas bullet cards ── */}
                        {(shortcuts || formulas) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {shortcuts && (
                              <BulletCard
                                title={shortcuts.title}
                                content={shortcuts.description}
                                icon={Zap}
                                grad="from-amber-500 to-orange-500"
                                borderCls="border-amber-200 dark:border-amber-800"
                              />
                            )}
                            {formulas && (
                              <BulletCard
                                title={formulas.title}
                                content={formulas.description}
                                icon={FlaskConical}
                                grad="from-rose-500 to-pink-600"
                                borderCls="border-rose-200 dark:border-rose-900"
                              />
                            )}
                          </div>
                        )}

                        {/* ── Admin-uploaded Notes ── */}
                        {adminNotes.length > 0 && (
                          <div className={"rounded-2xl border overflow-hidden " + C}>
                            <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
                                <NotebookPen size={14} className="text-orange-500" />
                              </div>
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Notes & Documents</span>
                              <span className="text-[10px] text-indigo-500 font-bold ml-1">(from admin)</span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              {adminNotes.map(m => (
                                <div key={m.material_id} className="flex items-center gap-3 px-4 py-3.5">
                                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center flex-shrink-0">
                                    <FileText size={15} className="text-orange-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{m.title}</p>
                                    {m.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.description}</p>}
                                  </div>
                                  {m.file_url && m.file_url !== '#' && (
                                    <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors">
                                      <ExternalLink size={11} /> Open Notes
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Admin-uploaded Formula / External Links ── */}
                        {adminLinks.length > 0 && (
                          <div className={"rounded-2xl border overflow-hidden " + C}>
                            <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                                <Sigma size={14} className="text-indigo-500" />
                              </div>
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Formula Sheets & Quick References</span>
                              <span className="text-[10px] text-indigo-500 font-bold ml-1">(from admin)</span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                              {adminLinks.map(m => (
                                <div key={m.material_id} className="flex items-center gap-3 px-4 py-3.5">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
                                    <LinkIcon size={15} className="text-indigo-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{m.title}</p>
                                    {m.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.description}</p>}
                                  </div>
                                  {m.file_url && m.file_url !== '#' && (
                                    <a href={m.file_url} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg transition-colors">
                                      <ExternalLink size={11} /> Open Link
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })()
                )}

                {/* Bottom Complete Button */}
                {!activeTask?.is_completed && (
                  <div className="pt-4 flex justify-end">
                    <button 
                      onClick={() => completeTask(activeTask?.task_id)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                      <CheckSquare size={16} /> Mark Day Task as Completed
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quiz view */}
            {subView === "quiz" && (
              <div className="max-w-3xl mx-auto space-y-6">
                {loadingQuiz ? (
                  <div className="flex flex-col items-center justify-center p-16 text-center">
                    <Loader2 className="animate-spin text-indigo-500 mb-2" size={32} />
                    <p className="text-sm text-gray-400 font-semibold">Generating quiz questions...</p>
                  </div>
                ) : !quizSession ? (
                  <div className="p-8 text-center text-red-500">Failed to load quiz questions.</div>
                ) : (
                  (() => {
                    const questions = quizSession.questions || [];
                    const q = questions[quizIdx];
                    if (!q) return null;

                    const rawOpts = q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : [];
                    const opts = rawOpts.map((o, i) => [String.fromCharCode(65 + i), typeof o === "object" ? o.text || o : o]).filter(o => o[1]);
                    
                    const chosen = quizAnswers[quizIdx];
                    const fb = quizFeedback[quizIdx];

                    return (
                      <div className="space-y-4">
                        {/* Quiz Header Info */}
                        <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-150 dark:border-gray-800">
                          <span className="text-xs font-bold text-gray-450 uppercase">Question {quizIdx + 1} of {questions.length}</span>
                          
                          {/* Dot progression indicators */}
                          <div className="flex gap-1 flex-1 justify-center max-w-[200px] sm:max-w-[300px]">
                            {questions.map((_, i) => (
                              <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  quizAnswers[i] !== undefined 
                                    ? (quizFeedback[i]?.is_correct ? "bg-emerald-500" : "bg-red-400")
                                    : i === quizIdx 
                                      ? "bg-indigo-500 animate-pulse" 
                                      : "bg-gray-250 dark:bg-gray-750"
                                }`} 
                              />
                            ))}
                          </div>

                          {timeLeft !== null && (
                            <span className={`text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg ${timeLeft < 60 ? "bg-red-150 text-red-600 dark:bg-red-950/40 animate-pulse" : "bg-gray-100 dark:bg-gray-850 text-gray-500 dark:text-gray-400"}`}>
                              Timer: {String(Math.floor(timeLeft / 60)).padStart(2,"0")}:{String(timeLeft % 60).padStart(2,"0")}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${((quizIdx + 1) / questions.length) * 100}%` }} />
                        </div>

                        {/* Question Card */}
                        <div className={"rounded-2xl border p-6 " + C}>
                          <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider mb-3 inline-block">
                            Practice Area Quiz
                          </span>
                          <p className="text-base font-semibold text-gray-800 dark:text-gray-100 leading-relaxed mb-6">
                            {q.question_text}
                          </p>

                          {/* Options */}
                          <div className="space-y-3">
                            {opts.map(([key, text]) => {
                              let cls = "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-650 bg-white dark:bg-gray-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20";
                              if (chosen !== undefined) {
                                if (key === fb?.correct_answer) {
                                  cls = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 dark:border-emerald-600 text-emerald-800 dark:text-emerald-450";
                                } else if (key === chosen && !fb?.is_correct) {
                                  cls = "border-red-500 bg-red-50/50 dark:bg-red-950/40 dark:border-red-600 text-red-800 dark:text-red-450";
                                } else {
                                  cls = "border-gray-100 dark:border-gray-850 bg-white dark:bg-gray-900/20 opacity-50";
                                }
                              }

                              return (
                                <button
                                  key={key}
                                  onClick={() => answerQuizQuestion(key)}
                                  disabled={chosen !== undefined}
                                  className={"w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all " + cls}
                                >
                                  <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                                    {key}
                                  </span>
                                  <span className="text-sm font-medium flex-1">{text}</span>
                                  {chosen !== undefined && key === fb?.correct_answer && (
                                    <CheckCircle2 size={16} className="ml-auto text-emerald-500 flex-shrink-0" />
                                  )}
                                  {chosen !== undefined && key === chosen && !fb?.is_correct && (
                                    <div className="ml-auto w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">✗</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation Pane */}
                          {chosen !== undefined && fb?.explanation && (
                            <div className="mt-5 p-4 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30 text-xs text-gray-500 dark:text-gray-400">
                              <p className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">Explanation:</p>
                              <p className="leading-relaxed">{fb.explanation}</p>
                            </div>
                          )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between gap-3">
                          <button 
                            onClick={() => setQuizIdx(i => i - 1)} 
                            disabled={quizIdx === 0} 
                            className={BTN_OUTLINE}
                          >
                            Previous
                          </button>
                          {quizIdx < questions.length - 1 ? (
                            <button 
                              onClick={() => setQuizIdx(i => i + 1)} 
                              disabled={chosen === undefined} 
                              className={BTN_PRIMARY}
                            >
                              Next Question <ChevronRight size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={submitQuiz} 
                              disabled={submittingQuiz || questions.some((_, i) => quizAnswers[i] === undefined)}
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50 text-sm flex items-center gap-1.5"
                            >
                              {submittingQuiz ? <Loader2 size={14} className="animate-spin" /> : <Award size={14} />}
                              Submit & View Results
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Quiz Result view */}
            {subView === "quiz-result" && quizResult && (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className={"rounded-2xl border p-6 " + C}>
                  <div className="flex flex-col items-center text-center p-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                      quizResult.accuracy_percent >= 50
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-450"
                        : "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-450"
                    }`}>
                      <Award size={36} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                      {quizResult.accuracy_percent >= 50 ? "Quiz Successfully Cleared!" : "Need More Practice"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Quiz: {activeTask?.description}</p>
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-4">
                      {quizResult.accuracy_percent}% <span className="text-xs font-bold text-gray-400">accuracy</span>
                    </p>

                    {/* Auto-extension info warning */}
                    {activeTask?.task_type === "test" && quizResult.accuracy_percent < 50 && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/40 text-left">
                        <AlertCircle className="text-amber-500 flex-shrink-0" size={16} />
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-normal">
                          <strong>Study Plan Extended:</strong> Since the score is below 50% on this re-evaluation test, your plan has auto-extended with Advanced Lectures & Practice modules.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-gray-100 dark:border-gray-800 pt-6 mt-4">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{quizResult.score} / {quizResult.total}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Correct Questions</p>
                    </div>
                    <div className="text-center border-x border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{Math.round(quizResult.time_taken_seconds / 60)} min</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Time Spent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-emerald-500">{quizResult.accuracy_percent >= 50 ? "Pass" : "Retry Required"}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Verdict Status</p>
                    </div>
                  </div>
                </div>

                {/* Questions detailed review */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Solution Keys & Explanations</h3>
                  <div className="space-y-3">
                    {(quizResult.answers || []).map((ans, aIdx) => (
                      <div 
                        key={aIdx} 
                        className={`rounded-xl border p-4 ${
                          ans.is_correct 
                            ? "border-emerald-100 dark:border-emerald-950 bg-emerald-50/10 dark:bg-emerald-950/5" 
                            : "border-red-150 dark:border-red-950 bg-red-50/10 dark:bg-red-950/5"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                            ans.is_correct ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950" : "bg-red-100 text-red-600 dark:bg-red-950"
                          }`}>
                            {ans.is_correct ? "✓" : "✗"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-relaxed">{ans.question_text}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                              <p className="text-gray-500">Your choice: <span className={ans.is_correct ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{ans.selected_answer}</span></p>
                              {!ans.is_correct && <p className="text-gray-500">Correct: <span className="text-emerald-500 font-bold">{ans.correct_answer}</span></p>}
                            </div>
                            {ans.explanation && (
                              <p className="text-xs text-gray-400 mt-2 bg-gray-50/50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">{ans.explanation}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Done navigation button */}
                <div className="pt-4 flex justify-end">
                  {activeTask?.task_type === "test" && quizResult.accuracy_percent < 50 ? (
                    <button 
                      onClick={() => startTaskQuiz(activeTask)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                      <RefreshCw size={14} /> Retake Test
                    </button>
                  ) : (
                    <button 
                      onClick={() => completeTask(activeTask?.task_id, quizSession.session_id)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                      Finish Task & Unlock Next Day
                    </button>
                  )}
                </div>
              </div>
            )}
          </>)}
        </>
      )}
      </div>
    </div>
  );
}
