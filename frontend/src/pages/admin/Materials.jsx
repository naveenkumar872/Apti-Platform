import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload, FileText, Video, Link as LinkIcon } from 'lucide-react';

const TYPES = ['pdf', 'video', 'link', 'ppt', 'doc'];

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: '', material_type: 'pdf', file_url: '', subject_id: '', description: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/materials').then(r => setMaterials(r.data.materials || [])).catch(() => {}).finally(() => setLoading(false));
    api.get('/admin/subjects').then(r => setSubjects(r.data.subjects || [])).catch(() => {});
  }, []);

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      let url = form.file_url;
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const uploadRes = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        url = uploadRes.data.url;
      }
      const res = await api.post('/admin/materials', { ...form, file_url: url });
      setMaterials(prev => [res.data.material, ...prev]);
      toast.success('Material added!');
      setShowForm(false);
      setForm({ title: '', material_type: 'pdf', file_url: '', subject_id: '', description: '' });
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
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
    return <FileText size={16} className="text-orange-500" />;
  };

  const typeBg = { pdf: 'bg-orange-50', video: 'bg-red-50', link: 'bg-blue-50', ppt: 'bg-purple-50', doc: 'bg-gray-50' };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Study Materials</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> Upload Material
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 space-y-4">
          <h2 className="font-semibold text-gray-800">New Material</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Material title" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Type</label>
              <select value={form.material_type} onChange={e => setForm(f => ({ ...f, material_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
                {TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Subject</label>
            <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
              <option value="">-- Select subject --</option>
              {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Upload File</label>
            <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 transition-colors">
              <Upload size={20} className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">{file ? file.name : 'Click to upload or drop file'}</p>
                <p className="text-xs text-gray-400">PDF, DOC, PPT, MP4, PNG, JPG</p>
              </div>
              <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
            </label>
          </div>
          {!file && (
            <div>
              <label className="block text-xs text-gray-600 mb-1">Or enter URL</label>
              <input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                placeholder="https://example.com/material.pdf" />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none" placeholder="Brief description..." />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
            <button onClick={save} disabled={saving} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Material'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : materials.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No materials yet</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(m => (
            <div key={m.material_id} className={`rounded-xl p-4 border border-gray-100 shadow-sm ${typeBg[m.material_type] || 'bg-white'}`}>
              <div className="flex items-start justify-between mb-2">
                <TypeIcon type={m.material_type} />
                <button onClick={() => deleteMaterial(m.material_id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">{m.title}</p>
              <span className="text-xs text-gray-500 uppercase">{m.material_type}</span>
              {m.file_url && (
                <a href={m.file_url} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-blue-600 hover:underline truncate">
                  View / Download
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
