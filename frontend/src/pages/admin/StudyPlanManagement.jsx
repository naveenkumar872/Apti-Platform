import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Users, Search, ChevronRight, Sparkles, Plus, Trash2,
  CalendarDays, CheckCircle2, Video, FileText, FlaskConical,
  Target, Loader2, Clock, AlertCircle, Lock, Unlock, X,
  Play, ExternalLink, StickyNote, ArrowLeft, ChevronDown, ChevronUp
} from 'lucide-react';

const C = 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl';

const TASK_CFG = {
  video:    { icon: Video,       color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',      label: 'Video'    },
  pdf:      { icon: FileText,    color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',    label: 'PDF'      },
  practice: { icon: FlaskConical,color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20',label: 'Practice' },
  test:     { icon: Target,      color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',  label: 'Test'     },
  note:     { icon: StickyNote,  color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20',  label: 'Note'     },
};

function getYTId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([^#&?]{11})/);
  return m ? m[1] : null;
}

/* ─── Single Task Card ─── */
function TaskCard({ task, onRemove }) {
  const cfg = TASK_CFG[task.task_type] || TASK_CFG.note;
  const Icon = cfg.icon;
  const ytId = getYTId(task.url);

  return (
    <div className="group rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center mt-0.5`}>
          <Icon size={14} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-semibold leading-snug ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                {task.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                  <Icon size={9} />{cfg.label}
                </span>
                {task.estimated_minutes && (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock size={10} />{task.estimated_minutes} min
                  </span>
                )}
                {task.is_completed && (
                  <span className="flex items-center gap-1 text-[11px] text-green-500 font-medium">
                    <CheckCircle2 size={10} />Done
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => onRemove(task.task_id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all flex-shrink-0">
              <Trash2 size={13} />
            </button>
          </div>

          {/* Admin note */}
          {task.content && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30">
              <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 mb-0.5 flex items-center gap-1 uppercase tracking-wide">
                <StickyNote size={9} />Admin Note
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed whitespace-pre-line">{task.content}</p>
            </div>
          )}

          {/* YouTube embed preview */}
          {task.url && ytId && (
            <a href={task.url} target="_blank" rel="noreferrer"
              className="mt-2 flex items-center gap-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-red-400 transition-colors">
              <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumb" className="w-20 h-12 object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0 px-2">
                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1"><Play size={9} fill="currentColor" />Watch on YouTube</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{task.url}</p>
              </div>
              <ExternalLink size={11} className="text-gray-400 mr-2 flex-shrink-0" />
            </a>
          )}
          {/* Regular link */}
          {task.url && !ytId && (
            <a href={task.url} target="_blank" rel="noreferrer"
              className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 hover:border-blue-400 transition-colors text-blue-600 dark:text-blue-400 text-xs font-medium">
              <ExternalLink size={11} /><span className="truncate">{task.url}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Day Accordion Row ─── */
function DayRow({ day, tasks, onRemove, onAddTask }) {
  const [open, setOpen] = useState(false);
  const done = tasks.filter(t => t.is_completed).length;

  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-violet-300 dark:border-violet-700' : 'border-gray-100 dark:border-gray-800'} bg-white dark:bg-gray-900 overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          tasks.length > 0 ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
        }`}>{day}</div>
        <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200">Day {day}</span>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && <span className="text-[11px] text-gray-400">{done}/{tasks.length} done</span>}
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-50 dark:border-gray-800/50 pt-2">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-gray-400">No tasks for this day</p>
              <button onClick={() => onAddTask(day)}
                className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 font-medium transition-colors">
                <Plus size={12} />Add task
              </button>
            </div>
          ) : (
            <>
              {tasks.map(t => <TaskCard key={t.task_id} task={t} onRemove={onRemove} />)}
              <button onClick={() => onAddTask(day)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-violet-300 dark:border-violet-700 text-xs text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors font-medium mt-1">
                <Plus size={12} />Add task to Day {day}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Week Detail (days view) ─── */
function WeekDetail({ week, tasks, planTotalWeeks, onRemove, onClose, onAddTask }) {
  const tasksByDay = (d) => tasks.filter(t => t.day_number === d);
  const done = tasks.filter(t => t.is_completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className={`${C} overflow-hidden`}>
      <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-50 dark:from-violet-900/20 to-transparent">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
          <ArrowLeft size={15} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          W{week}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">
            Week {week}<span className="text-gray-400 font-normal ml-1.5">of {planTotalWeeks}</span>
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-24 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-400">{done}/{tasks.length} done ({pct}%)</span>
          </div>
        </div>
        <button onClick={() => onAddTask(1)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition">
          <Plus size={12} />Add Task
        </button>
      </div>

      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map(d => (
          <DayRow key={d} day={d} tasks={tasksByDay(d)} onRemove={onRemove} onAddTask={onAddTask} />
        ))}
      </div>
    </div>
  );
}

/* ─── Week Card (grid view) ─── */
function WeekCard({ week, tasks, locked, onSelect, onToggleLock }) {
  const done = tasks.filter(t => t.is_completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const daysFilled = [...new Set(tasks.map(t => t.day_number))].length;
  const typeCounts = tasks.reduce((acc, t) => { acc[t.task_type] = (acc[t.task_type] || 0) + 1; return acc; }, {});

  return (
    <button onClick={onSelect}
      className={`${C} p-4 text-left transition-all hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-900/10 w-full group`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-violet-900/20">
            {week}
          </div>
          <div>
            <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Week {week}</p>
            <p className="text-xs text-gray-400">{daysFilled} day{daysFilled !== 1 ? 's' : ''} planned</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleLock(week); }}
          className={`p-1.5 rounded-lg transition-colors ${locked
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
            : 'text-gray-300 dark:text-gray-600 hover:text-gray-500'}`}
          title={locked ? 'Locked – mandatory' : 'Unlocked'}>
          {locked ? <Lock size={13} /> : <Unlock size={13} />}
        </button>
      </div>

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

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] text-gray-400 font-medium w-12 text-right">{done}/{tasks.length}</span>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[11px] text-gray-400 group-hover:text-violet-500 transition-colors font-medium">
        View days <ChevronRight size={11} />
      </div>
    </button>
  );
}

/* ─── Add Task Modal ─── */
function AddTaskModal({ planId, defaultWeek, defaultDay, onClose, onAdded }) {
  const [form, setForm] = useState({
    task_type: 'practice',
    description: '',
    week_number: defaultWeek || 1,
    day_number: defaultDay || 1,
    estimated_minutes: 30,
    content: '',
    url: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error('Description required'); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.content.trim()) delete payload.content;
      if (!payload.url.trim()) delete payload.url;
      await api.put(`/admin/plans/${planId}`, { tasks_to_add: [payload] });
      toast.success('Task added');
      onAdded();
    } catch {
      toast.error('Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${C} w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">Add Task</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          {/* Type picker */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Task Type</label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(TASK_CFG).map(([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={type} onClick={() => setForm(f => ({ ...f, task_type: type }))}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                      form.task_type === type ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'}`}>
                    <Icon size={15} className={form.task_type === type ? 'text-violet-600' : cfg.color} />
                    <span className={`text-[10px] font-semibold ${form.task_type === type ? 'text-violet-600' : 'text-gray-500'}`}>{cfg.label}</span>
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

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Description *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Practice 20 questions on Time and Work" rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          {/* Admin note */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
              <StickyNote size={11} className="text-yellow-500" />Admin Note
              <span className="text-gray-400 normal-case font-normal">(optional – shown to student)</span>
            </label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Tips, hints, or extra instructions for the student..." rows={2}
              className="w-full px-3 py-2 rounded-xl border border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-900/10 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-yellow-400 resize-none"
            />
          </div>

          {/* YouTube / Link */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 block">
              <Play size={11} className="text-red-500" />YouTube / Resource Link
              <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Add Task
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Export ─── */
export default function StudyPlanManagement() {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lockedWeeks, setLockedWeeks] = useState({});
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [addTaskModal, setAddTaskModal] = useState(null);

  useEffect(() => {
    api.get('/admin/users?role=student&limit=200')
      .then(r => setStudents(r.data.users || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoadingStudents(false));
  }, []);

  const loadPlan = async (student) => {
    setSelectedStudent(student);
    setPlan(null);
    setSelectedWeek(null);
    setLockedWeeks({});
    setLoadingPlan(true);
    try {
      const r = await api.get(`/admin/plans/${student.user_id}`);
      setPlan(r.data.plan || null);
    } catch { toast.error('Failed to load plan'); }
    finally { setLoadingPlan(false); }
  };

  const handleGenerate = async () => {
    if (!selectedStudent) return;
    setGenerating(true);
    try {
      const r = await api.post(`/admin/plans/${selectedStudent.user_id}/generate`);
      setPlan(r.data.plan);
      setSelectedWeek(null);
      toast.success('Plan generated!');
    } catch { toast.error('Failed to generate plan'); }
    finally { setGenerating(false); }
  };

  const handleRemoveTask = async (taskId) => {
    if (!plan || !window.confirm('Remove this task?')) return;
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
      setPlan(r.data.plan || null);
    } catch { /* ignore */ }
    finally { setLoadingPlan(false); }
  };

  const openAddTask = (day = null) => {
    setAddTaskModal({ week: selectedWeek || 1, day: day || 1 });
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
  const completedCount = plan?.tasks?.filter(t => t.is_completed)?.length || 0;
  const totalCount = plan?.tasks?.length || 0;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-7 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-20 w-32 h-32 rounded-full bg-white blur-2xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-violet-200 text-xs font-semibold uppercase tracking-widest mb-1.5">
            <CalendarDays size={13} />STUDY PLANS
          </div>
          <h1 className="text-2xl font-black text-white">Plan Management</h1>
          <p className="text-violet-200 text-sm mt-0.5">View &amp; customize each student's personalized learning plan</p>
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
              <div className="text-center py-10 px-4">
                <Users size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No students found</p>
              </div>
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
              {/* Student info card */}
              <div className={`${C} p-5 flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {(selectedStudent.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
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

              {loadingPlan ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={24} className="animate-spin text-violet-500" />
                </div>
              ) : !plan ? (
                <div className={`${C} flex flex-col items-center justify-center py-16 text-center`}>
                  <AlertCircle size={36} className="text-gray-300 mb-3" />
                  <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-1">No Study Plan Yet</h3>
                  <p className="text-sm text-gray-400 mb-5">Generate an AI plan based on this student's weak topics.</p>
                  <button onClick={handleGenerate} disabled={generating}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition disabled:opacity-60">
                    {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}Generate AI Plan
                  </button>
                </div>
              ) : selectedWeek ? (
                /* ── Week detail: shows Day 1–7 rows ── */
                <WeekDetail
                  week={selectedWeek}
                  tasks={tasksByWeek(selectedWeek)}
                  planTotalWeeks={finalWeeks.length}
                  onRemove={handleRemoveTask}
                  onClose={() => setSelectedWeek(null)}
                  onAddTask={openAddTask}
                />
              ) : (
                /* ── Week cards grid ── */
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
                      Source: <span className="capitalize font-medium text-gray-500 dark:text-gray-300">{plan.source?.replace('_',' ')}</span>
                      {plan.generated_at && ` • Generated ${new Date(plan.generated_at).toLocaleDateString()}`}
                    </p>
                  </div>

                  {/* Week cards */}
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    {finalWeeks.map(w => (
                      <WeekCard
                        key={w}
                        week={w}
                        tasks={tasksByWeek(w)}
                        locked={!!lockedWeeks[w]}
                        onSelect={() => setSelectedWeek(w)}
                        onToggleLock={w2 => setLockedWeeks(lw => ({ ...lw, [w2]: !lw[w2] }))}
                      />
                    ))}
                    {/* Add new week */}
                    <button onClick={() => setAddTaskModal({ week: finalWeeks.length + 1, day: 1 })}
                      className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center py-8 text-gray-400 hover:border-violet-400 hover:text-violet-500 transition-colors">
                      <Plus size={24} className="mb-2" />
                      <span className="text-sm font-semibold">Add Week {finalWeeks.length + 1}</span>
                    </button>
                  </div>
                </>
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
    </div>
  );
}
