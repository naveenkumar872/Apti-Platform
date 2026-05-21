import { useEffect, useState } from 'react';
import {
  X, Save, Loader2, Users, UserCheck, Globe, Search, ClipboardList, Clock, Shield, BookOpen
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const input = 'w-full px-3 py-2 rounded-lg text-[13px] bg-white dark:bg-white/[0.025] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-[3px] focus:ring-violet-500/15 transition-all';

/**
 * Edit any field of a test after it's been created: title, description, duration,
 * mode, start/end window, and (crucially) who it's assigned to.
 *
 * Props:
 *   - test:       the test object currently being edited
 *   - onClose:    () => void
 *   - onSaved:    (updatedFields) => void  parent merges into its tests state
 */
export default function EditTestModal({ test, onClose, onSaved }) {
  const initialAssigned = test?.assigned_to
    ? (typeof test.assigned_to === 'string' ? JSON.parse(test.assigned_to) : test.assigned_to)
    : { batch_ids: [], student_ids: [] };
  const initialMode =
    (initialAssigned.student_ids || []).length > 0 ? 'students' :
    (initialAssigned.batch_ids || []).length   > 0 ? 'batches'  :
                                                     'all';

  const [title,    setTitle]    = useState(test?.title || '');
  const [description, setDescription] = useState(test?.description || '');
  const [duration, setDuration] = useState(test?.duration_minutes || 60);
  const [maxAttempts, setMaxAttempts] = useState(test?.max_attempts ?? '');
  const [mode,     setMode]     = useState(test?.mode || 'practice');
  const [startTime, setStartTime] = useState(test?.start_time ? toLocalInput(test.start_time) : '');
  const [endTime,   setEndTime]   = useState(test?.end_time   ? toLocalInput(test.end_time)   : '');
  const [assignMode, setAssignMode] = useState(initialMode);
  const [batchIds, setBatchIds] = useState(initialAssigned.batch_ids || []);
  const [studentIds, setStudentIds] = useState(initialAssigned.student_ids || []);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/batches').then(r => setBatches(r.data.batches || [])).catch(() => {});
    api.get('/admin/users', { params: { role: 'student', limit: 500 } })
      .then(r => setStudents(r.data.users || []))
      .catch(() => {});
  }, []);

  const toggleBatch = (id) => {
    setBatchIds(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  };
  const toggleStudent = (id) => {
    setStudentIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleAssignModeChange = (m) => {
    setAssignMode(m);
    if (m === 'all') { setBatchIds([]); setStudentIds([]); }
    else if (m === 'batches') { setStudentIds([]); }
    else if (m === 'students') { setBatchIds([]); }
  };

  const save = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const assigned_to =
        assignMode === 'all'       ? { batch_ids: [], student_ids: [] } :
        assignMode === 'batches'   ? { batch_ids: batchIds,   student_ids: [] } :
                                     { batch_ids: [],         student_ids: studentIds };

      const maxN = parseInt(maxAttempts, 10);
      const payload = {
        title:            title.trim(),
        description:      description.trim() || null,
        duration_minutes: Number(duration) || null,
        max_attempts:     Number.isFinite(maxN) && maxN > 0 ? maxN : 0,
        mode,
        start_time:       startTime ? new Date(startTime).toISOString().slice(0, 19).replace('T', ' ') : null,
        end_time:         endTime   ? new Date(endTime).toISOString().slice(0, 19).replace('T', ' ')   : null,
        assigned_to,
      };
      await api.put(`/admin/tests/${test.test_id}`, payload);
      toast.success('Test updated');
      onSaved({
        title:            payload.title,
        description:      payload.description,
        duration_minutes: payload.duration_minutes,
        max_attempts:     payload.max_attempts > 0 ? payload.max_attempts : null,
        mode:             payload.mode,
        start_time:       payload.start_time,
        end_time:         payload.end_time,
        assigned_to,
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(s => {
    if (!studentSearch) return true;
    const q = studentSearch.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[92vh] bg-white dark:bg-[#0e0e15] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <ClipboardList size={17} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Edit test</h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate max-w-[400px]">{test?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title + Description */}
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className={input + ' resize-none'} placeholder="Optional" />
          </div>

          {/* Duration + Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                <Clock size={11} className="inline mr-1" /> Duration (minutes)
              </label>
              <input type="number" min={1} max={300} value={duration}
                onChange={e => setDuration(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Mode</label>
              <div className="inline-flex w-full bg-slate-100 dark:bg-white/[0.04] rounded-lg p-0.5">
                <button onClick={() => setMode('practice')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                    mode === 'practice'
                      ? 'bg-white dark:bg-[#161620] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  <BookOpen size={11} /> Practice
                </button>
                <button onClick={() => setMode('test')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                    mode === 'test'
                      ? 'bg-white dark:bg-[#161620] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                  <Shield size={11} /> Proctored
                </button>
              </div>
            </div>
          </div>

          {/* Max attempts */}
          <div>
            <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Max attempts per student
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={maxAttempts}
              onChange={e => setMaxAttempts(e.target.value)}
              className={input}
              placeholder="e.g. 3 (blank or 0 = unlimited)"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {Number(maxAttempts) > 0
                ? `Each student can attempt up to ${Number(maxAttempts)} time${Number(maxAttempts) === 1 ? '' : 's'}.`
                : 'Blank or 0 means unlimited attempts.'}
            </p>
          </div>

          {/* Schedule (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Starts at (optional)</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className={input} />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Ends at (optional)</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className={input} />
            </div>
          </div>

          {/* Assignment */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-violet-500" />
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white">Who can take this test</p>
              </div>
              <div className="inline-flex bg-slate-100 dark:bg-white/[0.04] rounded-md p-0.5">
                {[
                  { v: 'all',      label: 'Everyone', Icon: Globe },
                  { v: 'batches',  label: 'Batches',  Icon: Users },
                  { v: 'students', label: 'Specific', Icon: UserCheck },
                ].map(o => (
                  <button key={o.v} onClick={() => handleAssignModeChange(o.v)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11.5px] font-semibold transition-colors ${
                      assignMode === o.v
                        ? 'bg-white dark:bg-[#161620] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    <o.Icon size={10} /> {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {assignMode === 'all' && (
                <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                  Available to every student on the platform.
                </p>
              )}

              {assignMode === 'batches' && (
                batches.length === 0 ? (
                  <p className="text-[12.5px] text-slate-500 dark:text-slate-400">No batches created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {batches.map(b => {
                      const checked = batchIds.includes(b.batch_id);
                      return (
                        <label key={b.batch_id}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-[12.5px] transition-colors ${
                            checked
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-700 dark:text-slate-300'
                          }`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleBatch(b.batch_id)} className="w-3.5 h-3.5" />
                          <span className="font-semibold truncate">{b.name}</span>
                          <span className="ml-auto text-[10.5px] text-slate-500">{b.student_count || 0} students</span>
                        </label>
                      );
                    })}
                  </div>
                )
              )}

              {assignMode === 'students' && (
                <div>
                  <div className="relative mb-2">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                      placeholder="Search students by name or email…"
                      className={input + ' pl-9'} />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    {studentIds.length} selected · {filteredStudents.length} shown
                  </p>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.06] divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {filteredStudents.map(s => {
                      const checked = studentIds.includes(s.user_id);
                      return (
                        <label key={s.user_id}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${
                            checked ? 'bg-violet-50 dark:bg-violet-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                          }`}>
                          <input type="checkbox" checked={checked} onChange={() => toggleStudent(s.user_id)} className="w-3.5 h-3.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-100 truncate">{s.name}</p>
                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">{s.email}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition-colors disabled:opacity-60">
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving</> : <><Save size={13} /> Save changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function toLocalInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
