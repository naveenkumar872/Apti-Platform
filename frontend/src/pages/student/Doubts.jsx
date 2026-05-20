import { useEffect, useState } from "react";
import api from "../../services/api";
import { MessageCircleQuestion, Plus, ChevronDown, ChevronUp, Send } from "lucide-react";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";
const STATUS = { open: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400", answered: "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" };

function AnswerSection({ doubtId }) {
  const [answers, setAnswers] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api.get(`/student/doubts/${doubtId}/answers`).then(r => setAnswers(r.data.answers || [])).catch(() => {}).finally(() => setLoading(false));
  }, [doubtId]);

  const post = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const r = await api.post(`/student/doubts/${doubtId}/answers`, { answer_text: text });
      setAnswers(a => [...a, r.data.answer]);
      setText("");
    } catch {}
    setPosting(false);
  };

  return (
    <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
      {loading ? <p className="text-xs text-gray-400">Loading answers...</p> : answers.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No answers yet. Be the first!</p>
      ) : (
        <div className="space-y-2 mb-3">
          {answers.map(a => (
            <div key={a.answer_id} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
              <p className="text-sm text-gray-700 dark:text-gray-200">{a.answer_text}</p>
              <p className="text-xs text-gray-400 mt-1">{a.author_name} · {new Date(a.created_at).toLocaleDateString()}</p>
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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <MessageCircleQuestion size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Doubts</h1>
            <p className="text-xs text-gray-400">Ask questions, get answers</p>
          </div>
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity">
          <Plus size={15} />
          Ask Doubt
        </button>
      </div>

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
              {expanded === d.doubt_id && <AnswerSection doubtId={d.doubt_id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
