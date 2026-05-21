import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { BarChart3, ChevronDown, ChevronUp, Sparkles, X, Search, Trash2, BookOpen, Zap, ClipboardList, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";

function grade(score) {
  if (score >= 90) return { label: "A+", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
  if (score >= 80) return { label: "A", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" };
  if (score >= 70) return { label: "B", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" };
  if (score >= 60) return { label: "C", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" };
  return { label: "D", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" };
}

/* -- Delete Confirmation Modal -- */
function DeleteConfirmModal({ title, isBulk, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mb-4">
          <Trash2 size={22} />
        </div>
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">
          {isBulk ? "Delete All Reports" : "Delete Report"}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
          {isBulk ? (
            <span>Are you sure you want to delete <strong>all reports and practice sessions</strong>? This will permanently erase them from both the UI and database. This cannot be undone.</span>
          ) : (
            <span>Are you sure you want to delete <strong>{title}</strong>? This will permanently erase the report from both the UI and database. This cannot be undone.</span>
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

function DetailPane({ reportId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/student/reports/${reportId}`).then(r => setDetail(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [reportId]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const weakest = detail?.weak_topics?.[0];
      const body = weakest?.topic_id ? { topic_id: weakest.topic_id } : {};
      await api.post("/student/plan/generate", body);
      toast.success("Study plan updated successfully!");
    } catch {
      toast.error("Failed to generate plan");
    }
    setGenerating(false);
  };

  if (loading) return <div className="p-6 text-center text-sm text-gray-400">Loading report...</div>;
  if (!detail) return <div className="p-6 text-center text-sm text-red-400">Could not load report</div>;

  const { attempt, answers } = detail;
  const g = grade(attempt?.accuracy_percent || 0);

  return (
    <div className={"rounded-2xl border p-6 mb-6 " + C}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex flex-wrap items-center gap-2">
            <span>{attempt?.title}</span>
            {attempt?.attempt_number > 0 && (
              <span className="inline-flex items-center text-xs font-extrabold px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded-lg">
                Attempt #{attempt.attempt_number}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(attempt?.submitted_at).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <X size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Score summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Score", value: `${Math.round(attempt?.accuracy_percent || 0)}%`, color: "text-indigo-600 dark:text-indigo-400" },
          { label: "Correct", value: attempt?.score, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Wrong", value: attempt?.total_marks != null ? ((attempt.total_marks || 0) - (attempt.score || 0)) : '—', color: "text-red-500 dark:text-red-400" },
          { label: "Grade", value: g.label, color: "" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-center">
            <p className={"text-xl font-bold " + (s.color || g.cls.split(" ").slice(0,2).join(" "))}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Accuracy bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Accuracy</span><span>{Math.round(attempt?.accuracy_percent || 0)}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${Math.round(attempt?.accuracy_percent || 0)}%` }} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button onClick={generatePlan} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
          <Sparkles size={14} />
          {generating ? "Generating..." : "Generate Study Plan"}
        </button>
        <button
          onClick={() => {
            if (detail?.type === "test" || attempt?.test_id) {
              navigate("/student/tests", { state: { retakeTestId: attempt.test_id } });
            } else {
              navigate("/student/practice", {
                state: {
                  retakePractice: {
                    method: attempt?.method,
                    config: attempt?.config,
                    title: attempt?.title
                  }
                }
              });
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-sm font-semibold transition-all border border-indigo-100 dark:border-indigo-900/30"
        >
          <Zap size={14} />
          Retake
        </button>
      </div>

      {/* Questions accordion */}
      {answers && answers.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Question Review ({answers.length})</h3>
          <div className="space-y-2">
            {answers.map((q, i) => {
              const rawOpts = q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options) : [];
              const opts = rawOpts.map((o, j) => [String.fromCharCode(65 + j), typeof o === "object" ? o.text || o : o]);
              const isOpen = expanded === i;

              return (
                <div key={q.question_id || i} className={"rounded-xl border overflow-hidden " + (q.is_correct ? "border-emerald-100 dark:border-emerald-900/40" : "border-red-100 dark:border-red-900/40")}>
                  <button onClick={() => setExpanded(isOpen ? null : i)}
                    className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <span className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 " + (q.is_correct ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400")}>
                      {q.is_correct ? "✓" : "✗"}
                    </span>
                    <p className={"text-sm text-gray-700 dark:text-gray-200 flex-1 " + (isOpen ? "" : "line-clamp-1")}>{q.question_text}</p>
                    {isOpen ? <ChevronUp size={12} className="text-gray-400 flex-shrink-0 mt-1.5" /> : <ChevronDown size={12} className="text-gray-400 flex-shrink-0 mt-1.5" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-3 bg-white dark:bg-gray-900">
                      {/* Render parsed options */}
                      {opts.length > 0 ? (
                        <div className="space-y-2">
                          {opts.map(([key, text]) => {
                            const isCorrect = key === q.correct_answer;
                            const isChosen  = key === q.selected_answer;
                            let cls = "border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 opacity-60";
                            if (isCorrect) cls = "border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-gray-700 dark:text-gray-200";
                            else if (isChosen && !q.is_correct) cls = "border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-gray-700 dark:text-gray-200";
                            return (
                              <div key={key} className={"flex items-center gap-3 px-3 py-2.5 rounded-xl " + cls}>
                                <span className={"w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 " +
                                  (isCorrect ? "bg-emerald-500 text-white" : isChosen ? "bg-red-400 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500")}>
                                  {key}
                                </span>
                                <span className="text-sm font-medium">{text}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Your answer: <span className={"font-semibold " + (q.is_correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>{q.selected_answer || "—"}</span></p>
                          {!q.is_correct && <p className="text-xs text-gray-500 dark:text-gray-400">Correct answer: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{q.correct_answer}</span></p>}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800/40 rounded-xl">
                          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Sparkles size={12} className="text-indigo-400" />Explanation
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{q.explanation}</p>
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

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  const handleRetake = (r) => {
    if (r.type === "test" || r.test_id) {
      navigate("/student/tests", { state: { retakeTestId: r.test_id } });
    } else {
      navigate("/student/practice", {
        state: {
          retakePractice: {
            method: r.method,
            config: r.config,
            title: r.title,
          }
        }
      });
    }
  };

  const fetchReports = () => {
    setLoading(true);
    api.get("/student/reports")
      .then(r => setReports(r.data.attempts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteRow = async (id) => {
    try {
      await api.delete(`/student/reports/${id}`);
      toast.success("Report deleted successfully");
      if (active === id) {
        setActive(null);
      }
      setReports(prev => prev.filter(r => r.id !== id));
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete("/student/reports");
      toast.success("All reports deleted successfully");
      setActive(null);
      setReports([]);
    } catch {
      toast.error("Failed to delete all reports");
    }
  };

  // Stats calculation
  const totalReports = reports.length;
  const testsCompleted = reports.filter(r => r.type === "test").length;
  const practiceCompleted = reports.filter(r => r.type === "practice").length;
  const bestScore = reports.length > 0 ? Math.max(...reports.map(r => Math.round(r.accuracy_percent || 0))) : 0;

  const STAT_CARDS = [
    { label: "Total Reports", value: totalReports, icon: BarChart3, grad: "from-blue-500 to-indigo-600" },
    { label: "Tests Completed", value: testsCompleted, icon: ClipboardList, grad: "from-emerald-500 to-teal-600" },
    { label: "Practice Sessions", value: practiceCompleted, icon: BookOpen, grad: "from-violet-500 to-purple-600" },
    { label: "Best Score", value: `${bestScore}%`, icon: Zap, grad: "from-orange-500 to-amber-500" },
  ];

  // Filtering
  const filteredReports = reports.filter(r => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.topics?.toLowerCase().includes(search.toLowerCase()) ||
      r.student_name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={15} className="text-white/70" />
            <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Performance</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Reports</h1>
          <p className="text-white/70 text-sm mt-1.5">Review your test scores &amp; insights</p>
        </div>
      </div>

      <div className="flex-1 p-5 md:p-8">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className={"shadow-sm p-5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl"}>
              <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 " + grad}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {active && <DetailPane reportId={active} onClose={() => setActive(null)} />}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6 mt-4">
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search test, topic, or student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
            >
              <option value="all">All Types</option>
              <option value="test">Tests</option>
              <option value="practice">Practice</option>
            </select>
            {reports.length > 0 && (
              <button
                onClick={() => setDeleteConfirm({ isBulk: true })}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors ml-auto sm:ml-0"
              >
                <Trash2 size={14} />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
        ) : filteredReports.length === 0 ? (
          <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-14 text-center " + C}>
            <AlertTriangle size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No reports matched your filters</p>
            <p className="text-gray-400 text-sm mt-1">Complete more tests or clear search query</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <table className="w-full border-collapse text-left text-sm text-gray-500 dark:text-gray-400 table-auto">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-bold">Student Name</th>
                  <th className="px-6 py-4 font-bold">Test Name</th>
                  <th className="px-6 py-4 font-bold">Attempt</th>
                  <th className="px-6 py-4 font-bold">Topic(s)</th>
                  <th className="px-6 py-4 font-bold">Score</th>
                  <th className="px-6 py-4 font-bold">Grade</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredReports.map(r => {
                  const g = grade(r.accuracy_percent || 0);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200 truncate max-w-[150px]">
                        {r.student_name || "Student"}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">
                        <div>
                          <p className="font-semibold line-clamp-1">
                            {r.title}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(r.submitted_at).toLocaleDateString()} · {r.type}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {r.attempt_number > 0 ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-md">
                            Attempt #{r.attempt_number}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {r.topics ? (
                            r.topics.split(", ").map((t, idx) => (
                              <span key={idx} className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">General Prep</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800 dark:text-gray-100">{Math.round(r.accuracy_percent || 0)}%</span>
                          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.round(r.accuracy_percent || 0)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${g.cls}`}>
                          {g.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleRetake(r)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-500 dark:hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 transition-all">
                            Retake
                          </button>
                          <button onClick={() => setActive(r.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-850 hover:bg-indigo-500 dark:hover:bg-indigo-600 hover:text-white text-gray-700 dark:text-gray-300 transition-all">
                            View
                          </button>
                          <button onClick={() => setDeleteConfirm({ id: r.id, title: r.title })}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          title={deleteConfirm.title}
          isBulk={deleteConfirm.isBulk}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm.isBulk) {
              handleDeleteAll();
            } else {
              handleDeleteRow(deleteConfirm.id);
            }
            setDeleteConfirm(null);
          }}
        />
      )}
    </div>
  );
}
