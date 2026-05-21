import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, FileText, Video, Link as LinkIcon, BookOpen, ChevronRight } from 'lucide-react';

const TYPES = [
  { value: 'video',   label: '🎬 Video (YouTube / MP4)' },
  { value: 'pdf',     label: '📄 PDF / Notes' },
  { value: 'link',    label: '🔗 External Link (Formula / Notes)' },
  { value: 'ppt',     label: '📊 Presentation (PPT)' },
  { value: 'doc',     label: '📝 Document (DOC)' },
];

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";
const inputCls = "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
const selectCls = "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";

const EMPTY_FORM = { title: '', type: 'video', file_url: '', subject_id: '', topic_id: '', description: '' };

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/materials').then(r => setMaterials(r.data.materials || [])).catch(() => {}).finally(() => setLoading(false));
    api.get('/admin/subjects').then(r => setSubjects(r.data.subjects || [])).catch(() => {});
  }, []);

  // Load topics when subject changes
  useEffect(() => {
    if (!form.subject_id) { setTopics([]); return; }
    api.get('/admin/topics', { params: { subject_id: form.subject_id } })
      .then(r => setTopics(r.data.topics || []))
      .catch(() => setTopics([]));
  }, [form.subject_id]);

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
      setTopics([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save material');
    } finally { setSaving(false); }
  };

  const deleteMaterial = async (id) => {
    if (!confirm('Delete this material?')) return;
    try {
      await api.delete(`/admin/materials/${id}`);
      setMaterials(prev => prev.filter(m => m.material_id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const TypeIcon = ({ type }) => {
    if (type === 'video') return <Video size={16} className="text-red-500" />;
    if (type === 'link') return <LinkIcon size={16} className="text-blue-500" />;
    if (type === 'pdf') return <FileText size={16} className="text-orange-500" />;
    return <BookOpen size={16} className="text-purple-500" />;
  };

  const typeBg = {
    pdf:   'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40',
    video: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40',
    link:  'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40',
    ppt:   'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40',
    doc:   'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  };

  const typeBadge = {
    pdf:   'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    video: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    link:  'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    ppt:   'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    doc:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const urlPlaceholder = {
    video: 'https://youtube.com/watch?v=... or https://video.mp4',
    pdf:   'https://drive.google.com/file/... or direct PDF URL',
    link:  'https://docs.google.com/... or any formula/notes URL',
    ppt:   'https://drive.google.com/... or PPT URL',
    doc:   'https://docs.google.com/... or DOC URL',
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Resources</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Study Materials</h1>
            <p className="text-white/70 text-sm mt-1.5">Add notes, formula sheets, and videos linked to topics</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-colors mt-1 flex-shrink-0">
            <Plus size={15} /> Add Material
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-8">
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(m => (
              <div key={m.material_id} className={`rounded-2xl p-4 border shadow-sm ${typeBg[m.type] || C}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-black/20 flex items-center justify-center">
                      <TypeIcon type={m.type} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${typeBadge[m.type] || typeBadge.doc}`}>
                      {m.type}
                    </span>
                  </div>
                  <button onClick={() => deleteMaterial(m.material_id)} className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40">
                    <Trash2 size={13} />
                  </button>
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
                {m.file_url && (
                  <a href={m.file_url} target="_blank" rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                    <LinkIcon size={11} /> Open Link ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
