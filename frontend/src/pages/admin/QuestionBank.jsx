import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, HelpCircle, Users, TrendingUp, ClipboardList, Award } from 'lucide-react';

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";
const inputCls = "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    question_text: '', question_type: 'mcq', difficulty: 3, correct_answer: 'A',
    options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
    explanation: '', estimated_time_seconds: 60,
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  const fetchQuestions = () => {
    setLoading(true);
    api.get('/admin/questions', { params: { search } })
      .then(r => setQuestions(r.data.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQuestions(); }, [search]);

  const saveQuestion = async () => {
    if (!form.question_text.trim()) { toast.error('Question text required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/admin/questions', form);
      setQuestions(prev => [res.data.question, ...prev]);
      toast.success('Question added!');
      setShowForm(false);
      setForm({ question_text: '', question_type: 'mcq', difficulty: 3, correct_answer: 'A',
        options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
        explanation: '', estimated_time_seconds: 60 });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const deleteQuestion = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setQuestions(prev => prev.filter(q => q.question_id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const diffColors = ['', 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300', 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'];
  const diffLabels = ['', 'Easy', 'Easy-Med', 'Medium', 'Med-Hard', 'Hard'];

  const cards = [
    { label: 'Total Students', value: stats?.total_students ?? 0, icon: Users, grad: 'from-blue-500 to-indigo-600' },
    { label: 'Active Today', value: stats?.active_today ?? 0, icon: TrendingUp, grad: 'from-emerald-500 to-teal-600' },
    { label: 'Tests This Week', value: stats?.tests_this_week ?? 0, icon: ClipboardList, grad: 'from-violet-500 to-purple-600' },
    { label: 'Avg Score', value: `${Math.round(stats?.avg_score ?? 0)}%`, icon: Award, grad: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Questions</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Question Bank</h1>
            <p className="text-white/70 text-sm mt-1.5">Add & manage MCQ questions</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-colors mt-1 flex-shrink-0">
            <Plus size={15} /> Add Question
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className={C + " p-4 shadow-sm"}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
        {showForm && (
          <div className={C + " p-6 shadow-sm mb-6 space-y-4"}>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">New Question</h2>
            <textarea value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
              rows={3} placeholder="Question text..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
            {form.options.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-2">
                <span className="w-6 text-sm font-medium text-gray-600 dark:text-gray-400">{opt.id}.</span>
                <input value={opt.text} onChange={e => setForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? { ...o, text: e.target.value } : o) }))}
                  className={inputCls} placeholder={`Option ${opt.id}`} />
              </div>
            ))}
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Correct Answer</label>
                <select value={form.correct_answer} onChange={e => setForm(f => ({ ...f, correct_answer: e.target.value }))}
                  className="ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-1.5 text-sm">
                  {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Difficulty</label>
                <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}
                  className="ml-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-1.5 text-sm">
                  {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{diffLabels[d]}</option>)}
                </select>
              </div>
              <button onClick={saveQuestion} disabled={saving} className="ml-auto bg-emerald-600 text-white text-sm px-5 py-2 rounded-xl hover:bg-emerald-500 disabled:opacity-60 transition-colors">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Explanation (optional)</label>
              <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                rows={2} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" placeholder="Explain the correct answer..." />
            </div>
          </div>
        )}

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Search questions..." />
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
        ) : questions.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No questions found</p>
        ) : (
          <div className="space-y-2">
            {questions.map(q => (
              <div key={q.question_id} className={C + " p-4 shadow-sm"}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-100 line-clamp-2">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${diffColors[q.difficulty]}`}>{diffLabels[q.difficulty]}</span>
                      {q.concept_name && <span className="text-xs text-gray-400">{q.concept_name}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteQuestion(q.question_id)} className="text-red-400 hover:text-red-500 p-1 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
