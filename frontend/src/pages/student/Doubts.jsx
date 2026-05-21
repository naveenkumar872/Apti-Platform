import { useEffect, useState } from "react";
import api from "../../services/api";
import { MessageCircleQuestion, Plus, ChevronDown, ChevronUp, Send, HelpCircle, CheckCircle2, MessageSquare } from "lucide-react";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";
const STATUS = { open: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400", answered: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" };

function AnswerSection({ doubtId, initialAnswers, onNewAnswer }) {
  const [answers, setAnswers] = useState(initialAnswers || []);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await api.post(`/student/doubts/${doubtId}/answers`, { answer_text: text });
      const newA = { answer_id: Date.now(), answer_text: text, answered_by_name: "You" };
      setAnswers(a => [...a, newA]);
      if (onNewAnswer) onNewAnswer();
      setText("");
    } catch {}
    setPosting(false);
  };

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
      {answers.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No answers yet. Be the first!</p>
          ) : (
            <div className="space-y-2 mb-3">
          {answers.map(a => (
            <div key={a.answer_id} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">{a.answer_text}</p>
              <p className="text-xs text-gray-400 mt-1">{a.answered_by_name}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && post()}
          placeholder="Write an answer..."
          className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button onClick={post} disabled={posting || !text.trim()}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center disabled:opacity-50">
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}

export default function Doubts() {
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    api.get("/student/doubts").then(r => setDoubts(r.data.doubts || [])).catch(() => {}).finally(() => setLoading(false));
  };

  const totalDoubts = doubts.length;
  const answeredDoubts = doubts.filter(d => d.status === "answered" || d.status === "resolved").length;
  const openDoubts = totalDoubts - answeredDoubts;
  const resolutionRate = totalDoubts > 0 ? `${Math.round((answeredDoubts / totalDoubts) * 100)}%` : "0%";

  const STAT_CARDS = [
    { label: "Community Doubts", value: totalDoubts, icon: HelpCircle, grad: "from-blue-500 to-indigo-650" },
    { label: "Answered Doubts", value: answeredDoubts, icon: CheckCircle2, grad: "from-emerald-500 to-teal-600" },
    { label: "Open Doubts", value: openDoubts, icon: MessageCircleQuestion, grad: "from-orange-500 to-amber-500" },
    { label: "Resolution Rate", value: resolutionRate, icon: MessageSquare, grad: "from-violet-500 to-purple-600" },
  ];

  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!question.trim()) return;
    setPosting(true);
    try {
      await api.post("/student/doubts", { question_text: question, subject });
      setQuestion(""); setSubject(""); setShowForm(false);
      load();
    } catch {}
    setPosting(false);
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircleQuestion size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Community</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Doubts</h1>
            <p className="text-white/70 text-sm mt-1.5">Ask questions, get peer answers</p>
          </div>
          <button onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0">
            <Plus size={15} />Ask Doubt
          </button>
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">

      {/* Stat cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className={"shadow-sm p-5 rounded-2xl " + C}>
              <div className={"w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 " + grad}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={"rounded-2xl border p-5 mb-5 " + C}>
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Post a Doubt</h2>
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3" />
          <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={3} placeholder="Describe your doubt clearly..."
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3 resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            <button onClick={post} disabled={posting || !question.trim()}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {posting ? "Posting..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
      ) : doubts.length === 0 ? (
        <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-14 text-center " + C}>
          <MessageCircleQuestion size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No doubts yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Ask Doubt" to post your first question!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {doubts.map(d => (
            <div key={d.doubt_id} className={"rounded-2xl border p-5 " + C}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {d.subject && <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1 block">{d.subject}</span>}
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{d.question_text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={"text-xs font-semibold px-2 py-0.5 rounded-full " + (STATUS[d.status] || STATUS.open)}>{d.status}</span>
                    <span className="text-xs text-gray-400">{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={() => setExpanded(expanded === d.doubt_id ? null : d.doubt_id)}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  {expanded === d.doubt_id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                </button>
              </div>
                {expanded === d.doubt_id && <AnswerSection doubtId={d.doubt_id} initialAnswers={d.answers || []} />}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
