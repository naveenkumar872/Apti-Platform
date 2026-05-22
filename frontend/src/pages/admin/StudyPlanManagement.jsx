import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../../components/ConfirmDialog';
import {
  Users, Search, ChevronRight, Sparkles, Plus, Trash2,
  CalendarDays, CheckCircle2, Video, FileText, FlaskConical,
  Target, Loader2, Clock, AlertCircle, Lock, Unlock, X,
  Play, ExternalLink, StickyNote, ArrowLeft, BookOpen, Circle,
  PlayCircle, Download, Zap, CheckSquare, Square
} from 'lucide-react';

const C = 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl';

const TASK_CFG = {
  video:    { icon: Video,        color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',      border: 'border-red-200 dark:border-red-800/40',    label: 'Video'    },
  pdf:      { icon: FileText,     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800/40',   label: 'PDF'      },
  practice: { icon: FlaskConical, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20',border: 'border-violet-200 dark:border-violet-800/40',label: 'Practice' },
  test:     { icon: Target,       color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800/40', label: 'Test'     },
  note:     { icon: StickyNote,   color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20',  border: 'border-green-200 dark:border-green-800/40', label: 'Note'     },
};

function getYTId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/);
  return m ? m[1] : null;
}

/* ── Video thumbnail card (mirrors student side) ── */
function VideoThumbCard({ material, onDelete, selectMode, selected, onSelect }) {
  const vid = getYTId(material.file_url);
  const thumb = vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
  const href = material.file_url?.startsWith('http') ? material.file_url
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(material.description || material.title)}`;
  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-sm border bg-white dark:bg-gray-900 transition-all relative group ${
        selected
          ? 'border-violet-500 ring-2 ring-violet-500/40'
          : 'border-gray-100 dark:border-gray-800'
      } ${selectMode ? 'cursor-pointer' : ''}`}
      onClick={() => selectMode && onSelect(material.material_id)}
    >
      <div className="aspect-video relative overflow-hidden bg-gray-900">
        {thumb ? (
          <img src={thumb} alt={material.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center px-4">
            <PlayCircle size={36} className="text-white/80 mb-2" />
            <p className="text-white/60 text-xs text-center line-clamp-2">{material.description}</p>
          </div>
        )}
        {selectMode ? (
          <div className="absolute top-2 left-2 z-10"><SelectMark selected={selected} /></div>
        ) : (
          <>
            <a href={href} target="_blank" rel="noreferrer"
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-all">
              <span className="flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl">
                <Play size={13} fill="currentColor" />{vid ? 'Watch Video' : 'Search YouTube'}
              </span>
            </a>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(material.material_id); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete from library">
                <Trash2 size={12} />
              </button>
            )}
          </>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">{material.title}</p>
        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{material.description}</p>
      </div>
    </div>
  );
}

/* ── Bullet card (mirrors student shortcuts / formulas) ── */
function BulletCard({ title, content, icon: Icon, grad, borderCls, materialId, onDelete, selectMode, selected, onSelect }) {
  const [open, setOpen] = useState(true);
  const lines = (content || '').split('\n').filter(l => l.trim());
  const handleDownload = (e) => {
    e.stopPropagation();
    const text = `${title}\n${'-'.repeat(50)}\n\n` + lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = title.replace(/[^a-z0-9_\s]/gi, '').trim().replace(/\s+/g, '_') + '.txt';
    a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        selected ? 'border-violet-500 ring-2 ring-violet-500/40' : borderCls
      } ${selectMode ? 'cursor-pointer' : ''}`}
      onClick={() => selectMode && materialId && onSelect(materialId)}
    >
      <div className={'flex items-center justify-between px-5 py-3.5 bg-gradient-to-r ' + grad}>
        <div className="flex items-center gap-2.5">
          {selectMode && <SelectMark selected={selected} />}
          <Icon size={16} className="text-white" />
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        {!selectMode && (
          <div className="flex items-center gap-2">
            <button onClick={handleDownload} title="Download"
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
              <Download size={12} />
            </button>
            {onDelete && materialId && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(materialId); }} title="Delete from library"
                className="p-1 rounded-lg bg-white/20 hover:bg-red-500/60 text-white transition-colors">
                <Trash2 size={12} />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
              <ChevronRight size={14} className={'transition-transform ' + (open ? 'rotate-90' : '')} />
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className="p-5">
          {lines.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No content available.</p>
          ) : (
            <ul className="space-y-2">
              {lines.map((line, i) => {
                const text = line.replace(/^[•\-*]\s*/, '').trim();
                return text ? (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    <span>{text}</span>
                  </li>
                ) : null;
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   LEVEL 3: Task detail card (inside day view)
────────────────────────────────────────────── */
function TaskDetailCard({ task, onRemove }) {
  const cfg = TASK_CFG[task.task_type] || TASK_CFG.note;
  const Icon = cfg.icon;
  const ytId = getYTId(task.url);

  return (
    <div className={`rounded-2xl border ${task.is_completed ? 'border-green-200 dark:border-green-800/40 bg-green-50/40 dark:bg-green-900/10' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'} overflow-hidden`}>
      {/* Colored top strip */}
      <div className={`h-1 w-full bg-gradient-to-r ${
        task.task_type === 'video' ? 'from-red-400 to-rose-500' :
        task.task_type === 'pdf' ? 'from-blue-400 to-indigo-500' :
        task.task_type === 'practice' ? 'from-violet-400 to-purple-500' :
        task.task_type === 'test' ? 'from-amber-400 to-orange-500' :
        'from-green-400 to-emerald-500'}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center mt-0.5`}>
            <Icon size={16} className={cfg.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`font-semibold text-sm leading-snug ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                  {task.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
                    <Icon size={10} />{cfg.label}
                  </span>
                  {task.estimated_minutes && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} />{task.estimated_minutes} min
                    </span>
                  )}
                  {task.is_completed ? (
                    <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                      <CheckCircle2 size={11} />Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Circle size={10} />Pending
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => onRemove(task.task_id)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Admin note */}
            {task.content && (
              <div className="mt-3 px-3 py-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30">
                <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <StickyNote size={9} />Admin Note
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed whitespace-pre-line">{task.content}</p>
              </div>
            )}

            {/* YouTube link */}
            {task.url && ytId && (
              <a href={task.url} target="_blank" rel="noreferrer"
                className="mt-3 flex items-center gap-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-red-400 dark:hover:border-red-500 transition-colors group">
                <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumb" className="w-24 h-14 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0 py-1">
                  <p className="text-xs font-bold text-red-500 flex items-center gap-1 mb-0.5">
                    <Play size={10} fill="currentColor" />Watch on YouTube
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{task.url}</p>
                </div>
                <ExternalLink size={13} className="text-gray-400 mr-3 flex-shrink-0 group-hover:text-red-400" />
              </a>
            )}
            {/* Regular link */}
            {task.url && !ytId && (
              <a href={task.url} target="_blank" rel="noreferrer"
                className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 hover:border-blue-400 transition-colors text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <ExternalLink size={12} /><span className="truncate">{task.url}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   LEVEL 2: Day cards (shown after clicking week)
────────────────────────────────────────────── */
function DayCard({ day, tasks, onSelect }) {
  const typeCounts = tasks.reduce((a, t) => { a[t.task_type] = (a[t.task_type] || 0) + 1; return a; }, {});
  const done = tasks.filter(t => t.is_completed).length;
  const hasContent = tasks.length > 0;

  return (
    <button onClick={onSelect}
      className={`${C} p-4 text-left transition-all group w-full ${
        hasContent
          ? 'hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md hover:shadow-violet-900/10'
          : 'opacity-60 hover:opacity-80 border-dashed'
      }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 ${
            hasContent
              ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-900/20'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}>
            {day}
          </div>
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Day {day}</p>
            <p className="text-xs text-gray-400">
              {hasContent ? `${done}/${tasks.length} complete` : 'No tasks yet'}
            </p>
          </div>
        </div>
        <ChevronRight size={15} className="text-gray-300 group-hover:text-violet-500 transition-colors flex-shrink-0" />
      </div>

      {/* Task type pills */}
      {hasContent ? (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(typeCounts).map(([type, count]) => {
            const cfg = TASK_CFG[type] || TASK_CFG.note;
            const Icon = cfg.icon;
            return (
              <span key={type} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                <Icon size={9} />{count} {cfg.label}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
          <Plus size={12} />Click to add tasks
        </div>
      )}

      {/* First 2 task names as preview */}
      {tasks.slice(0, 2).map(t => (
        <p key={t.task_id} className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-relaxed">
          • {t.description}
        </p>
      ))}
      {tasks.length > 2 && (
        <p className="text-[11px] text-gray-400 mt-0.5">+{tasks.length - 2} more tasks</p>
      )}

      {/* Progress micro-bar */}
      {hasContent && (
        <div className="mt-3 w-full h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
            style={{ width: `${Math.round((done / tasks.length) * 100)}%` }} />
        </div>
      )}
    </button>
  );
}

/* ──────────────────────────────────────────────
   LEVEL 1: Week cards (shown on plan overview)
────────────────────────────────────────────── */
function WeekCard({ week, tasks, locked, onSelect, onToggleLock }) {
  const done = tasks.filter(t => t.is_completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const daysFilled = [...new Set(tasks.map(t => t.day_number))].length;
  const typeCounts = tasks.reduce((a, t) => { a[t.task_type] = (a[t.task_type] || 0) + 1; return a; }, {});

  // Extract unique topic hints from descriptions
  const topicHints = [...new Set(
    tasks.map(t => {
      const desc = t.description || '';
      // Try to extract topic after "on", "for", "about"
      const m = desc.match(/(?:on|for|about)\s+(.+?)(?:\s*\(|$)/i);
      return m ? m[1].trim() : null;
    }).filter(Boolean)
  )].slice(0, 2);

  return (
    <button onClick={onSelect}
      className={`${C} p-4 text-left transition-all hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-900/10 w-full group`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-violet-900/20">
            {week}
          </div>
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Week {week}</p>
            <p className="text-xs text-gray-400">{daysFilled} day{daysFilled !== 1 ? 's' : ''} • {tasks.length} tasks</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleLock(week); }}
          className={`p-1.5 rounded-lg transition-colors ${locked
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
            : 'text-gray-300 dark:text-gray-600 hover:text-amber-500'}`}
          title={locked ? 'Locked – student cannot skip' : 'Unlocked'}>
          {locked ? <Lock size={13} /> : <Unlock size={13} />}
        </button>
      </div>

      {/* Topic names */}
      {topicHints.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {topicHints.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
              <BookOpen size={9} />{t}
            </span>
          ))}
        </div>
      )}

      {/* Type pills */}
      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[20px]">
        {Object.entries(typeCounts).map(([type, count]) => {
          const cfg = TASK_CFG[type] || TASK_CFG.note;
          const Icon = cfg.icon;
          return (
            <span key={type} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
              <Icon size={9} />{count} {cfg.label}
            </span>
          );
        })}
        {tasks.length === 0 && <span className="text-xs text-gray-400 italic">No tasks yet</span>}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
            style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-gray-400 font-medium w-14 text-right">{done}/{tasks.length} done</span>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-gray-400 group-hover:text-violet-500 transition-colors font-medium">
        View days <ChevronRight size={11} />
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────
   Add Task / Quick Add Modal
────────────────────────────────────────────── */
function AddTaskModal({ planId, defaultWeek, defaultDay, onClose, onAdded }) {
  const [form, setForm] = useState({
    task_type: 'video',
    description: '',
    week_number: defaultWeek || 1,
    day_number: defaultDay || 1,
    estimated_minutes: 30,
    content: '',
    url: '',
  });
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  const MODAL_TYPES = ['video', 'note', 'practice'];

  const addQuestion = () => setQuestions(q => [
    ...q,
    { text: '', optA: '', optB: '', optC: '', optD: '', answer: 'A' }
  ]);
  const removeQuestion = (i) => setQuestions(q => q.filter((_, idx) => idx !== i));
  const updateQuestion = (i, field, value) =>
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error('Description required'); return; }
    if (form.task_type === 'practice' && questions.length === 0) {
      toast.error('Add at least one question'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (form.task_type === 'practice') {
        payload.content = JSON.stringify(questions);
        delete payload.url;
      } else {
        if (!payload.content.trim()) delete payload.content;
        if (!payload.url.trim()) delete payload.url;
      }
      await api.put(`/admin/plans/${planId}`, { tasks_to_add: [payload] });
      toast.success('Task added');
      onAdded();
    } catch { toast.error('Failed to add task'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${C} w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Add Material</h3>
            <p className="text-xs text-gray-400 mt-0.5">Week {form.week_number}, Day {form.day_number}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          {/* Type — Video / Note / Practice only */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Type</label>
            <div className="grid grid-cols-3 gap-3">
              {MODAL_TYPES.map(type => {
                const cfg = TASK_CFG[type];
                const isSelected = form.task_type === type;
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, task_type: type }))}
                    className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600 shadow-md shadow-violet-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400'
                    }`}
                  >
                    <Icon size={20} className={isSelected ? 'text-white' : cfg.color} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Week + Day + Minutes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Week</label>
              <input type="number" min={1} max={12} value={form.week_number}
                onChange={e => setForm(f => ({ ...f, week_number: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Day</label>
              <select value={form.day_number} onChange={e => setForm(f => ({ ...f, day_number: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-500">
                {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>Day {d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Minutes</label>
              <input type="number" min={5} max={180} value={form.estimated_minutes}
                onChange={e => setForm(f => ({ ...f, estimated_minutes: parseInt(e.target.value) || 30 }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Title / Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              {form.task_type === 'video' ? 'Video Title *' :
               form.task_type === 'note'  ? 'Note Title *' : 'Practice Title *'}
            </label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder={
                form.task_type === 'video'    ? 'e.g. Number System – Video Tutorial' :
                form.task_type === 'note'     ? 'e.g. Quick Tricks and Shortcuts' :
                                               'e.g. Practice – Number System'
              }
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* ── VIDEO: YouTube URL + optional admin note ── */}
          {form.task_type === 'video' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
                  <Play size={11} className="text-red-500" />YouTube Link *
                </label>
                <input type="url" value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/10 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
                  <StickyNote size={11} className="text-yellow-500" />Admin Note
                  <span className="text-gray-400 normal-case font-normal ml-1">(optional)</span>
                </label>
                <textarea value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Tips or instructions shown to the student..." rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-900/10 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-yellow-400 resize-none"
                />
              </div>
            </>
          )}

          {/* ── NOTE: bullet content + optional doc link ── */}
          {form.task_type === 'note' && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
                  <StickyNote size={11} className="text-amber-500" />Note Content
                  <span className="text-gray-400 normal-case font-normal ml-1">(each line = bullet point)</span>
                </label>
                <textarea value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder={"• Basic: trick one\n• Intermediate: trick two\n• Advanced: trick three"}
                  rows={6}
                  className="w-full px-3 py-2 rounded-xl border border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-900/10 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-yellow-400 resize-none font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
                  <ExternalLink size={11} className="text-blue-500" />Document / PDF Link
                  <span className="text-gray-400 normal-case font-normal ml-1">(optional – Google Docs / Drive / URL)</span>
                </label>
                <input type="url" value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://docs.google.com/... or any PDF URL"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
                />
              </div>
            </>
          )}

          {/* ── PRACTICE: question builder ── */}
          {form.task_type === 'practice' && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <FlaskConical size={11} className="text-violet-500" />Questions
                  <span className="text-gray-400 normal-case font-normal ml-1">({questions.length} added)</span>
                </label>
                <button type="button" onClick={addQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors border border-violet-200 dark:border-violet-800/40">
                  <Plus size={12} />Add Question
                </button>
              </div>

              {questions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-7 rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-800/40 text-center">
                  <FlaskConical size={24} className="text-violet-300 mb-2" />
                  <p className="text-sm text-gray-400 font-medium">No questions yet</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click &quot;Add Question&quot; to start building</p>
                </div>
              )}

              <div className="space-y-4 mt-2">
                {questions.map((q, i) => (
                  <div key={i} className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-900/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase">Question {i + 1}</span>
                      <button type="button" onClick={() => removeQuestion(i)}
                        className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <textarea
                      value={q.text}
                      onChange={e => updateQuestion(i, 'text', e.target.value)}
                      placeholder="Enter question text..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-400 resize-none mb-3"
                    />
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                            q.answer === opt ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}>{opt}</span>
                          <input
                            value={q[`opt${opt}`]}
                            onChange={e => updateQuestion(i, `opt${opt}`, e.target.value)}
                            placeholder={`Option ${opt}`}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-400"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide">Correct:</span>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <button key={opt} type="button"
                          onClick={() => updateQuestion(i, 'answer', opt)}
                          className={`w-7 h-7 rounded-full text-xs font-black transition-all ${
                            q.answer === opt
                              ? 'bg-green-500 text-white shadow-sm shadow-green-500/40'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {form.task_type === 'practice' ? `Add Practice (${questions.length}Q)` : 'Add Material'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Selection checkbox badge (shown in select mode)
────────────────────────────────────────────── */
function SelectMark({ selected }) {
  return (
    <span className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors ${
      selected
        ? 'bg-violet-600 border-violet-600 text-white'
        : 'bg-white/90 dark:bg-gray-900/80 border-gray-300 dark:border-gray-600 text-transparent'
    }`}>
      <CheckCircle2 size={14} />
    </span>
  );
}

/* ──────────────────────────────────────────────
   Admin Video Card (red thumbnail, like student side)
────────────────────────────────────────────── */
function AdminVideoCard({ task, onRemove, selectMode, selected, onSelect }) {
  const ytId = getYTId(task.url);
  const handleCardClick = (e) => {
    if (selectMode) { e.preventDefault(); e.stopPropagation(); onSelect(task.task_id); return; }
    if (task.url) window.open(task.url, '_blank');
  };
  return (
    <div className={`rounded-2xl overflow-hidden border group bg-gray-900 transition-all ${
      selected ? 'border-violet-500 ring-2 ring-violet-500/40' : 'border-gray-700'
    }`}>
      <div
        className="relative bg-red-700 aspect-video flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {ytId ? (
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt="thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <Play size={40} className="text-white/40" />
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/70 bg-black/40 flex items-center justify-center">
            <Play size={18} className="text-white ml-0.5" fill="currentColor" />
          </div>
        </div>
        {selectMode && (
          <div className="absolute top-2 left-2 z-20"><SelectMark selected={selected} /></div>
        )}
        {!selectMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(task.task_id); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10"
          >
            <Trash2 size={12} />
          </button>
        )}
        {task.is_completed && !selectMode && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/90 text-white text-[10px] font-bold">
            <CheckCircle2 size={10} />Done
          </div>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-sm font-bold text-white leading-snug">{task.description}</p>
        {task.estimated_minutes && (
          <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
            <Clock size={10} />{task.estimated_minutes} min
          </p>
        )}
        {task.content && (
          <div className="mt-2 p-2 rounded-lg bg-yellow-900/30 border border-yellow-700/30">
            <p className="text-[10px] text-yellow-400 font-bold uppercase mb-0.5 flex items-center gap-1">
              <StickyNote size={9} />Admin Note
            </p>
            <p className="text-[11px] text-yellow-200/80">{task.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Admin Note Card (collapsible, like student BulletCard)
────────────────────────────────────────────── */
const NOTE_COLOR_PALETTES = [
  { grad: 'from-amber-500 to-orange-500', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  { grad: 'from-rose-500 to-pink-600',    border: 'border-rose-200 dark:border-rose-900',   dot: 'bg-rose-500' },
  { grad: 'from-teal-500 to-cyan-600',    border: 'border-teal-200 dark:border-teal-800',   dot: 'bg-teal-500' },
  { grad: 'from-indigo-500 to-violet-600',border: 'border-indigo-200 dark:border-indigo-800',dot: 'bg-indigo-500' },
];

function AdminNoteCard({ task, index, onRemove, selectMode, selected, onSelect }) {
  const [open, setOpen] = useState(true);
  const { grad, border, dot } = NOTE_COLOR_PALETTES[index % NOTE_COLOR_PALETTES.length];
  const lines = (task.content || '').split('\n').filter(l => l.trim());

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        selected ? 'border-violet-500 ring-2 ring-violet-500/40' : border
      } ${selectMode ? 'cursor-pointer' : ''}`}
      onClick={() => selectMode && onSelect(task.task_id)}
    >
      <div className={`flex items-center justify-between px-5 py-3.5 bg-gradient-to-r ${grad}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {selectMode && <SelectMark selected={selected} />}
          <StickyNote size={15} className="text-white flex-shrink-0" />
          <span className="font-bold text-white text-sm truncate">{task.description}</span>
          {task.estimated_minutes && (
            <span className="text-[11px] text-white/70 flex-shrink-0">{task.estimated_minutes} min</span>
          )}
        </div>
        {!selectMode && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onRemove(task.task_id); }}
              className="p-1 rounded-lg bg-white/20 hover:bg-white/40 text-white transition-colors">
              <Trash2 size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
              className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors">
              <ChevronRight size={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
            </button>
          </div>
        )}
      </div>
      {open && (
        <div className={`p-5 ${selectMode ? 'pointer-events-none' : ''}`}>
          {lines.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No content added yet.</p>
          ) : (
            <ul className="space-y-2">
              {lines.map((line, i) => {
                const text = line.replace(/^[•\-*]\s*/, '').trim();
                return text ? (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${dot} flex-shrink-0`} />
                    <span>{text}</span>
                  </li>
                ) : null;
              })}
            </ul>
          )}
          {task.url && (
            <a href={task.url} target="_blank" rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline font-medium">
              <ExternalLink size={11} />{task.url}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Admin PDF Card (blue)
────────────────────────────────────────────── */
function AdminPdfCard({ task, onRemove, selectMode, selected, onSelect }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all group ${
        selected
          ? 'border-violet-500 ring-2 ring-violet-500/40 bg-violet-50 dark:bg-violet-900/10'
          : 'border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10'
      } ${selectMode ? 'cursor-pointer' : ''}`}
      onClick={() => selectMode && onSelect(task.task_id)}
    >
      {selectMode && <SelectMark selected={selected} />}
      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
        <FileText size={16} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{task.description}</p>
        {task.content && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{task.content}</p>}
        {task.url && !selectMode && (
          <a href={task.url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5 font-medium">
            <ExternalLink size={10} />Open Resource
          </a>
        )}
      </div>
      {task.estimated_minutes && (
        <span className="text-[11px] text-gray-400 flex items-center gap-1 flex-shrink-0">
          <Clock size={10} />{task.estimated_minutes}m
        </span>
      )}
      {!selectMode && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(task.task_id); }}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Admin Task Row (practice / test)
────────────────────────────────────────────── */
function AdminTaskRow({ task, colorClass, onRemove, selectMode, selected, onSelect }) {
  const cfg = TASK_CFG[task.task_type] || TASK_CFG.practice;
  const Icon = cfg.icon;
  const colorMap = {
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/10', border: 'border-violet-200 dark:border-violet-800/40', icon: 'bg-violet-100 dark:bg-violet-900/50' },
    amber:  { bg: 'bg-amber-50 dark:bg-amber-900/10',   border: 'border-amber-200 dark:border-amber-800/40',  icon: 'bg-amber-100 dark:bg-amber-900/50'  },
  };
  const cls = colorMap[colorClass] || colorMap.violet;
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 group transition-all ${
        selected ? 'border-violet-500 ring-2 ring-violet-500/40 bg-violet-50 dark:bg-violet-900/10' : `${cls.bg} ${cls.border}`
      } ${selectMode ? 'cursor-pointer' : ''}`}
      onClick={() => selectMode && onSelect(task.task_id)}
    >
      {selectMode && <SelectMark selected={selected} />}
      <div className={`w-9 h-9 rounded-xl ${cls.icon} flex items-center justify-center flex-shrink-0`}>
        <Icon size={16} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">{task.description}</p>
        {task.content && <p className="text-xs text-gray-500 truncate mt-0.5">{task.content}</p>}
      </div>
      {task.estimated_minutes && (
        <span className="text-[11px] text-gray-400 flex items-center gap-1 flex-shrink-0">
          <Clock size={10} />{task.estimated_minutes}m
        </span>
      )}
      {task.is_completed && (
        <span className="text-[11px] text-green-500 flex items-center gap-1 flex-shrink-0">
          <CheckCircle2 size={10} />Done
        </span>
      )}
      {!selectMode && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(task.task_id); }}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function StudyPlanManagement() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [plan, setPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [lockedWeeks, setLockedWeeks] = useState({});

  // Drill-down state: null = week grid, number = day grid, {week,day} = day task view
  const [view, setView] = useState(null); // null | {level:'days', week} | {level:'tasks', week, day}

  const [addTaskModal, setAddTaskModal] = useState(null);

  // Bulk selection (day view)
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());            // plan_task ids
  const [selectedMaterialIds, setSelectedMaterialIds] = useState(() => new Set()); // material ids
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Materials from the AI library for the selected day's topic
  const [dayMaterials, setDayMaterials] = useState([]);
  const [loadingDayMaterials, setLoadingDayMaterials] = useState(false);

  // Reset selection when navigating between views / students / days
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setSelectedMaterialIds(new Set());
  }, [view?.level, view?.week, view?.day, selectedStudent?.user_id]);

  const toggleSelectTask = (taskId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const toggleSelectMaterial = (materialId) => {
    setSelectedMaterialIds(prev => {
      const next = new Set(prev);
      if (next.has(materialId)) next.delete(materialId); else next.add(materialId);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setSelectedMaterialIds(new Set());
  };

  const selectAllInDay = (taskIds, materialIds) => {
    const allTaskIds = taskIds || [];
    const allMatIds  = materialIds || [];
    if (allTaskIds.length === 0 && allMatIds.length === 0) return;
    const everyTaskSelected = allTaskIds.every(id => selectedIds.has(id));
    const everyMatSelected  = allMatIds.every(id => selectedMaterialIds.has(id));
    const allSelected = everyTaskSelected && everyMatSelected;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) allTaskIds.forEach(id => next.delete(id));
      else allTaskIds.forEach(id => next.add(id));
      return next;
    });
    setSelectedMaterialIds(prev => {
      const next = new Set(prev);
      if (allSelected) allMatIds.forEach(id => next.delete(id));
      else allMatIds.forEach(id => next.add(id));
      return next;
    });
  };

  const handleSingleMaterialDelete = async (materialId) => {
    const ok = await confirm({
      title: 'Delete this resource?',
      message: 'This will remove it from the library for every student.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/materials/${materialId}`);
      setDayMaterials(prev => prev.filter(m => m.material_id !== materialId));
      toast.success('Resource deleted');
    } catch {
      toast.error('Failed to delete resource');
    }
  };

  const handleBulkDelete = async () => {
    if (!plan) return;
    const taskIds = Array.from(selectedIds);
    const matIds  = Array.from(selectedMaterialIds);
    const total   = taskIds.length + matIds.length;
    if (total === 0) return;
    const parts = [];
    if (taskIds.length) parts.push(`${taskIds.length} plan task${taskIds.length === 1 ? '' : 's'}`);
    if (matIds.length)  parts.push(`${matIds.length} library resource${matIds.length === 1 ? '' : 's'}`);
    const bullets = [];
    if (taskIds.length) bullets.push(`Plan tasks are removed from this student's plan only.`);
    if (matIds.length)  bullets.push(`Library resources are removed globally (for every student).`);
    const ok = await confirm({
      title: `Delete ${parts.join(' and ')}?`,
      message: 'This action cannot be undone.',
      bullets,
      confirmLabel: `Delete ${total}`,
      tone: 'danger',
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      if (taskIds.length > 0) {
        await api.put(`/admin/plans/${plan.plan_id}`, { tasks_to_remove: taskIds });
        setPlan(p => ({ ...p, tasks: p.tasks.filter(t => !selectedIds.has(t.task_id)) }));
      }
      if (matIds.length > 0) {
        await Promise.all(matIds.map(id => api.delete(`/admin/materials/${id}`)));
        setDayMaterials(prev => prev.filter(m => !selectedMaterialIds.has(m.material_id)));
      }
      toast.success(`${total} item${total === 1 ? '' : 's'} removed`);
      exitSelectMode();
    } catch {
      toast.error('Failed to delete selected items');
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    api.get('/admin/users?role=student&limit=200')
      .then(r => setStudents(r.data.users || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoadingStudents(false));
  }, []);

  // Fetch materials library for the day's topic when entering Level 3
  useEffect(() => {
    if (view?.level !== 'tasks' || !plan) { setDayMaterials([]); return; }
    const dayTasks = (plan.tasks || []).filter(t => t.week_number === view.week && t.day_number === view.day);
    const videoTask = dayTasks.find(t => t.task_type === 'video');
    const topicId = videoTask?.topic_id || dayTasks[0]?.topic_id;
    if (!topicId) { setDayMaterials([]); return; }
    setLoadingDayMaterials(true);
    api.get(`/admin/materials?topic_id=${topicId}`)
      .then(r => setDayMaterials(r.data.materials || []))
      .catch(() => {})
      .finally(() => setLoadingDayMaterials(false));
  }, [view, plan]);

  const loadPlan = async (student) => {
    setSelectedStudent(student);
    setPlan(null);
    setPlans([]);
    setView(null);
    setLockedWeeks({});
    setLoadingPlan(true);
    try {
      const r = await api.get(`/admin/plans/${student.user_id}`);
      const allPlans = r.data.plans || (r.data.plan ? [r.data.plan] : []);
      setPlans(allPlans);
      setPlan(allPlans[0] || null);
    } catch { toast.error('Failed to load plan'); }
    finally { setLoadingPlan(false); }
  };

  const handleGenerate = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    try {
      const r = await api.post(`/admin/plans/${selectedStudent.user_id}/generate`);
      setPlan(r.data.plan);
      setView(null);
      toast.success('Plan generated!');
    } catch { toast.error('Failed to generate plan'); }
    finally { setGenerating(false); }
  };

  const handleRemoveTask = async (taskId) => {
    if (!plan) return;
    const ok = await confirm({
      title: 'Remove this task?',
      message: "This task will be removed from the student's plan.",
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/plans/${plan.plan_id}/tasks/${taskId}`);
      setPlan(p => ({ ...p, tasks: p.tasks.filter(t => t.task_id !== taskId) }));
      toast.success('Task removed');
    } catch { toast.error('Failed to remove task'); }
  };

  const handleTaskAdded = async () => {
    setAddTaskModal(null);
    if (!selectedStudent) return;
    setLoadingPlan(true);
    try {
      const r = await api.get(`/admin/plans/${selectedStudent.user_id}`);
      const allPlans = r.data.plans || (r.data.plan ? [r.data.plan] : []);
      setPlans(allPlans);
      const refreshed = allPlans.find(p => p.plan_id === plan?.plan_id) || allPlans[0] || null;
      setPlan(refreshed);
    } catch { /* ignore */ }
    finally { setLoadingPlan(false); }
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.batch_name?.toLowerCase().includes(search.toLowerCase())
  );

  const existingWeeks = plan ? [...new Set((plan.tasks || []).map(t => t.week_number))] : [];
  const allWeeks = plan ? Array.from({ length: plan.duration_weeks || 1 }, (_, i) => i + 1) : [];
  const finalWeeks = [...new Set([...allWeeks, ...existingWeeks])].sort((a, b) => a - b);

  const tasksByWeek = (w) => (plan?.tasks || []).filter(t => t.week_number === w);
  const tasksByDay = (w, d) => (plan?.tasks || []).filter(t => t.week_number === w && t.day_number === d);

  const completedCount = plan?.tasks?.filter(t => t.is_completed)?.length || 0;
  const totalCount = plan?.tasks?.length || 0;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  /* ── Breadcrumb header ── */
  const renderBreadcrumb = () => {
    if (!view) return null;
    if (view.level === 'days') {
      return (
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <button onClick={() => setView(null)} className="hover:text-violet-500 transition-colors font-medium">Weeks</button>
          <ChevronRight size={12} />
          <span className="text-gray-600 dark:text-gray-300 font-semibold">Week {view.week}</span>
        </div>
      );
    }
    if (view.level === 'tasks') {
      return (
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <button onClick={() => setView(null)} className="hover:text-violet-500 transition-colors font-medium">Weeks</button>
          <ChevronRight size={12} />
          <button onClick={() => setView({ level: 'days', week: view.week })} className="hover:text-violet-500 transition-colors font-medium">Week {view.week}</button>
          <ChevronRight size={12} />
          <span className="text-gray-600 dark:text-gray-300 font-semibold">Day {view.day}</span>
        </div>
      );
    }
    return null;
  };

  /* ── Plan content area ── */
  const renderPlanContent = () => {
    if (loadingPlan) return (
      <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-violet-500" /></div>
    );

    if (!plan) return (
      <div className={`${C} flex flex-col items-center justify-center py-16 text-center`}>
        <AlertCircle size={36} className="text-gray-300 mb-3" />
        <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-1">No Study Plan Yet</h3>
        <p className="text-sm text-gray-400 mb-5">Generate an AI plan based on this student's weak topics.</p>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition disabled:opacity-60">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}Generate AI Plan
        </button>
      </div>
    );

    /* === LEVEL 3: Day module view (student-style) === */
    if (view?.level === 'tasks') {
      const dayTasks      = tasksByDay(view.week, view.day);
      const noteTasks     = dayTasks.filter(t => t.task_type === 'note');
      const practiceTasks = dayTasks.filter(t => t.task_type === 'practice');
      const testTasks     = dayTasks.filter(t => t.task_type === 'test');
      // Admin-manually-added video tasks (have URL set)
      const adminVideoTasks = dayTasks.filter(t => t.task_type === 'video' && t.url);
      const pdfTasks      = dayTasks.filter(t => t.task_type === 'pdf');
      const topicName     = dayTasks[0]?.topic_name || `Week ${view.week} Topics`;
      const doneCount     = dayTasks.filter(t => t.is_completed).length;

      // Materials library
      const libVideos    = dayMaterials.filter(m => m.type === 'video');
      const libShortcut  = dayMaterials.find(m => m.type === 'shortcut');
      const libFormula   = dayMaterials.find(m => m.type === 'formula');

      return (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button onClick={() => setView({ level: 'days', week: view.week })}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
              <ArrowLeft size={15} />
            </button>
            <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
              TOPIC MATERIAL
            </span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Week {view.week} · Day {view.day} Study Module
            </span>
          </div>

          {/* Intro card */}
          <div className={`${C} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1">{topicName}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Day {view.day} — {doneCount}/{dayTasks.length} tasks completed by student
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!selectMode ? (
                  <>
                    {(dayTasks.length > 0 || dayMaterials.length > 0) && (
                      <button onClick={() => setSelectMode(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-400 hover:text-violet-500 text-gray-500 dark:text-gray-300 text-xs font-semibold transition">
                        <CheckSquare size={12} />Select
                      </button>
                    )}
                    <button onClick={() => setAddTaskModal({ week: view.week, day: view.day })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition">
                      <Plus size={12} />Add Task
                    </button>
                  </>
                ) : (() => {
                  const allTaskIds = dayTasks.map(t => t.task_id);
                  const allMatIds  = dayMaterials.map(m => m.material_id);
                  const totalSelected = selectedIds.size + selectedMaterialIds.size;
                  const allSelected = allTaskIds.every(id => selectedIds.has(id))
                                   && allMatIds.every(id => selectedMaterialIds.has(id))
                                   && (allTaskIds.length + allMatIds.length > 0);
                  return (
                    <>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-300 px-1">
                        {totalSelected} selected
                      </span>
                      <button onClick={() => selectAllInDay(allTaskIds, allMatIds)}
                        disabled={allTaskIds.length + allMatIds.length === 0}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-xs font-semibold transition disabled:opacity-50">
                        {allSelected
                          ? <><Square size={12} />Clear All</>
                          : <><CheckSquare size={12} />Select All</>}
                      </button>
                      <button onClick={handleBulkDelete} disabled={totalSelected === 0 || bulkDeleting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition disabled:opacity-50">
                        {bulkDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Delete{totalSelected > 0 ? ` (${totalSelected})` : ''}
                      </button>
                      <button onClick={exitSelectMode}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold transition">
                        <X size={12} />Cancel
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ── Materials Library (AI-generated, same as student sees) ── */}
          {loadingDayMaterials ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={22} className="animate-spin text-indigo-400" />
              <span className="ml-2 text-sm text-gray-400">Loading study resources...</span>
            </div>
          ) : (
            <>
              {/* Video Tutorials from library */}
              {libVideos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center">
                      <PlayCircle size={14} className="text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Video Tutorials</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      {libVideos.length} video{libVideos.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {libVideos.map(v => (
                      <VideoThumbCard
                        key={v.material_id}
                        material={v}
                        onDelete={handleSingleMaterialDelete}
                        selectMode={selectMode}
                        selected={selectedMaterialIds.has(v.material_id)}
                        onSelect={toggleSelectMaterial}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Shortcuts + Formulas */}
              {(libShortcut || libFormula) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {libShortcut && (
                    <BulletCard
                      title={libShortcut.title}
                      content={libShortcut.description}
                      icon={Zap}
                      grad="from-amber-500 to-orange-500"
                      borderCls="border-amber-200 dark:border-amber-800"
                      materialId={libShortcut.material_id}
                      onDelete={handleSingleMaterialDelete}
                      selectMode={selectMode}
                      selected={selectedMaterialIds.has(libShortcut.material_id)}
                      onSelect={toggleSelectMaterial}
                    />
                  )}
                  {libFormula && (
                    <BulletCard
                      title={libFormula.title}
                      content={libFormula.description}
                      icon={FlaskConical}
                      grad="from-rose-500 to-pink-600"
                      borderCls="border-rose-200 dark:border-rose-900"
                      materialId={libFormula.material_id}
                      onDelete={handleSingleMaterialDelete}
                      selectMode={selectMode}
                      selected={selectedMaterialIds.has(libFormula.material_id)}
                      onSelect={toggleSelectMaterial}
                    />
                  )}
                </div>
              )}

              {/* No library materials yet */}
              {dayMaterials.length === 0 && (
                <div className={`${C} flex flex-col items-center justify-center py-8 text-center`}>
                  <Sparkles size={28} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">
                    No AI-generated resources yet — student hasn&apos;t opened this day
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Admin-added videos (manually added plan tasks with URL) ── */}
          {adminVideoTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center">
                  <Play size={14} className="text-white ml-0.5" fill="currentColor" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Admin-Added Videos</h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{adminVideoTasks.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminVideoTasks.map(t => (
                  <AdminVideoCard key={t.task_id} task={t} onRemove={handleRemoveTask}
                    selectMode={selectMode} selected={selectedIds.has(t.task_id)} onSelect={toggleSelectTask} />
                ))}
              </div>
            </div>
          )}

          {/* ── Notes & Shortcuts (admin-added) ── */}
          {noteTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                  <StickyNote size={14} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Admin Notes & Shortcuts</h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{noteTasks.length}</span>
              </div>
              <div className="space-y-3">
                {noteTasks.map((t, i) => (
                  <AdminNoteCard key={t.task_id} task={t} index={i} onRemove={handleRemoveTask}
                    selectMode={selectMode} selected={selectedIds.has(t.task_id)} onSelect={toggleSelectTask} />
                ))}
              </div>
            </div>
          )}

          {/* ── Study Materials (PDFs) ── */}
          {pdfTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <FileText size={14} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Study Materials</h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{pdfTasks.length}</span>
              </div>
              <div className="space-y-3">
                {pdfTasks.map(t => (
                  <AdminPdfCard key={t.task_id} task={t} onRemove={handleRemoveTask}
                    selectMode={selectMode} selected={selectedIds.has(t.task_id)} onSelect={toggleSelectTask} />
                ))}
              </div>
            </div>
          )}

          {/* ── Practice Sessions ── */}
          {practiceTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
                  <FlaskConical size={14} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Practice Sessions</h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{practiceTasks.length}</span>
              </div>
              <div className="space-y-3">
                {practiceTasks.map(t => (
                  <AdminTaskRow key={t.task_id} task={t} colorClass="violet" onRemove={handleRemoveTask}
                    selectMode={selectMode} selected={selectedIds.has(t.task_id)} onSelect={toggleSelectTask} />
                ))}
              </div>
            </div>
          )}

          {/* ── Mock Tests ── */}
          {testTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center">
                  <Target size={14} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">Mock Tests</h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{testTasks.length}</span>
              </div>
              <div className="space-y-3">
                {testTasks.map(t => (
                  <AdminTaskRow key={t.task_id} task={t} colorClass="amber" onRemove={handleRemoveTask}
                    selectMode={selectMode} selected={selectedIds.has(t.task_id)} onSelect={toggleSelectTask} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {dayTasks.length === 0 && dayMaterials.length === 0 && !loadingDayMaterials && (
            <div className={`${C} flex flex-col items-center justify-center py-14 text-center`}>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Plus size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">No tasks for Day {view.day}</p>
              <p className="text-xs text-gray-400 mb-5">AI didn&apos;t assign any tasks here — add manually</p>
              <button onClick={() => setAddTaskModal({ week: view.week, day: view.day })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition">
                <Plus size={14} />Add Task
              </button>
            </div>
          )}

          {/* Add more */}
          {dayTasks.length > 0 && (
            <button onClick={() => setAddTaskModal({ week: view.week, day: view.day })}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-violet-200 dark:border-violet-800/40 text-sm text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors font-semibold">
              <Plus size={16} />Add More Task
            </button>
          )}
        </div>
      );
    }

    /* === LEVEL 2: Days grid === */
    if (view?.level === 'days') {
      const weekTasks = tasksByWeek(view.week);
      const done = weekTasks.filter(t => t.is_completed).length;
      const pct = weekTasks.length ? Math.round((done / weekTasks.length) * 100) : 0;

      return (
        <div className="space-y-4">
          {/* Week summary bar */}
          <div className={`${C} p-4 flex items-center gap-4`}>
            <button onClick={() => setView(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
              <ArrowLeft size={15} />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              W{view.week}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Week {view.week} <span className="text-gray-400 font-normal">of {finalWeeks.length}</span></p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-28 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400">{done}/{weekTasks.length} done ({pct}%)</span>
              </div>
            </div>
            <button onClick={() => setAddTaskModal({ week: view.week, day: 1 })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition">
              <Plus size={12} />Add Task
            </button>
          </div>

          {/* Day cards grid */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map(d => (
              <DayCard
                key={d}
                day={d}
                tasks={tasksByDay(view.week, d)}
                onSelect={() => setView({ level: 'tasks', week: view.week, day: d })}
              />
            ))}
          </div>
        </div>
      );
    }

    /* === LEVEL 1: Week cards grid === */
    return (
      <>
        {/* Summary */}
        <div className={`${C} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Overall Progress</p>
              <p className="text-2xl font-black text-gray-800 dark:text-gray-100 mt-0.5">
                {progressPct}%
                <span className="text-sm font-normal text-gray-400 ml-2">{completedCount}/{totalCount} tasks done</span>
              </p>
            </div>
            <div className="flex items-center gap-5">
              {[{v: finalWeeks.length, l:'Weeks'},{v:totalCount,l:'Tasks'},{v:completedCount,l:'Done',c:'text-violet-600'},{v:totalCount-completedCount,l:'Left'}].map(({v,l,c})=>(
                <div key={l} className="text-center">
                  <p className={`text-xl font-bold ${c || 'text-gray-800 dark:text-gray-100'}`}>{v}</p>
                  <p className="text-xs text-gray-400">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Source: <span className="capitalize font-medium text-gray-500 dark:text-gray-300">{plan.source?.replace('_', ' ')}</span>
            {plan.generated_at && ` • Generated ${new Date(plan.generated_at).toLocaleDateString()}`}
          </p>
        </div>

        {/* Week cards */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {finalWeeks.map(w => (
            <WeekCard key={w} week={w} tasks={tasksByWeek(w)} locked={!!lockedWeeks[w]}
              onSelect={() => setView({ level: 'days', week: w })}
              onToggleLock={w2 => setLockedWeeks(lw => ({ ...lw, [w2]: !lw[w2] }))}
            />
          ))}
          {/* Add new week */}
          <button onClick={() => setAddTaskModal({ week: finalWeeks.length + 1, day: 1 })}
            className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center py-8 text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors">
            <Plus size={22} className="mb-2" />
            <span className="text-sm font-semibold">Add Week {finalWeeks.length + 1}</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative animate-fade-in-up">
          <div className="flex items-center gap-2 text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1.5">
            <CalendarDays size={13} />STUDY PLANS
          </div>
          <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Plan Management</h1>
          <p className="text-violet-100/80 text-sm mt-1">View &amp; customize each student's personalized learning plan</p>
        </div>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 148px)' }}>
        {/* Student sidebar */}
        <div className="flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900" style={{ width: 256 }}>
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingStudents ? (
              <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-violet-500" /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10 px-4"><Users size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">No students</p></div>
            ) : (
              filteredStudents.map(s => (
                <button key={s.user_id} onClick={() => loadPlan(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 dark:border-gray-800/50 ${
                    selectedStudent?.user_id === s.user_id
                      ? 'bg-violet-50 dark:bg-violet-900/20 border-l-[3px] border-l-violet-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(s.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate">{s.batch_name || s.branch || s.email}</p>
                  </div>
                  <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main plan area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <CalendarDays size={28} className="text-violet-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">Select a Student</h3>
              <p className="text-sm text-gray-400 max-w-xs">Choose a student to view and manage their personalized study plan</p>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Student card */}
              <div className={`${C} p-5 flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {(selectedStudent.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    {/* Breadcrumb */}
                    {renderBreadcrumb()}
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{selectedStudent.name}</h2>
                    <p className="text-xs text-gray-400">{selectedStudent.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedStudent.batch_name && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-xs font-medium">{selectedStudent.batch_name}</span>
                      )}
                      {selectedStudent.branch && (
                        <span className="text-xs text-gray-400">{selectedStudent.branch}{selectedStudent.year ? ` • Year ${selectedStudent.year}` : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={generating}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition disabled:opacity-60 flex-shrink-0">
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {plan ? 'Regenerate' : 'Generate Plan'}
                </button>
              </div>

              {/* Active plan name badge */}
              {plan?.name && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40">
                  <CalendarDays size={14} className="text-violet-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-violet-800 dark:text-violet-300 truncate">{plan.name}</span>
                  <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{new Date(plan.generated_at).toLocaleDateString()}</span>
                </div>
              )}

              {renderPlanContent()}

              {/* Plan selector when student has multiple plans */}
              {plans.length > 1 && (
                <div className={`${C} p-4`}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <CalendarDays size={12} />All Study Plans ({plans.length})
                  </p>
                  <div className="space-y-2">
                    {plans.map((p, idx) => (
                      <button key={p.plan_id} onClick={() => { setPlan(p); setView(null); }}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors text-sm ${
                          plan?.plan_id === p.plan_id
                            ? 'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                        }`}>
                        <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{p.name || `Plan #${idx + 1}`}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{new Date(p.generated_at).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {addTaskModal && plan && (
        <AddTaskModal
          planId={plan.plan_id}
          defaultWeek={addTaskModal.week}
          defaultDay={addTaskModal.day}
          onClose={() => setAddTaskModal(null)}
          onAdded={handleTaskAdded}
        />
      )}
      {confirmDialog}
    </div>
  );
}
