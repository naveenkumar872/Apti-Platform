import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Play, FileText, ExternalLink, StickyNote,
  Search, X, Zap, FlaskConical, ChevronDown, Sparkles,
  CheckCircle, BookOpen, Trash2, PlayCircle, Lightbulb,
  ChevronRight, Loader2, RefreshCw, Download, BookMarked,
  CheckSquare, Square
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

/* -- Delete Confirmation Modal -- */
function DeleteConfirmModal({ title, count, onClose, onConfirm }) {
  const isMultiple = count > 1;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-4">
          <Trash2 size={22} />
        </div>
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">
          {isMultiple ? "Delete Topics" : "Delete Study Content"}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
          {isMultiple ? (
            <span>Are you sure you want to delete the <strong>{count}</strong> selected topics and all their materials? This cannot be undone.</span>
          ) : (
            <span>Are you sure you want to delete <strong>{title}</strong> and all its materials? This cannot be undone.</span>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
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
              {context.subjectName}{context.conceptName ? ` › ${context.topicName}` : ""}
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
            <p className="text-sm text-red-400">No videos — try regenerating.</p>
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
function HistoryCard({ item, active, onView, onDelete, deleting, selectMode, selected, onToggleSelect }) {
  const palette = pal(item.paletteIdx);
  return (
    <div
      onClick={selectMode ? onToggleSelect : onView}
      className={"w-full text-left rounded-2xl p-4 border-2 transition-all flex flex-col justify-between h-full cursor-pointer relative " +
        (selected
          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20"
          : active
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md"
            : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm")}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className={"inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 text-white bg-gradient-to-r " + palette.grad}>
            {item.context.subjectName}
          </span>
          {selectMode && (
            <div className="flex-shrink-0">
              {selected ? (
                <CheckSquare size={17} className="text-indigo-500" />
              ) : (
                <Square size={17} className="text-gray-300 dark:text-gray-600" />
              )}
            </div>
          )}
        </div>
        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight line-clamp-2">
          {item.context.conceptName || item.context.topicName}
        </p>
        {item.context.conceptName && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.context.topicName}</p>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400 flex-shrink-0">
          {item.materials.length} resource{item.materials.length !== 1 ? "s" : ""}
        </span>
        {!selectMode && (
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={onView}
              className={"px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all " +
                (active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200")}
            >
              {active ? "Viewing" : "View"}
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              title="Delete this topic card"
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        )}
      </div>
    </div>
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
  const [historyLoading,   setHistoryLoading]   = useState(false);
  const [deletingKey,      setDeletingKey]      = useState(null);
  const [deleteConfirm,    setDeleteConfirm]    = useState(null);
  const [selectMode,       setSelectMode]       = useState(false);
  const [selectedKeys,     setSelectedKeys]     = useState(new Set());

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

  useEffect(() => {
    if (tab !== "materials") return;
    setHistoryLoading(true);
    api.get("/student/materials", { params: { limit: 1000 } })
      .then(r => {
        const list = r.data.materials || [];
        const studyMats = list.filter(m => m.type !== "note");
        const groups = {};
        studyMats.forEach(m => {
          if (!m.topic_id) return;
          const key = `${m.topic_id}_${m.concept_id || "all"}`;
          if (!groups[key]) {
            const subjectIdx = SUBJECTS.findIndex(s => s.subject_id === m.subject_id);
            groups[key] = {
              key,
              context: {
                subjectName: m.subject_name || "",
                topicName: m.topic_name || "",
                conceptName: m.concept_name || "",
                subject_id: m.subject_id,
                topic_id: m.topic_id,
                concept_id: m.concept_id || "",
              },
              materials: [],
              paletteIdx: subjectIdx < 0 ? 0 : subjectIdx,
            };
          }
          groups[key].materials.push(m);
        });

        const historyArray = Object.values(groups).map(g => {
          const maxCreatedAt = Math.max(...g.materials.map(m => new Date(m.created_at || 0).getTime()));
          return { ...g, maxCreatedAt };
        }).sort((a, b) => b.maxCreatedAt - a.maxCreatedAt);

        setGeneratedHistory(historyArray);
      })
      .catch(() => toast.error("Failed to load study materials history"))
      .finally(() => setHistoryLoading(false));
  }, [tab]);

  const handleMaterialsUpdate = useCallback((key, newMats) => {
    setGeneratedHistory(prev =>
      prev.map(item => item.key === key ? { ...item, materials: newMats } : item)
    );
  }, []);

  const handleDeleteCard = (key) => {
    const card = generatedHistory.find(h => h.key === key);
    if (!card) return;
    setDeleteConfirm({ keys: [key], title: card.context.conceptName || card.context.topicName });
  };

  const executeDeleteCard = async () => {
    if (!deleteConfirm) return;
    const { keys } = deleteConfirm;
    setDeleteConfirm(null);

    if (keys.length === 1) {
      const key = keys[0];
      const card = generatedHistory.find(h => h.key === key);
      if (!card) return;

      setDeletingKey(key);
      try {
        await Promise.all(card.materials.map(m =>
          api.delete(`/student/materials/${m.material_id}`)
        ));
        setGeneratedHistory(prev => prev.filter(h => h.key !== key));
        setSelectedKeys(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        if (activeKey === key) {
          setActiveKey(null);
        }
        toast.success("Study materials deleted");
      } catch {
        toast.error("Failed to delete some materials");
      } finally {
        setDeletingKey(null);
      }
    } else {
      setHistoryLoading(true);
      try {
        const cards = generatedHistory.filter(h => keys.includes(h.key));
        const allMaterialIds = cards.flatMap(c => c.materials.map(m => m.material_id));
        await Promise.all(allMaterialIds.map(mid => api.delete(`/student/materials/${mid}`)));

        setGeneratedHistory(prev => prev.filter(h => !keys.includes(h.key)));
        setSelectedKeys(new Set());
        setSelectMode(false);
        if (keys.includes(activeKey)) {
          setActiveKey(null);
        }
        toast.success(`${keys.length} topics deleted`);
      } catch {
        toast.error("Failed to delete some study materials");
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const handleToggleSelectKey = (key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAllKeys = () => {
    if (selectedKeys.size === generatedHistory.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(generatedHistory.map(h => h.key)));
    }
  };

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

  const STAT_CARDS = [
    { label: "Topics Studied", value: generatedHistory.length, icon: BookOpen, grad: "from-violet-500 to-purple-600" },
    { label: "Videos Available", value: generatedHistory.reduce((acc, h) => acc + h.materials.filter(m => m.type === "video").length, 0), icon: PlayCircle, grad: "from-red-500 to-rose-600" },
    { label: "PDF Notes", value: notes.length, icon: FileText, grad: "from-blue-500 to-indigo-600" },
    { label: "Formulas & Tricks", value: generatedHistory.reduce((acc, h) => acc + h.materials.filter(m => m.type === "formula" || m.type === "shortcut").length, 0), icon: Zap, grad: "from-orange-500 to-amber-500" },
  ];

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked size={15} className="text-white/70" />
            <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Learning Hub</span>
          </div>
          <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Study Materials</h1>
          <p className="text-white/70 text-sm mt-1.5">AI-generated videos, shortcuts &amp; formulas for every topic</p>
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className="shadow-sm p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 " + grad}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
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
            {activeItem ? (
              <div className="space-y-6">
                <button
                  onClick={() => setActiveKey(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-250 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors shadow-sm w-fit"
                >
                  <ChevronRight size={14} className="rotate-180 text-gray-400" />
                  Back to Topics
                </button>
                <GeneratedView
                  item={activeItem}
                  palette={pal(activeItem.paletteIdx)}
                  onMaterialsUpdate={handleMaterialsUpdate}
                  regenerating={regeneratingKey === activeItem.key}
                  onRegenerate={() => doGenerate(true, activeItem.key)}
                />
              </div>
            ) : (
              <>
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
                        ? <><Loader2 size={15} className="animate-spin" /> Generating...</>
                        : <><Sparkles size={15} /> Generate Study Content</>}
                    </button>
                    {selTopic && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Lightbulb size={13} className="text-amber-400" />
                        AI generates YouTube videos, shortcuts &amp; formulas — stored for next time
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
                {!generating && (historyLoading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <BookMarked size={14} className="text-gray-400" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Study Materials...</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800/50 animate-pulse rounded-2xl border-2 border-gray-50 dark:border-gray-800" />
                      ))}
                    </div>
                  </div>
                ) : generatedHistory.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1 flex-wrap">
                      <BookMarked size={14} className="text-gray-400" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Generated Topics</h3>
                      <span className="text-xs text-gray-450 dark:text-gray-500 font-medium">— click card to view details</span>
                      <div className="ml-auto flex items-center gap-2">
                        {selectMode && (
                          <>
                            <button
                              onClick={handleSelectAllKeys}
                              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors"
                            >
                              {selectedKeys.size === generatedHistory.length ? "Deselect All" : "Select All"}
                            </button>
                            {selectedKeys.size > 0 && (
                              <button
                                onClick={() => setDeleteConfirm({ keys: Array.from(selectedKeys), title: "" })}
                                className="px-2.5 py-1 bg-red-650 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Delete ({selectedKeys.size})
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectMode(!selectMode);
                            setSelectedKeys(new Set());
                          }}
                          className={"px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors border " +
                            (selectMode
                              ? "bg-amber-500 text-white border-amber-400 hover:bg-amber-600"
                              : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800")}
                        >
                          {selectMode ? "Cancel" : "Select"}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {generatedHistory.map(item => (
                        <HistoryCard key={item.key} item={item}
                          active={activeKey === item.key}
                          onView={() => setActiveKey(prev => prev === item.key ? null : item.key)}
                          onDelete={() => handleDeleteCard(item.key)}
                          deleting={deletingKey === item.key}
                          selectMode={selectMode}
                          selected={selectedKeys.has(item.key)}
                          onToggleSelect={() => handleToggleSelectKey(item.key)} />
                      ))}
                    </div>
                  </div>
                ) : null)}
              </>
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
                {filteredNotes.map(note => {
                  // Pick icon, label, and accent per material type so videos, PDFs,
                  // and links all render coherently in the same tab.
                  const meta = (() => {
                    switch (note.type) {
                      case 'video': return { Icon: Play,     label: 'Watch video', grad: 'from-rose-500 to-red-600' };
                      case 'pdf':   return { Icon: FileText, label: 'View PDF',    grad: 'from-amber-400 to-orange-500' };
                      case 'link':  return { Icon: ExternalLink, label: 'Open link', grad: 'from-blue-500 to-indigo-600' };
                      case 'ppt':   return { Icon: FileText, label: 'Open PPT',    grad: 'from-purple-500 to-fuchsia-600' };
                      case 'doc':   return { Icon: FileText, label: 'Open doc',    grad: 'from-slate-500 to-slate-700' };
                      default:      return { Icon: FileText, label: 'Open',        grad: 'from-amber-400 to-orange-500' };
                    }
                  })();
                  const handleOpen = () => {
                    if (note.type === 'pdf' && note.file_url) {
                      setPdfModal({ url: note.file_url, title: note.title });
                    } else if (note.file_url) {
                      window.open(note.file_url, '_blank', 'noopener,noreferrer');
                    }
                  };
                  return (
                    <div key={note.material_id} className={"rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden " + CARD}>
                      <div className={`h-1.5 bg-gradient-to-r ${meta.grad}`} />
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.grad} flex items-center justify-center flex-shrink-0`}>
                            <meta.Icon size={16} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm line-clamp-2">{note.title}</p>
                            {note.teacher_name && <p className="text-xs text-gray-400 mt-0.5">by {note.teacher_name}</p>}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex-shrink-0">
                            {note.type}
                          </span>
                        </div>
                        {note.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{note.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {note.subject_name && <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">{note.subject_name}</span>}
                          {note.topic_name && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.topic_name}</span>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleOpen}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold py-2 rounded-xl hover:opacity-90">
                            <meta.Icon size={13} /> {meta.label}
                          </button>
                          {note.download_allowed && note.file_url && (
                            <a href={note.file_url} download target="_blank" rel="noreferrer"
                              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {pdfModal && <PdfModal url={pdfModal.url} title={pdfModal.title} onClose={() => setPdfModal(null)} />}
      {deleteConfirm && (
        <DeleteConfirmModal
          title={deleteConfirm.title}
          count={deleteConfirm.keys.length}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={executeDeleteCard}
        />
      )}
    </div>
  );
}

