import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Trash2, HelpCircle, Upload, FileDown,
  Layers, Zap, Brain, Sparkles, Loader2, BookOpen
} from 'lucide-react';
import BulkImportModal from '../../components/admin/BulkImportModal';
import { useConfirm } from '../../components/ConfirmDialog';

const CARD = "bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.06] rounded-2xl";
const inputCls = "w-full bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-violet-500 focus:ring-[3px] focus:ring-violet-500/15 transition-all";

function difficultyMeta(d) {
  if (d <= 2) return { label: 'Easy',   tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' };
  if (d === 3) return { label: 'Medium', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' };
  return            { label: 'Hard',   tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' };
}

const FILTERS = [
  { key: 'all',    label: 'All',    icon: Layers },
  { key: 'easy',   label: 'Easy',   icon: Sparkles },
  { key: 'medium', label: 'Medium', icon: Zap },
  { key: 'hard',   label: 'Hard',   icon: Brain },
];

export default function QuestionBank() {
  const { confirm, dialog: confirmDialog } = useConfirm();

  const [stats,    setStats]    = useState(null);
  const [questions,setQuestions]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({
    question_text: '', question_type: 'mcq', difficulty: 3, correct_answer: 'A',
    options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
    explanation: '',
  });
  const [saving, setSaving] = useState(false);

  /* ── data loaders ── */
  const fetchStats = () =>
    api.get('/admin/questions/stats').then(r => setStats(r.data)).catch(() => {});

  const fetchQuestions = () => {
    setLoading(true);
    const params = { limit: 200 };
    if (search) params.search = search;
    if (filter !== 'all') params.difficulty = filter;
    api.get('/admin/questions', { params })
      .then(r => setQuestions(r.data.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchQuestions(); }, [search, filter]);

  /* ── actions ── */
  const saveQuestion = async () => {
    if (!form.question_text.trim()) { toast.error('Question text required'); return; }
    if (form.options.some(o => !o.text.trim())) { toast.error('All four options required'); return; }
    setSaving(true);
    try {
      await api.post('/admin/questions', form);
      toast.success('Question added');
      setShowForm(false);
      setForm({
        question_text: '', question_type: 'mcq', difficulty: 3, correct_answer: 'A',
        options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
        explanation: '',
      });
      fetchStats();
      fetchQuestions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSaving(false); }
  };

  const deleteQuestion = async (id) => {
    const ok = await confirm({
      title: 'Delete this question?',
      message: 'It will be removed from the bank and from any unattempted tests using it.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setQuestions(prev => prev.filter(q => q.question_id !== id));
      fetchStats();
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const downloadTemplate = () => {
    api.get('/admin/questions/import/template', { responseType: 'blob' })
      .then(res => {
        const url = URL.createObjectURL(res.data);
        const a = document.createElement('a');
        a.href = url; a.download = 'question-import-template.csv';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error('Could not download template'));
  };

  /* ── stat cards: contextual to Question Bank ── */
  const statCards = [
    { label: 'Total questions', value: stats?.total_questions ?? 0, icon: HelpCircle, tint: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { label: 'Easy',            value: stats?.easy ?? 0,            icon: Sparkles,   tint: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Medium',          value: stats?.medium ?? 0,          icon: Zap,        tint: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Hard',            value: stats?.hard ?? 0,            icon: Brain,      tint: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  return (
    <div className="w-full min-h-full flex flex-col bg-slate-50 dark:bg-[#09090d]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Questions</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Question Bank</h1>
            <p className="text-white/70 text-sm mt-1.5">Add &amp; manage MCQ questions</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={downloadTemplate}
              className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[12.5px] font-semibold px-3 py-2 rounded-lg backdrop-blur-sm transition-colors">
              <FileDown size={13} /> Template
            </button>
            <button onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-[13px] font-semibold px-3.5 py-2 rounded-lg backdrop-blur-sm transition-colors">
              <Upload size={13} /> Bulk import
            </button>
            <button onClick={() => setShowForm(s => !s)}
              className="inline-flex items-center gap-1.5 bg-white text-amber-700 hover:bg-amber-50 text-[13px] font-bold px-3.5 py-2 rounded-lg transition-colors">
              <Plus size={13} /> Add question
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-8">
        {/* Stat cards — page-specific */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(c => (
            <div key={c.label} className={CARD + ' p-5'}>
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-4`}>
                <c.icon size={16} className={c.tint} strokeWidth={2.25} />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{c.value}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Add Question form */}
        {showForm && (
          <div className={CARD + ' p-6 mb-6 animate-fade-in-up'}>
            <h2 className="text-[14.5px] font-semibold text-slate-900 dark:text-white mb-4">New question</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Question text *</label>
                <textarea value={form.question_text}
                  onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
                  rows={3} className={inputCls + ' resize-none'}
                  placeholder="Type the question..." />
              </div>
              {form.options.map((o, i) => (
                <div key={o.id} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 text-[12px] font-bold flex items-center justify-center flex-shrink-0">{o.id}</span>
                  <input value={o.text} onChange={e => setForm(f => ({ ...f, options: f.options.map((x, j) => j === i ? { ...x, text: e.target.value } : x) }))}
                    className={inputCls} placeholder={`Option ${o.id}`} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Correct answer</label>
                  <select value={form.correct_answer} onChange={e => setForm(f => ({ ...f, correct_answer: e.target.value }))}
                    className={inputCls}>
                    {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Difficulty (1-5)</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: parseInt(e.target.value) }))}
                    className={inputCls}>
                    {[1, 2, 3, 4, 5].map(d => <option key={d} value={d}>{d} · {difficultyMeta(d).label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-slate-600 dark:text-slate-400 mb-1.5">Explanation (optional)</label>
                <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                  rows={2} className={inputCls + ' resize-none'}
                  placeholder="Why is this the right answer?" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                  Cancel
                </button>
                <button onClick={saveQuestion} disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
                  {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Plus size={13} /> Save</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search + filter row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search questions…"
              className={inputCls + ' pl-9'} />
          </div>
          <div className="inline-flex bg-slate-100 dark:bg-white/[0.04] rounded-lg p-0.5">
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                  filter === f.key
                    ? 'bg-white dark:bg-[#161620] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}>
                <f.icon size={12} /> {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-200 dark:bg-white/[0.04] animate-pulse rounded-xl" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className={CARD + ' p-10 text-center'}>
            <BookOpen size={26} className="text-slate-400 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">No questions yet</p>
            <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
              {search || filter !== 'all'
                ? 'No questions match your current filters.'
                : 'Add one manually or bulk-import a CSV to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {questions.map((q, idx) => {
              const meta = difficultyMeta(q.difficulty);
              return (
                <div key={q.question_id} className={CARD + ' p-4 flex items-start gap-4 group hover:border-violet-300 dark:hover:border-violet-500/30 transition-colors'}>
                  {/* Number badge */}
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 text-[12px] font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">{q.question_text}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      <span className={`font-bold px-1.5 py-0.5 rounded ${meta.tone}`}>{meta.label}</span>
                      <span className="text-slate-500 dark:text-slate-400">{q.subject_name}</span>
                      {q.topic_name && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-slate-500 dark:text-slate-400">{q.topic_name}</span>
                        </>
                      )}
                      {q.source && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-slate-400 dark:text-slate-500 capitalize">{q.source.replace('_', ' ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteQuestion(q.question_id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-2">
              Showing {questions.length} question{questions.length === 1 ? '' : 's'}{filter !== 'all' ? ` · filter: ${filter}` : ''}
            </p>
          </div>
        )}
      </div>

      {showImport && (
        <BulkImportModal
          onClose={() => setShowImport(false)}
          onComplete={() => { fetchQuestions(); fetchStats(); }}
        />
      )}
      {confirmDialog}
    </div>
  );
}
