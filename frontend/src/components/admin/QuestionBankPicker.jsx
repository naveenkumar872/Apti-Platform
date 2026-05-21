import { useEffect, useState } from 'react';
import {
  Search, BookOpen, Loader2, CheckSquare, Square, Plus, Sparkles, Zap, Brain, Layers
} from 'lucide-react';
import api from '../../services/api';

const FILTERS = [
  { key: 'all',    label: 'All',    icon: Layers },
  { key: 'easy',   label: 'Easy',   icon: Sparkles },
  { key: 'medium', label: 'Medium', icon: Zap },
  { key: 'hard',   label: 'Hard',   icon: Brain },
];

function difficultyMeta(d) {
  if (d <= 2) return { label: 'Easy',   tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' };
  if (d === 3) return { label: 'Medium', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' };
  return            { label: 'Hard',   tone: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' };
}

/**
 * Pick existing questions from the question bank to add to the test.
 * Passes the picked questions back via onAdd(picked: Question[]).
 *
 * Already-added questions (matched by question_id) are visually marked + disabled.
 */
export default function QuestionBankPicker({ alreadyAdded = [], onAdd }) {
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [selected,  setSelected]  = useState(new Set());
  const [subjects,  setSubjects]  = useState([]);
  const [subjectId, setSubjectId] = useState('');

  const addedIds = new Set(alreadyAdded.map(q => q.question_id).filter(Boolean));

  useEffect(() => {
    api.get('/admin/subjects')
      .then(r => setSubjects(r.data.subjects || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 200 };
    if (search) params.search = search;
    if (filter !== 'all') params.difficulty = filter;
    if (subjectId) params.subject_id = subjectId;
    api.get('/admin/questions', { params })
      .then(r => setQuestions(r.data.questions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filter, subjectId]);

  const toggle = (id) => {
    if (addedIds.has(id)) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const eligible = questions.filter(q => !addedIds.has(q.question_id)).map(q => q.question_id);
    const everyOn = eligible.length > 0 && eligible.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (everyOn) eligible.forEach(id => next.delete(id));
      else         eligible.forEach(id => next.add(id));
      return next;
    });
  };

  const addSelected = () => {
    if (selected.size === 0) return;
    // Map DB rows to the shape Step2 expects, then mark from_bank=true so the
    // backend reuses the existing question_id instead of duplicating.
    const picked = questions
      .filter(q => selected.has(q.question_id))
      .map(q => {
        let options = q.options;
        if (typeof options === 'string') {
          try { options = JSON.parse(options); } catch { /* */ }
        }
        // Backend stores options as { id, text } shape — pass through unchanged.
        return {
          question_id:    q.question_id,
          from_bank:      true,
          question_text:  q.question_text,
          question_type:  q.question_type || 'mcq',
          options:        Array.isArray(options) ? options : [],
          correct_answer: q.correct_answer,
          explanation:    q.explanation || '',
          difficulty:     q.difficulty || 3,
          concept_id:     q.concept_id || null,
        };
      });
    onAdd(picked);
    setSelected(new Set());
  };

  const visibleSelectable = questions.filter(q => !addedIds.has(q.question_id));
  const allSelected = visibleSelectable.length > 0 && visibleSelectable.every(q => selected.has(q.question_id));

  return (
    <div className="p-4 bg-indigo-50/60 dark:bg-indigo-500/[0.06] rounded-xl border border-indigo-100 dark:border-indigo-500/20">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 text-[14px]">
          <BookOpen size={16} /> Pick from Question Bank
        </h3>
        <button
          onClick={addSelected}
          disabled={selected.size === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[12.5px] font-bold transition-colors disabled:opacity-50">
          <Plus size={13} /> Add {selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>

      {/* Search + subject + difficulty filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search question text…"
            className="w-full pl-9 pr-3 py-2 rounded-md text-[12.5px] bg-white dark:bg-white/[0.04] border border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-[3px] focus:ring-indigo-500/15 transition-all" />
        </div>
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
          className="px-3 py-2 rounded-md text-[12.5px] bg-white dark:bg-white/[0.04] border border-indigo-200 dark:border-indigo-500/30 text-slate-900 dark:text-white focus:outline-none">
          <option value="">All subjects</option>
          {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
        </select>
        <div className="inline-flex bg-white dark:bg-white/[0.04] border border-indigo-200 dark:border-indigo-500/30 rounded-md p-0.5">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11.5px] font-semibold transition-colors ${
                filter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}>
              <f.icon size={11} /> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select all + count */}
      {questions.length > 0 && (
        <div className="flex items-center justify-between text-[11.5px] mb-2 px-1">
          <button onClick={selectAllVisible}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-600 transition-colors">
            {allSelected ? <Square size={12} /> : <CheckSquare size={12} />}
            {allSelected ? 'Clear selection' : `Select all ${visibleSelectable.length}`}
          </button>
          <span className="text-slate-500 dark:text-slate-400">
            {questions.length} question{questions.length === 1 ? '' : 's'} · {selected.size} selected
          </span>
        </div>
      )}

      {/* Question list */}
      <div className="max-h-72 overflow-y-auto rounded-md bg-white dark:bg-[#0e0e15] border border-indigo-100 dark:border-indigo-500/20">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={16} className="animate-spin text-indigo-400" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-10 text-[12.5px] text-slate-500 dark:text-slate-400">
            <BookOpen size={20} className="mx-auto mb-2 text-slate-400" />
            No questions match. Try a different filter or add questions to the bank first.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {questions.map((q, idx) => {
              const meta = difficultyMeta(q.difficulty);
              const isAdded = addedIds.has(q.question_id);
              const isSel = selected.has(q.question_id);
              return (
                <li key={q.question_id}
                    onClick={() => toggle(q.question_id)}
                    className={`flex items-start gap-3 px-3 py-2.5 transition-colors ${
                      isAdded ? 'opacity-50 cursor-not-allowed' :
                      isSel   ? 'bg-indigo-50 dark:bg-indigo-500/10 cursor-pointer' :
                                'hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer'
                    }`}>
                  <span className="flex-shrink-0 mt-0.5">
                    {isAdded
                      ? <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-200 dark:bg-white/[0.06] text-[9px] font-bold text-slate-500 dark:text-slate-400">✓</span>
                      : isSel
                        ? <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-indigo-600 text-white"><CheckSquare size={12} /></span>
                        : <span className="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-300 dark:border-white/15"></span>}
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-400 mt-0.5 flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">{q.question_text}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[10.5px]">
                      <span className={`font-bold px-1.5 py-0.5 rounded ${meta.tone}`}>{meta.label}</span>
                      <span className="text-slate-500 dark:text-slate-400">{q.subject_name}</span>
                      {q.topic_name && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-slate-500 dark:text-slate-400">{q.topic_name}</span>
                        </>
                      )}
                      {isAdded && <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-auto">Added</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
