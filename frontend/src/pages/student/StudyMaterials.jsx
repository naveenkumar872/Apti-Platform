import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Play, FileText, ExternalLink, StickyNote,
  Search, X, Zap, FlaskConical, ChevronDown, Sparkles,
  CheckCircle, BookOpen, Trash2, PlayCircle, Lightbulb,
  ChevronRight, Loader2, RefreshCw, Download, BookMarked
} from "lucide-react";

const SUBJECTS = [
  { subject_id: "00000000-0000-0000-0000-000000000001", name: "Quantitative Aptitude" },
  { subject_id: "00000000-0000-0000-0000-000000000002", name: "Logical Reasoning" },
  { subject_id: "00000000-0000-0000-0000-000000000003", name: "Verbal Ability" },
  { subject_id: "00000000-0000-0000-0000-000000000004", name: "Data Interpretation" },
];
const SUBJECT_COLORS = [
  { grad: "from-violet-600 to-purple-700" },
  { grad: "from-blue-600 to-cyan-600" },
  { grad: "from-emerald-500 to-teal-600" },
  { grad: "from-orange-500 to-amber-500" },
];
const pal = (idx) => SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
const CARD = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";
const INPUT = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors";

/* -- PDF Modal -- */
function PdfModal({ url, title, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-2 text-white">
            <FileText size={16} />
            <span className="font-semibold text-sm truncate max-w-xs">{title}</span>
          </div>
          <div className="flex gap-2">
            <a href={url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><ExternalLink size={14} /></a>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><X size={14} /></button>
          </div>
        </div>
        <iframe src={url} className="flex-1 w-full" title={title} />
      </div>
    </div>
  );
}

/* -- Expandable content card with download -- */
function ContentCard({ title, content, icon: Icon, grad, borderCls, deleting, onDelete }) {
  const [open, setOpen] = useState(true);
  const lines = (content || "").split("\n").filter(l => l.trim());

  const handleDownload = () => {
    const text = `${title}\n${"-".repeat(50)}\n\n` +
      lines.map(l => l.replace(/^[â€¢\-*]\s*/, "â€¢ ")).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/[^a-z0-9_\s]/gi, "").trim().replace(/\s+/g, "_") + ".txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className={"rounded-2xl border-2 overflow-hidden " + borderCls}>
      <div className={"flex items-center justify-between px-5 py-3.5 bg-gradient-to-r " + grad}>
        <div className="flex items-center gap-2.5">
          <Icon size={17} className="text-white" />
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} title="Download as text"
            className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
            <Download size={13} />
          </button>
          <button onClick={() => setOpen(o => !o)}
            className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
            <ChevronRight size={15} className={"transition-transform " + (open ? "rotate-90" : "")} />
          </button>
          <button onClick={onDelete} disabled={deleting}
            className="p-1 rounded-lg bg-white/20 hover:bg-red-400/60 text-white transition-colors disabled:opacity-40">
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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
                const text = line.replace(/^[â€¢\-*]\s*/, "").trim();
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

/* -- Video card: shows real thumbnail when URL is a watch link -- */
function VideoCard({ material, onDelete, deleting }) {
  let videoId = null;
  try {
    if (material.file_url?.includes("watch?v="))
      videoId = new URL(material.file_url).searchParams.get("v");
  } catch {}
  const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  return (
    <div className={"rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all " + CARD}>
      <div className="aspect-video relative group overflow-hidden bg-gray-900">
        {thumbnail ? (
          <img src={thumbnail} alt={material.title}
            className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center px-4">
            <PlayCircle size={36} className="text-white/80 mb-2" />
            <p className="text-white/60 text-xs text-center line-clamp-2">{material.description}</p>
          </div>
        )}
        <a href={material.file_url} target="_blank" rel="noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all">
          <span className="flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg">
            <Play size={14} fill="currentColor" />
            {videoId ? "Watch Video" : "Search YouTube"}
          </span>
        </a>
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{material.title}</p>
          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{material.description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <a href={material.file_url} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            <ExternalLink size={13} />
          </a>
          <button onClick={onDelete} disabled={deleting}
            className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors disabled:opacity-40">
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -- Expanded content for a generated topic -- */
function GeneratedView({ item, palette, onMaterialsUpdate, onRegenerate, regenerating }) {
  const { context, materials } = item;
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/student/materials/${id}`);
      onMaterialsUpdate(item.key, materials.filter(m => m.material_id !== id));
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setDeletingId(null);
    }
  };

  const videos    = materials.filter(m => m.type === "video");
  const shortcuts = materials.find(m => m.type === "shortcut");
  const formulas  = materials.find(m => m.type === "formula");

  return (
    <div className="space-y-8 pt-2">
      {/* Banner */}
      <div className={"rounded-2xl p-5 text-white bg-gradient-to-r " + palette.grad}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Study Materials</p>
            <h2 className="text-xl font-bold">{context.conceptName || context.topicName}</h2>
            <p className="text-white/60 text-sm mt-0.5">
              {context.subjectName}{context.conceptName ? ` â€º ${context.topicName}` : ""}
            </p>
          </div>
          <button onClick={onRegenerate} disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
            {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Regenerate
          </button>
        </div>
      </div>

      {/* Videos */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center">
            <PlayCircle size={15} className="text-white" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Video Tutorials</h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {videos.length} videos
          </span>
        </div>
        {videos.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900 p-10 text-center">
            <PlayCircle size={28} className="text-red-300 mx-auto mb-2" />
            <p className="text-sm text-red-400">No videos â€” try regenerating.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(v => (
              <VideoCard key={v.material_id} material={v}
                deleting={deletingId === v.material_id}
                onDelete={() => handleDelete(v.material_id)} />
            ))}
          </div>
        )}
      </div>

      {/* Shortcuts + Formulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {shortcuts && (
          <ContentCard
            title={shortcuts.title} content={shortcuts.description}
            icon={Zap} grad="from-amber-500 to-orange-500"
            borderCls="border-amber-200 dark:border-amber-800"
            deleting={deletingId === shortcuts.material_id}
            onDelete={() => handleDelete(shortcuts.material_id)}
          />
        )}
        {formulas && (
          <ContentCard
            title={formulas.title} content={formulas.description}
            icon={FlaskConical} grad="from-rose-500 to-pink-600"
            borderCls="border-rose-200 dark:border-rose-900"
            deleting={deletingId === formulas.material_id}
            onDelete={() => handleDelete(formulas.material_id)}
          />
        )}
      </div>

      {/* Mark learned */}
      <div className={"rounded-2xl p-4 flex items-center gap-4 " + CARD}>
        <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center " + palette.grad}>
          <CheckCircle size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Done studying this topic?</p>
          <p className="text-xs text-gray-400">Mark it as learned to track your progress.</p>
        </div>
        <button onClick={async () => {
          try {
            const id = context.concept_id || context.topic_id;
            if (id) await api.post(`/student/materials/${id}/mark-learned`);
            toast.success("Marked as learned!");
          } catch {}
        }} className={"px-4 py-2 rounded-xl text-white text-sm font-semibold bg-gradient-to-r hover:opacity-90 transition-opacity " + palette.grad}>
          Mark Learned
        </button>
      </div>
    </div>
  );
}

/* -- History topic pill/card -- */
function HistoryCard({ item, active, onClick }) {
  const palette = pal(item.paletteIdx);
  return (
    <button onClick={onClick}
      className={"w-full text-left rounded-2xl p-4 border-2 transition-all hover:-translate-y-0.5 " +
        (active
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-md"
          : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm")}>
      <span className={"inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 text-white bg-gradient-to-r " + palette.grad}>
        {item.context.subjectName}
      </span>
      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight">
        {item.context.conceptName || item.context.topicName}
      </p>
      {item.context.conceptName && (
        <p className="text-xs text-gray-400 mt-0.5">{item.context.topicName}</p>
      )}
      <div className="flex items-center gap-2 mt-2.5">
        <span className="text-xs text-gray-400">{item.materials.length} resource{item.materials.length !== 1 ? "s" : ""}</span>
        {active && <span className="text-xs font-semibold text-indigo-500 ml-auto">Viewing ?</span>}
      </div>
    </button>
  );
}

/* =====================================================================
   MAIN
===================================================================== */
export default function StudyMaterials() {
  const [tab, setTab] = useState("materials");
  const [selSubject, setSelSubject] = useState("");
  const [selTopic,   setSelTopic]   = useState("");
  const [selConcept, setSelConcept] = useState("");
  const [topics,        setTopics]        = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [concepts,        setConcepts]        = useState([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);

  // Generated history: [{key, context, materials, paletteIdx}]
  const [generatedHistory, setGeneratedHistory] = useState([]);
  const [activeKey,        setActiveKey]        = useState(null);
  const [generating,       setGenerating]       = useState(false);
  const [regeneratingKey,  setRegeneratingKey]  = useState(null);

  const [notes,        setNotes]        = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSearch,   setNoteSearch]   = useState("");
  const [pdfModal,     setPdfModal]     = useState(null);

  const subjectIdx  = SUBJECTS.findIndex(s => s.subject_id === selSubject);
  const subjectName = SUBJECTS.find(s => s.subject_id === selSubject)?.name || "";
  const topicName   = topics.find(t => t.topic_id === selTopic)?.name || "";
  const conceptName = concepts.find(c => c.concept_id === selConcept)?.name || "";
  const palette     = pal(subjectIdx < 0 ? 0 : subjectIdx);

  const makeKey = (tid, cid) => `${tid}_${cid || "all"}`;
  const activeItem = generatedHistory.find(h => h.key === activeKey) || null;

  useEffect(() => {
    setSelTopic(""); setSelConcept(""); setTopics([]); setConcepts([]);
    if (!selSubject) return;
    setTopicsLoading(true);
    api.get("/student/smart-topics", { params: { subject_id: selSubject } })
      .then(r => setTopics(r.data.topics || []))
      .catch(() => toast.error("Failed to load topics"))
      .finally(() => setTopicsLoading(false));
  }, [selSubject]);

  useEffect(() => {
    setSelConcept(""); setConcepts([]);
    if (!selTopic) return;
    setConceptsLoading(true);
    api.get("/student/smart-concepts", { params: { topic_id: selTopic } })
      .then(r => setConcepts(r.data.concepts || []))
      .catch(() => {})
      .finally(() => setConceptsLoading(false));
  }, [selTopic]);

  useEffect(() => {
    if (tab !== "notes") return;
    setNotesLoading(true);
    api.get("/student/notes")
      .then(r => setNotes(r.data.notes || []))
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setNotesLoading(false));
  }, [tab]);

  const handleMaterialsUpdate = useCallback((key, newMats) => {
    setGeneratedHistory(prev =>
      prev.map(item => item.key === key ? { ...item, materials: newMats } : item)
    );
  }, []);

  const doGenerate = async (forceNew = false, targetKey = null) => {
    if (!selSubject || !selTopic) { toast.error("Select a subject and topic first"); return; }
    const key = targetKey || makeKey(selTopic, selConcept);
    if (forceNew) {
      setRegeneratingKey(key);
      const old = generatedHistory.find(h => h.key === key);
      if (old) {
        await Promise.all(old.materials.map(m =>
          api.delete(`/student/materials/${m.material_id}`).catch(() => {})
        ));
      }
    } else {
      setGenerating(true);
    }
    try {
      const body = { subject_id: selSubject, topic_id: selTopic, ...(selConcept ? { concept_id: selConcept } : {}) };
      const r = await api.post("/student/materials/ai-generate", body);
      const newItem = {
        key,
        context: { subjectName, topicName, conceptName, subject_id: selSubject, topic_id: selTopic, concept_id: selConcept },
        materials: r.data.materials || [],
        paletteIdx: subjectIdx < 0 ? 0 : subjectIdx,
      };
      setGeneratedHistory(prev => [newItem, ...prev.filter(h => h.key !== key)]);
      setActiveKey(key);
      if (r.data.source === "ai") toast.success("Content generated and saved!");
    } catch {
      toast.error("Failed to generate materials");
    } finally {
      setGenerating(false);
      setRegeneratingKey(null);
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
    (n.subject_name || "").toLowerCase().includes(noteSearch.toLowerCase()) ||
    (n.teacher_name || "").toLowerCase().includes(noteSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Study Materials</h1>
          <p className="text-sm text-gray-400 mt-0.5">Choose a subject then topic then concept â€” AI generates videos, shortcuts &amp; formulas.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mb-6">
          {[["materials", BookOpen, "Study Materials"], ["notes", StickyNote, "Teacher Notes"]].map(([key, Icon, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={"flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all " +
                (tab === key ? "bg-white dark:bg-gray-700 shadow text-indigo-700 dark:text-indigo-300" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200")}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {/* -- MATERIALS TAB -- */}
        {tab === "materials" && (
          <div className="space-y-6">
            {/* Choose Level */}
            <div className={"rounded-2xl shadow-sm p-6 " + CARD}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Choose Level</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select value={selSubject} onChange={e => setSelSubject(e.target.value)}
                      className={INPUT + " pr-9 appearance-none cursor-pointer"}>
                      <option value="">-- Select Subject --</option>
                      {SUBJECTS.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Topic {topicsLoading && <Loader2 size={11} className="inline ml-1 animate-spin text-indigo-400" />}
                  </label>
                  <div className="relative">
                    <select value={selTopic} onChange={e => setSelTopic(e.target.value)}
                      disabled={!selSubject || topicsLoading}
                      className={INPUT + " pr-9 appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"}>
                      <option value="">-- Select Topic --</option>
                      {topics.map(t => <option key={t.topic_id} value={t.topic_id}>{t.name}</option>)}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Concept <span className="text-gray-300 dark:text-gray-600 font-normal">(optional)</span>
                    {conceptsLoading && <Loader2 size={11} className="inline ml-1 animate-spin text-indigo-400" />}
                  </label>
                  <div className="relative">
                    <select value={selConcept} onChange={e => setSelConcept(e.target.value)}
                      disabled={!selTopic || conceptsLoading}
                      className={INPUT + " pr-9 appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"}>
                      <option value="">-- All Concepts --</option>
                      {concepts.map(c => <option key={c.concept_id} value={c.concept_id}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <button onClick={() => doGenerate(false)} disabled={!selSubject || !selTopic || generating}
                  className={"flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm bg-gradient-to-r " + palette.grad}>
                  {generating
                    ? <><Loader2 size={15} className="animate-spin" /> Generatingâ€¦</>
                    : <><Sparkles size={15} /> Generate Study Content</>}
                </button>
                {selTopic && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Lightbulb size={13} className="text-amber-400" />
                    AI generates YouTube videos, shortcuts &amp; formulas â€” stored for next time
                  </span>
                )}
              </div>
            </div>

            {/* Loading skeleton */}
            {generating && (
              <div className="space-y-5">
                <div className="h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[0,1,2].map(i => <div key={i} className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-64 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                </div>
              </div>
            )}

            {/* Generated History Cards */}
            {!generating && generatedHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <BookMarked size={14} className="text-gray-400" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generated Topics</h3>
                  <span className="text-xs text-gray-300 dark:text-gray-600">â€” click to view</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {generatedHistory.map(item => (
                    <HistoryCard key={item.key} item={item}
                      active={activeKey === item.key}
                      onClick={() => setActiveKey(prev => prev === item.key ? null : item.key)} />
                  ))}
                </div>
              </div>
            )}

            {/* Active generated content */}
            {!generating && activeItem && (
              <GeneratedView
                item={activeItem}
                palette={pal(activeItem.paletteIdx)}
                onMaterialsUpdate={handleMaterialsUpdate}
                regenerating={regeneratingKey === activeItem.key}
                onRegenerate={() => doGenerate(true, activeItem.key)}
              />
            )}
          </div>
        )}

        {/* -- NOTES TAB -- */}
        {tab === "notes" && (
          <div>
            <div className="relative mb-4 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search notesâ€¦" value={noteSearch}
                onChange={e => setNoteSearch(e.target.value)} className={INPUT + " pl-9"} />
            </div>
            {notesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center " + CARD}>
                <StickyNote size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No teacher notes available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map(note => (
                  <div key={note.material_id} className={"rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden " + CARD}>
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <FileText size={17} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 dark:text-gray-100 text-sm line-clamp-2">{note.title}</p>
                          {note.teacher_name && <p className="text-xs text-gray-400 mt-0.5">by {note.teacher_name}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {note.subject_name && <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">{note.subject_name}</span>}
                        {note.topic_name && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.topic_name}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setPdfModal({ url: note.file_url, title: note.title })}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold py-2 rounded-xl hover:opacity-90">
                          <FileText size={13} /> View PDF
                        </button>
                        {note.download_allowed && (
                          <a href={note.file_url} download target="_blank" rel="noreferrer"
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {pdfModal && <PdfModal url={pdfModal.url} title={pdfModal.title} onClose={() => setPdfModal(null)} />}
    </div>
  );
}

