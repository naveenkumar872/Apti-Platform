import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import { MessageCircle, CheckCircle, Send } from 'lucide-react';

export default function Doubts() {
  const { user } = useAuthStore();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDoubt, setNewDoubt] = useState('');
  const [selected, setSelected] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchDoubts = () => {
    api.get('/student/doubts')
      .then(r => setDoubts(r.data.doubts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDoubts(); }, []);

  const postDoubt = async () => {
    if (!newDoubt.trim()) return;
    setPosting(true);
    try {
      const res = await api.post('/student/doubts', { question_text: newDoubt });
      setDoubts(prev => [res.data.doubt, ...prev]);
      setNewDoubt('');
      toast.success('Doubt posted!');
    } catch { toast.error('Failed to post doubt'); }
    finally { setPosting(false); }
  };

  const postAnswer = async (doubtId) => {
    if (!answerText.trim()) return;
    try {
      const res = await api.post(`/student/doubts/${doubtId}/answers`, { answer_text: answerText });
      setSelected(prev => ({ ...prev, answers: [...(prev.answers || []), res.data.answer] }));
      setAnswerText('');
      toast.success('Answer posted!');
    } catch { toast.error('Failed'); }
  };

  const loadDoubt = async (doubt) => {
    setSelected(doubt);
  };

  const statusColors = { open: 'bg-yellow-100 text-yellow-700', answered: 'bg-green-100 text-green-700', resolved: 'bg-gray-100 text-gray-700' };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <MessageCircle size={22} /> Doubt Forum
      </h1>

      {/* Post a doubt */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <textarea
          value={newDoubt}
          onChange={e => setNewDoubt(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Ask your doubt here..."
        />
        <button
          onClick={postDoubt}
          disabled={posting || !newDoubt.trim()}
          className="mt-2 bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
        >
          <Send size={14} /> {posting ? 'Posting...' : 'Post Doubt'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Doubts list */}
        <div>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" />)}</div>
          ) : doubts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No doubts yet</p>
          ) : (
            <div className="space-y-2">
              {doubts.map(d => (
                <button
                  key={d.doubt_id}
                  onClick={() => loadDoubt(d)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${selected?.doubt_id === d.doubt_id ? 'border-blue-400 bg-blue-50' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-800 line-clamp-2">{d.question_text}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[d.status]}`}>{d.status}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{new Date(d.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Doubt detail */}
        <div>
          {selected ? (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm text-gray-800 flex-1 leading-relaxed">{selected.question_text}</p>
                <span className={`text-xs px-2 py-1 rounded-full ml-2 ${statusColors[selected.status]}`}>{selected.status}</span>
              </div>

              {(selected.answers || []).map(a => (
                <div key={a.answer_id} className="p-3 bg-gray-50 rounded-lg mb-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">{a.answered_by_name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-600">{a.answer_text}</p>
                  {a.is_best_answer && <span className="text-xs text-green-600 flex items-center gap-1 mt-1"><CheckCircle size={12}/> Best Answer</span>}
                </div>
              ))}

              <div className="mt-3">
                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Write your answer..."
                />
                <button
                  onClick={() => postAnswer(selected.doubt_id)}
                  disabled={!answerText.trim()}
                  className="mt-1 bg-blue-600 text-white text-xs px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  Post Answer
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-10 border border-dashed border-gray-200 text-center">
              <p className="text-gray-400 text-sm">Select a doubt to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
