import React, { useEffect, useState } from 'react';
import { FileText, Play, Download, BookmarkPlus, CheckCircle, Search } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchMaterials = () => {
    setLoading(true);
    api.get('/student/materials', { params: { search, type, page, limit: 12 } })
      .then(r => { setMaterials(r.data.materials); setTotal(r.data.pagination.total); })
      .catch(() => toast.error('Failed to load materials'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMaterials(); }, [search, type, page]);

  const handleMarkLearned = async (id) => {
    try {
      await api.post(`/student/materials/${id}/mark-learned`);
      toast.success('Marked as learned!');
      setMaterials(prev => prev.map(m => m.material_id === id ? { ...m, is_learned: true } : m));
    } catch { toast.error('Failed'); }
  };

  const handleBookmark = async (id) => {
    try {
      await api.post(`/student/materials/${id}/bookmark`);
      toast.success('Bookmarked!');
    } catch { toast.error('Failed'); }
  };

  const icons = { pdf: FileText, video: Play, note: FileText, past_paper: FileText };
  const typeColors = { pdf: 'bg-red-100 text-red-700', video: 'bg-blue-100 text-blue-700', note: 'bg-yellow-100 text-yellow-700', past_paper: 'bg-purple-100 text-purple-700' };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Study Materials</h1>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search materials..."
          />
        </div>
        <select
          value={type}
          onChange={e => { setType(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="note">Note</option>
          <option value="past_paper">Past Paper</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No materials found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map(m => {
              const Icon = icons[m.type] || FileText;
              return (
                <div key={m.material_id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[m.type] || 'bg-gray-100 text-gray-700'}`}>
                      {m.type.toUpperCase()}
                    </span>
                    {m.is_learned && <CheckCircle size={18} className="text-green-500" />}
                  </div>
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{m.title}</h3>
                      {m.subject_name && <p className="text-xs text-gray-500 mt-1">{m.subject_name}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center text-xs bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    >
                      {m.type === 'video' ? 'Watch' : 'View'}
                    </a>
                    {!m.is_learned && (
                      <button onClick={() => handleMarkLearned(m.material_id)} className="text-xs border border-green-500 text-green-600 px-3 py-2 rounded-lg hover:bg-green-50">
                        Mark Done
                      </button>
                    )}
                    <button onClick={() => handleBookmark(m.material_id)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <BookmarkPlus size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {total > 12 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Prev</button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 12 >= total} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
