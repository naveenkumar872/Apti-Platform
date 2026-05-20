import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import {
  Play, FileText, ArrowLeft, ExternalLink, StickyNote,
  Search, X, Zap, FlaskConical, ChevronDown, Sparkles,
  CheckCircle, BookOpen
} from "lucide-react";

/* Color palette assigned by subject index — no hardcoding */
const PALETTES = [
  { grad: "from-violet-600 to-purple-700", ring: "ring-violet-400", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300", btn: "from-violet-600 to-purple-700" },
  { grad: "from-blue-600 to-cyan-600",     ring: "ring-blue-400",   badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",         btn: "from-blue-600 to-cyan-600"     },
  { grad: "from-emerald-500 to-teal-600",  ring: "ring-emerald-400",badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",btn: "from-emerald-500 to-teal-600" },
  { grad: "from-orange-500 to-amber-500",  ring: "ring-orange-400", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",  btn: "from-orange-500 to-amber-500"  },
  { grad: "from-rose-600 to-pink-600",     ring: "ring-rose-400",   badge: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",          btn: "from-rose-600 to-pink-600"     },
  { grad: "from-cyan-600 to-sky-600",      ring: "ring-cyan-400",   badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",          btn: "from-cyan-600 to-sky-600"      },
];
const pal = (idx) => PALETTES[idx % PALETTES.length];

function ytEmbed(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? "https://www.youtube.com/embed/" + m[1] : null;
}

const P = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";
const INPUT = "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors";

/* ── PDF Modal ── */
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

/* ── Full-cover Card Detail ── */
function CardDetail({ card, palette, onBack }) {
  const [videos, setVideos] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfModal, setPdfModal] = useState(null);

  useEffect(() => {
    setLoading(true);
    const p = card.concept_id ? { concept_id: card.concept_id } : { topic_id: card.topic_id };
    Promise.all([
      api.get("/student/materials", { params: { ...p, type: "video", limit: 3 } }),
      api.get("/student/materials", { params: { ...p, limit: 20 } }),
    ]).then(([vr, pr]) => {
      setVideos(vr.data.materials || []);
      setPdfs((pr.data.materials || []).filter(m => m.type !== "video"));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [card]);

  const handleMarkLearned = async () => {
    const id = card.concept_id || card.topic_id;
    try { await api.post("/student/materials/" + id + "/mark-learned"); toast.success("Marked as learned!"); }
    catch { /* noop */ }
  };

  const shortcutPdf = pdfs.find(p => /shortcut|trick|key/i.test(p.title)) || pdfs[0];
  const formulaPdf  = pdfs.find(p => /formula|sheet/i.test(p.title)) || (pdfs.length > 1 ? pdfs[1] : null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 mb-5 transition-colors">
          <ArrowLeft size={15} /> Back to cards
        </button>

        {/* Banner */}
        <div className={"rounded-2xl p-6 mb-7 text-white bg-gradient-to-r " + palette.grad}>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">{card.context}</p>
          <h2 className="text-2xl font-bold mb-1">{card.name}</h2>
          {card.description && <p className="text-white/70 text-sm mt-1 max-w-xl">{card.description}</p>}
          <button onClick={handleMarkLearned}
            className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <CheckCircle size={15} /> Mark as Learned
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="aspect-video bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Videos */}
            <div className="mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center"><Play size={14} className="text-white" /></div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Video Lessons</h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 px-2 py-0.5 rounded-full">{videos.length} / 3</span>
              </div>
              {videos.length === 0 ? (
                <div className={"rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-10 text-center"}>
                  <Play size={28} className="text-blue-300 mx-auto mb-2" />
                  <p className="text-sm text-blue-400">No videos uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((v, i) => {
                    const emb = ytEmbed(v.file_url);
                    return (
                      <div key={v.material_id} className={"rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all " + P}>
                        {emb
                          ? <div className="aspect-video bg-black"><iframe src={emb} className="w-full h-full" allowFullScreen title={v.title} /></div>
                          : <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center"><Play size={32} className="text-white/70" /></div>
                        }
                        <div className="p-3">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">{v.title}</p>
                          <span className="text-xs text-blue-500 mt-1 inline-block">Video {i + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PDFs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Shortcut Keys & Tricks", sub: "Quick reference card",    pdf: shortcutPdf, gradBtn: "from-amber-500 to-orange-500", bdr: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30", Icon: Zap,          ec: "text-amber-300" },
                { label: "Formula Sheet",          sub: "All formulas at a glance",pdf: formulaPdf,  gradBtn: "from-red-500 to-rose-600",    bdr: "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30",      Icon: FlaskConical,  ec: "text-red-300"   },
              ].map(({ label, sub, pdf, gradBtn, bdr, Icon, ec }) => (
                <div key={label} className={"rounded-2xl border-2 p-5 " + bdr}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center " + gradBtn}>
                      <Icon size={17} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                  </div>
                  {pdf ? (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium line-clamp-1 mb-3">{pdf.title}</p>
                      <button onClick={() => setPdfModal({ url: pdf.file_url, title: pdf.title })}
                        className={"w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity bg-gradient-to-r " + gradBtn}>
                        <FileText size={14} /> Open PDF
                      </button>
                    </>
                  ) : (
                    <p className={"text-sm text-center py-4 " + ec}>Not uploaded yet</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {pdfModal && <PdfModal url={pdfModal.url} title={pdfModal.title} onClose={() => setPdfModal(null)} />}
    </div>
  );
}

/* =====================================================================
   MAIN
===================================================================== */
export default function StudyMaterials() {
  const [tab, setTab] = useState("materials");
  const [subjects, setSubjects] = useState([]);
  const [selSubject, setSelSubject] = useState("");
  const [selTopic, setSelTopic] = useState("");
  const [selConcept, setSelConcept] = useState("");
  const [concepts, setConcepts] = useState([]);
  const [cards, setCards] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [activePalette, setActivePalette] = useState(pal(0));
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSearch, setNoteSearch] = useState("");
  const [pdfModal, setPdfModal] = useState(null);

  useEffect(() => {
    api.get("/student/subjects")
      .then(r => setSubjects(r.data.subjects || []))
      .catch(() => toast.error("Failed to load subjects"));
  }, []);

  useEffect(() => {
    if (tab !== "notes") return;
    setNotesLoading(true);
    api.get("/student/notes")
      .then(r => setNotes(r.data.notes || []))
      .catch(() => toast.error("Failed to load notes"))
      .finally(() => setNotesLoading(false));
  }, [tab]);

  useEffect(() => {
    setConcepts([]); setSelConcept(""); setCards([]); setGenerated(false); setActiveCard(null);
    if (!selTopic) return;
    api.get("/student/topics/" + selTopic + "/concepts").then(r => setConcepts(r.data.concepts || [])).catch(() => {});
  }, [selTopic]);

  useEffect(() => {
    setSelTopic(""); setSelConcept(""); setConcepts([]); setCards([]); setGenerated(false); setActiveCard(null);
  }, [selSubject]);

  useEffect(() => {
    setCards([]); setGenerated(false); setActiveCard(null);
  }, [selConcept]);

  const subjectIdx = subjects.findIndex(s => String(s.subject_id) === selSubject);
  const subjectObj  = subjects[subjectIdx] || null;
  const topicObj    = (subjectObj?.topics || []).find(t => String(t.topic_id) === selTopic);
  const conceptObj  = concepts.find(c => String(c.concept_id) === selConcept);
  const palette     = pal(subjectIdx < 0 ? 0 : subjectIdx);

  const handleGenerate = () => {
    if (!selSubject) { toast.error("Please select a subject"); return; }
    setActiveCard(null); setGenerated(false);
    let result = [];
    if (selConcept && conceptObj) {
      result = [{ id: conceptObj.concept_id, concept_id: conceptObj.concept_id, topic_id: topicObj?.topic_id, name: conceptObj.name, description: conceptObj.description, context: topicObj?.name || subjectObj.name }];
    } else if (selTopic && topicObj) {
      result = concepts.length > 0
        ? concepts.map(c => ({ id: c.concept_id, concept_id: c.concept_id, topic_id: topicObj.topic_id, name: c.name, description: c.description, context: topicObj.name }))
        : [{ id: topicObj.topic_id, topic_id: topicObj.topic_id, name: topicObj.name, description: "", context: subjectObj.name }];
    } else {
      result = (subjectObj?.topics || []).map(t => ({ id: t.topic_id, topic_id: t.topic_id, name: t.name, description: "", context: subjectObj.name }));
    }
    setCards(result); setGenerated(true); setActivePalette(palette);
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
    (n.subject_name || "").toLowerCase().includes(noteSearch.toLowerCase()) ||
    (n.teacher_name || "").toLowerCase().includes(noteSearch.toLowerCase())
  );

  /* Full-cover detail page */
  if (activeCard) {
    return <CardDetail card={activeCard} palette={activePalette} onBack={() => setActiveCard(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Study Materials</h1>
          <p className="text-sm text-gray-400 mt-0.5">Select subject, topic, concept — then generate study cards.</p>
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

        {/* ===== MATERIALS TAB ===== */}
        {tab === "materials" && (
          <div>
            {/* Form */}
            <div className={"rounded-2xl shadow-sm p-6 mb-6 " + P}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Choose Level</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Subject <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <select value={selSubject} onChange={e => setSelSubject(e.target.value)} className={INPUT + " pr-9 appearance-none cursor-pointer"}>
                      <option value="">-- Select Subject --</option>
                      {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {/* Topic */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Topic <span className="text-gray-300 dark:text-gray-600">(optional)</span></label>
                  <div className="relative">
                    <select value={selTopic} onChange={e => setSelTopic(e.target.value)} disabled={!selSubject} className={INPUT + " pr-9 appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"}>
                      <option value="">-- All Topics --</option>
                      {(subjectObj?.topics || []).map(t => <option key={t.topic_id} value={t.topic_id}>{t.name}</option>)}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                {/* Concept */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Concept <span className="text-gray-300 dark:text-gray-600">(optional)</span></label>
                  <div className="relative">
                    <select value={selConcept} onChange={e => setSelConcept(e.target.value)} disabled={!selTopic || concepts.length === 0} className={INPUT + " pr-9 appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"}>
                      <option value="">-- All Concepts --</option>
                      {concepts.map(c => <option key={c.concept_id} value={c.concept_id}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {selTopic && concepts.length === 0 && <p className="text-xs text-gray-300 mt-1">No concepts for this topic yet</p>}
                </div>
              </div>
              <button onClick={handleGenerate} disabled={!selSubject}
                className={"flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm bg-gradient-to-r " + palette.btn}>
                <Sparkles size={15} /> Generate Cards
              </button>
            </div>

            {/* Cards */}
            {generated && (
              <div>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                  {cards.length} Card{cards.length !== 1 ? "s" : ""} — click a card to study
                </p>
                {cards.length === 0 ? (
                  <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-14 text-center " + P}>
                    <p className="text-gray-400 text-sm">No content found for this selection.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card, idx) => (
                      <button key={card.id} onClick={() => setActiveCard(card)}
                        className={"group relative overflow-hidden rounded-2xl border-2 border-gray-100 dark:border-gray-800 p-5 text-left hover:shadow-lg hover:-translate-y-1 transition-all bg-white dark:bg-gray-900"}>
                        <div className={"absolute top-0 left-0 right-0 h-1 bg-gradient-to-r " + palette.grad} />
                        <div className={"w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br " + palette.grad}>
                          <span className="text-white font-bold text-sm">{idx + 1}</span>
                        </div>
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{card.name}</p>
                        {card.description && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{card.description}</p>}
                        <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">{card.context}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="flex items-center gap-1 text-xs text-blue-400"><Play size={10} /> Videos</span>
                          <span className="flex items-center gap-1 text-xs text-red-400"><FileText size={10} /> PDFs</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== NOTES TAB ===== */}
        {tab === "notes" && (
          <div>
            <div className="relative mb-4 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search notes..." value={noteSearch} onChange={e => setNoteSearch(e.target.value)} className={INPUT + " pl-9"} />
            </div>
            {notesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
            ) : filteredNotes.length === 0 ? (
              <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center " + P}>
                <StickyNote size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No teacher notes available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map(note => (
                  <div key={note.material_id} className={"rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden " + P}>
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
