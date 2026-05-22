import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Upload, FileText, Video, Link as LinkIcon, BookOpen,
  ChevronRight, Users, TrendingUp, ClipboardList, Award,
  CheckSquare, Square, X, CheckCircle2, Loader2,
  Zap, FlaskConical, Layers
} from 'lucide-react';
import { useConfirm } from '../../components/ConfirmDialog';

const TYPES = [
  { value: 'video',   label: '🎬 Video (YouTube / MP4)' },
  { value: 'pdf',     label: '📄 PDF / Notes' },
  { value: 'link',    label: '🔗 External Link (Formula / Notes)' },
  { value: 'ppt',     label: '📊 Presentation (PPT)' },
  { value: 'doc',     label: '📝 Document (DOC)' },
];

// Display metadata for every known material type. Used by the chip filter row
// (so types like AI-seeded 'shortcut' / 'formula' show up even though the
// admin form doesn't expose them).
const TYPE_META = {
  video:    { label: 'Video',    icon: Video,        color: 'text-red-500'    },
  pdf:      { label: 'PDF',      icon: FileText,     color: 'text-orange-500' },
  link:     { label: 'Link',     icon: LinkIcon,     color: 'text-blue-500'   },
  ppt:      { label: 'PPT',      icon: FileText,     color: 'text-purple-500' },
  doc:      { label: 'Doc',      icon: BookOpen,     color: 'text-gray-500'   },
  shortcut: { label: 'Shortcut', icon: Zap,          color: 'text-amber-500'  },
  formula:  { label: 'Formula',  icon: FlaskConical, color: 'text-rose-500'   },
};

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";
const inputCls = "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
const selectCls = "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

const EMPTY_FORM = { title: '', type: 'video', file_url: '', subject_id: '', topic_id: '', description: '' };

