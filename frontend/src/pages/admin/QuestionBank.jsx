import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';

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

  const diffColors = ['', 'bg-green-100 text-green-700', 'bg-lime-100 text-lime-700', 'bg-yellow-100 text-yellow-700', 'bg-orange-100 text-orange-700', 'bg-red-100 text-red-700'];
  const diffLabels = ['', 'Easy', 'Easy-Med', 'Medium', 'Med-Hard', 'Hard'];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Question Bank</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> Add Question
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">New Question</h2>
          <textarea value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
            rows={3} placeholder="Question text..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          {form.options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="w-6 text-sm font-medium">{opt.id}.</span>
              <input value={opt.text} onChange={e => setForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? { ...o, text: e.target.value } : o) }))}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none" placeholder={`Option ${opt.id}`} />
            </div>
          ))}
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-600">Correct Answer</label>
              <select value={form.correct_answer} onChange={e => setForm(f => ({ ...f, correct_answer: e.target.value }))}
                className="ml-2 border rounded-lg px-3 py-1.5 text-sm">
                {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: Number(e.target.value) }))}
                className="ml-2 border rounded-lg px-3 py-1.5 text-sm">
                {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{diffLabels[d]}</option>)}
              </select>
            </div>
            <button onClick={saveQuestion} disabled={saving} className="ml-auto bg-green-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">Explanation (optional)</label>
            <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
              rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" placeholder="Explain the correct answer..." />
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search questions..." />
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : questions.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No questions found</p>
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.question_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 line-clamp-2">{q.question_text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${diffColors[q.difficulty]}`}>{diffLabels[q.difficulty]}</span>
                    {q.concept_name && <span className="text-xs text-gray-400">{q.concept_name}</span>}
                  </div>
                </div>
                <button onClick={() => deleteQuestion(q.question_id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
