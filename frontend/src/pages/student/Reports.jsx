import { useEffect, useState } from "react";
import api from "../../services/api";
import { BarChart3, ChevronDown, ChevronUp, Sparkles, X } from "lucide-react";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";

function grade(score) {
  if (score >= 90) return { label: "A+", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" };
  if (score >= 80) return { label: "A", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" };
  if (score >= 70) return { label: "B", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" };
  if (score >= 60) return { label: "C", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" };
  return { label: "D", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" };
}

function DetailPane({ reportId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get(`/student/reports/${reportId}`).then(r => setDetail(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [reportId]);

  const generatePlan = async () => {
    setGenerating(true);
    try { await api.post("/student/plan/generate"); } catch {}
    setGenerating(false);
  };

  if (loading) return <div className="p-6 text-center text-sm text-gray-400">Loading report...</div>;
  if (!detail) return <div className="p-6 text-center text-sm text-red-400">Could not load report</div>;

  const { report, questions } = detail;
  const g = grade(report?.score || 0);

  return (
    <div className={"rounded-2xl border p-6 mb-4 " + C}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{report?.test_title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(report?.submitted_at).toLocaleString()}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <X size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Score summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Score", value: `${Math.round(report?.score || 0)}%`, color: "text-indigo-600 dark:text-indigo-400" },
          { label: "Correct", value: report?.correct_answers, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Wrong", value: report?.wrong_answers, color: "text-red-500 dark:text-red-400" },
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
          <span>Accuracy</span><span>{Math.round(report?.score || 0)}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
          <div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${Math.round(report?.score || 0)}%` }} />
        </div>
      </div>

      {/* Generate plan button */}
      <button onClick={generatePlan} disabled={generating}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 mb-5">
        <Sparkles size={14} />
        {generating ? "Generating..." : "Generate Study Plan"}
      </button>

      {/* Questions accordion */}
      {questions && questions.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Question Review ({questions.length})</h3>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={q.question_id || i} className={"rounded-xl border overflow-hidden " + (q.is_correct ? "border-emerald-100 dark:border-emerald-900/40" : "border-red-100 dark:border-red-900/40")}>
                <button onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <span className={"w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 " + (q.is_correct ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400")}>
                    {q.is_correct ? "✓" : "✗"}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-200 flex-1 line-clamp-1">{q.question_text}</p>
                  {expanded === i ? <ChevronUp size={12} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />}
                </button>
                {expanded === i && (
                  <div className="px-4 pb-4 pt-1 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your answer: <span className={"font-semibold " + (q.is_correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>{q.your_answer || "—"}</span></p>
                    {!q.is_correct && <p className="text-xs text-gray-500 dark:text-gray-400">Correct answer: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{q.correct_answer}</span></p>}
                    {q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg">{q.explanation}</p>}
                  </div>
                )}
              </div>
            ))}
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

  useEffect(() => {
    api.get("/student/reports").then(r => setReports(r.data.reports || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Reports</h1>
          <p className="text-xs text-gray-400">Review your test performance</p>
        </div>
      </div>

      {active && <DetailPane reportId={active} onClose={() => setActive(null)} />}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-14 text-center " + C}>
          <BarChart3 size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No test reports yet</p>
          <p className="text-gray-400 text-sm mt-1">Complete a test to see your performance here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map(r => {
            const g = grade(r.score || 0);
            return (
              <button key={r.attempt_id || r.report_id} onClick={() => setActive(r.attempt_id || r.report_id)}
                className={"w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md " + C + (active === (r.attempt_id || r.report_id) ? " ring-2 ring-indigo-400" : "")}>
                <div className={"w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 " + g.cls}>
                  {g.label}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{r.test_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(r.submitted_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-gray-800 dark:text-gray-100">{Math.round(r.score)}%</p>
                  <p className="text-xs text-gray-400">{r.total_questions} Qs</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