export default function Materials() {
  const { confirm, dialog: confirmDialog } = useConfirm();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  // Bulk selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Type filter
  const [typeFilter, setTypeFilter] = useState('all');

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ok = await confirm({
      title: `Delete ${ids.length} material${ids.length === 1 ? '' : 's'}?`,
      message: 'They will be removed from the library for every student.',
      confirmLabel: `Delete ${ids.length}`,
      tone: 'danger',
    });
    if (!ok) return;
    setBulkDeleting(true);
    try {
      await Promise.all(ids.map(id => api.delete(`/admin/materials/${id}`)));
      setMaterials(prev => prev.filter(m => !selectedIds.has(m.material_id)));
      toast.success(`${ids.length} material${ids.length === 1 ? '' : 's'} deleted`);
      exitSelectMode();
    } catch {
      toast.error('Failed to delete some materials');
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    api.get('/admin/materials').then(r => setMaterials(r.data.materials || [])).catch(() => {}).finally(() => setLoading(false));
    api.get('/admin/subjects').then(r => setSubjects(r.data.subjects || [])).catch(() => {});
    api.get('/admin/topics').then(r => setAllTopics(r.data.topics || [])).catch(() => {});
    api.get('/admin/dashboard').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const topics = form.subject_id
    ? allTopics.filter(t => t.subject_id === form.subject_id)
    : [];

  const updateForm = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    if (!form.file_url && !file) { toast.error('Please provide a URL or upload a file'); return; }
    setSaving(true);
    try {
      let url = form.file_url;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        url = uploadRes.data.url;
      }
      // Send 'type' (not 'material_type') to match the DB column
      const payload = {
        title: form.title,
        type: form.type,
        file_url: url,
        description: form.description,
        subject_id: form.subject_id || null,
        topic_id: form.topic_id || null,
      };
      const res = await api.post('/admin/materials', payload);
      // Reload full list to get enriched fields (topic_name, subject_name)
      const refreshed = await api.get('/admin/materials');
      setMaterials(refreshed.data.materials || []);
      toast.success('Material added! Students can now find it in Study Plan resources.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save material');
    } finally { setSaving(false); }
  };

  const deleteMaterial = async (id) => {
    const ok = await confirm({
      title: 'Delete this material?',
      message: 'It will be removed from the library for every student.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/materials/${id}`);
      setMaterials(prev => prev.filter(m => m.material_id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const TypeIcon = ({ type }) => {
    const meta = TYPE_META[type];
    if (meta) {
      const Icon = meta.icon;
      return <Icon size={16} className={meta.color} />;
    }
    return <BookOpen size={16} className="text-purple-500" />;
  };

  const typeBg = {
    pdf:      'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40',
    video:    'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40',
    link:     'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40',
    ppt:      'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40',
    doc:      'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    shortcut: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40',
    formula:  'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40',
  };

  const typeBadge = {
    pdf:      'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    video:    'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    link:     'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    ppt:      'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    doc:      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    shortcut: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    formula:  'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  };

  const urlPlaceholder = {
    video: 'https://youtube.com/watch?v=... or https://video.mp4',
    pdf:   'https://drive.google.com/file/... or direct PDF URL',
    link:  'https://docs.google.com/... or any formula/notes URL',
    ppt:   'https://drive.google.com/... or PPT URL',
    doc:   'https://docs.google.com/... or DOC URL',
  };

  const totalMaterials = materials.length;
  const videoMaterials = materials.filter(m => m.type === 'video').length;
  const pdfMaterials = materials.filter(m => m.type === 'pdf').length;
  const linksOthers = materials.filter(m => m.type !== 'video' && m.type !== 'pdf').length;

  const cards = [
    { label: 'Total Resources', value: totalMaterials, icon: BookOpen, grad: 'from-blue-500 to-indigo-600' },
    { label: 'Video Lessons', value: videoMaterials, icon: Video, grad: 'from-emerald-500 to-teal-600' },
    { label: 'PDF Documents', value: pdfMaterials, icon: FileText, grad: 'from-violet-500 to-purple-600' },
    { label: 'External Links & Docs', value: linksOthers, icon: LinkIcon, grad: 'from-orange-500 to-amber-500' },
  ];

  // Type filter — counts per type (only types that actually exist in the data)
  const typeCounts = materials.reduce((acc, m) => {
    acc[m.type] = (acc[m.type] || 0) + 1;
    return acc;
  }, {});
  const availableTypes = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]);
  const filteredMaterials = typeFilter === 'all'
    ? materials
    : materials.filter(m => m.type === typeFilter);

  // Toggle select-all only acts on the currently-visible (filtered) materials
  const toggleSelectAllVisible = () => {
    const visibleIds = filteredMaterials.map(m => m.material_id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) visibleIds.forEach(id => next.delete(id));
      else visibleIds.forEach(id => next.add(id));
      return next;
    });
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Resources</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Study Materials</h1>
            <p className="text-white/70 text-sm mt-1.5">Add notes, formula sheets, and videos linked to topics</p>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-shrink-0">
            {!selectMode ? (
              <>
                {materials.length > 0 && (
                  <button onClick={() => setSelectMode(true)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-colors">
                    <CheckSquare size={15} /> Select
                  </button>
                )}
                <button onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-colors">
                  <Plus size={15} /> Add Material
                </button>
              </>
            ) : (
              <>
                <span className="text-white/80 text-sm font-semibold px-2">{selectedIds.size} selected</span>
                <button onClick={toggleSelectAllVisible}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-colors">
                  {filteredMaterials.length > 0 && filteredMaterials.every(m => selectedIds.has(m.material_id))
                    ? <><Square size={15} />Clear All</>
                    : <><CheckSquare size={15} />Select All{typeFilter !== 'all' ? ` ${TYPE_META[typeFilter]?.label || typeFilter}` : ''}</>}
                </button>
                <button onClick={handleBulkDelete} disabled={selectedIds.size === 0 || bulkDeleting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                  {bulkDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
                </button>
                <button onClick={exitSelectMode}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-colors">
                  <X size={15} />Cancel
                </button>
              </>
            )}
          </div>
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

        {/* Type filter chips */}
        {materials.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                typeFilter === 'all'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/30'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-400'
              }`}
            >
              <Layers size={12} />
              All
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                typeFilter === 'all' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'
              }`}>{materials.length}</span>
            </button>
            {availableTypes.map(type => {
              const meta = TYPE_META[type] || { label: type, icon: BookOpen, color: 'text-gray-500' };
              const Icon = meta.icon;
              const isActive = typeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border capitalize ${
                    isActive
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-500/30'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-violet-400'
                  }`}
                >
                  <Icon size={12} className={isActive ? 'text-white' : meta.color} />
                  {meta.label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>{typeCounts[type]}</span>
                </button>
              );
            })}
          </div>
        )}

        {showForm && (
          <div className={C + " p-6 shadow-sm mb-6"}>
            <div className="flex items-center gap-2 mb-5">
              <Plus size={16} className="text-violet-500" />
              <h2 className="font-bold text-gray-800 dark:text-gray-100">Add New Material</h2>
            </div>

            {/* Info banner */}
            <div className="mb-5 p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2">
              <BookOpen size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                <strong>Tip:</strong> Link the material to a <strong>Subject + Topic</strong> so students can find it automatically in their Study Plan resources view.
              </p>
            </div>

            <div className="space-y-4">
              {/* Row 1: Title + Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => updateForm('title', e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Time and Work – Formula Sheet"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Material Type *</label>
                  <select value={form.type} onChange={e => updateForm('type', e.target.value)} className={selectCls}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Subject + Topic (cascading) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Subject <span className="text-indigo-500">(for Study Plan)</span>
                  </label>
                  <select
                    value={form.subject_id}
                    onChange={e => { updateForm('subject_id', e.target.value); updateForm('topic_id', ''); }}
                    className={selectCls}
                  >
                    <option value="">— Select Subject —</option>
                    {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    Topic <span className="text-indigo-500">(required for Study Plan lookup)</span>
                  </label>
                  <select
                    value={form.topic_id}
                    onChange={e => updateForm('topic_id', e.target.value)}
                    disabled={!form.subject_id}
                    className={selectCls + (!form.subject_id ? ' opacity-50 cursor-not-allowed' : '')}
                  >
                    <option value="">— Select Topic —</option>
                    {topics.map(t => <option key={t.topic_id} value={t.topic_id}>{t.name}</option>)}
                  </select>
                  {!form.subject_id && (
                    <p className="text-[10px] text-gray-400 mt-1">Select a subject first</p>
                  )}
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  {form.type === 'video' ? 'Video URL (YouTube or MP4)' :
                   form.type === 'link' ? 'External Link URL (Formula / Notes page)' :
                   'File URL or Upload below'}
                  {' '}*
                </label>
                <input
                  value={form.file_url}
                  onChange={e => updateForm('file_url', e.target.value)}
                  className={inputCls}
                  placeholder={urlPlaceholder[form.type] || 'https://...'}
                />
              </div>

              {/* File Upload (optional for PDF/PPT/DOC) */}
              {['pdf', 'ppt', 'doc'].includes(form.type) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Or Upload File</label>
                  <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 hover:border-violet-400 dark:hover:border-violet-500 transition-colors">
                    <Upload size={20} className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{file ? file.name : 'Click to upload or drag & drop'}</p>
                      <p className="text-xs text-gray-400">PDF, DOC, PPT up to 20MB</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={e => setFile(e.target.files[0])} />
                  </label>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={2}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Brief description of this material..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFile(null); setTopics([]); }}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="bg-violet-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-violet-500 disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {saving ? 'Saving...' : <><Plus size={14} /> Save Material</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No materials yet</p>
            <p className="text-sm mt-1">Add notes, formula sheets, and videos for students</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No {TYPE_META[typeFilter]?.label || typeFilter} materials</p>
            <button onClick={() => setTypeFilter('all')}
              className="mt-2 text-sm text-violet-500 hover:underline font-semibold">
              Show all materials
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map(m => {
              const isSelected = selectedIds.has(m.material_id);
              return (
                <div
                  key={m.material_id}
                  onClick={() => selectMode && toggleSelect(m.material_id)}
                  className={`relative rounded-2xl p-4 border shadow-sm transition-all ${
                    isSelected
                      ? 'border-violet-500 ring-2 ring-violet-500/40 bg-violet-50 dark:bg-violet-900/10'
                      : (typeBg[m.type] || C)
                  } ${selectMode ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {selectMode && (
                        <span className={`flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors ${
                          isSelected
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'bg-white/90 dark:bg-gray-900/80 border-gray-300 dark:border-gray-600 text-transparent'
                        }`}>
                          <CheckCircle2 size={14} />
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center">
                        <TypeIcon type={m.type} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeBadge[m.type] || typeBadge.doc}`}>
                        {m.type}
                      </span>
                    </div>
                    {!selectMode && (
                      <button onClick={(e) => { e.stopPropagation(); deleteMaterial(m.material_id); }}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-1 line-clamp-2">{m.title}</p>
                  {m.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">{m.description}</p>
                  )}
                  {/* Topic/Subject breadcrumb */}
                  {(m.subject_name || m.topic_name) && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 mb-2 flex-wrap">
                      {m.subject_name && <span className="font-semibold">{m.subject_name}</span>}
                      {m.subject_name && m.topic_name && <ChevronRight size={10} />}
                      {m.topic_name && <span className="font-semibold text-indigo-600 dark:text-indigo-400">{m.topic_name}</span>}
                    </div>
                  )}
                  {m.file_url && m.file_url !== '#' && !selectMode && (
                    <a href={m.file_url} target="_blank" rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                      <LinkIcon size={11} /> Open Link ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}
