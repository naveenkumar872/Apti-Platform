import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Building2, ChevronRight } from 'lucide-react';

export default function CompanyCorner() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/companies')
      .then(r => setCompanies(r.data.companies || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadCompany = async (id) => {
    try {
      const res = await api.get(`/student/companies/${id}`);
      setSelected(res.data.company);
    } catch {}
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Company Corner</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company List */}
        <div className="lg:col-span-1">
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-200 animate-pulse rounded-xl" />)}</div>
          ) : (
            <div className="space-y-2">
              {companies.map(c => (
                <button
                  key={c.company_id}
                  onClick={() => loadCompany(c.company_id)}
                  className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-colors ${
                    selected?.company_id === c.company_id ? 'border-blue-400 bg-blue-50' : 'bg-white border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-8 h-8 object-contain" /> : <Building2 size={20} className="text-gray-400" />}
                  </div>
                  <span className="font-medium text-gray-800 text-sm">{c.name}</span>
                  <ChevronRight size={14} className="ml-auto text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Company Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Building2 size={28} className="text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{selected.name}</h2>
              </div>

              {selected.important_topics?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold text-gray-700 mb-2">Important Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.important_topics.map(t => (
                      <span key={t} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {selected.test_pattern && Object.keys(selected.test_pattern).length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold text-gray-700 mb-2">Test Pattern</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                    {selected.test_pattern.sections && <p><strong>Sections:</strong> {selected.test_pattern.sections?.join(', ')}</p>}
                    {selected.test_pattern.duration && <p><strong>Duration:</strong> {selected.test_pattern.duration} minutes</p>}
                    {selected.test_pattern.questions && <p><strong>Questions:</strong> {selected.test_pattern.questions}</p>}
                  </div>
                </div>
              )}

              {selected.interview_tips && (
                <div className="mb-5">
                  <h3 className="font-semibold text-gray-700 mb-2">Interview Tips</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{selected.interview_tips}</p>
                </div>
              )}

              {selected.past_papers?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Past Papers</h3>
                  <div className="space-y-2">
                    {selected.past_papers.map(p => (
                      <a key={p.paper_id} href={p.file_url} target="_blank" rel="noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm">
                        <span>{p.year} - {p.round}</span>
                        <span className="text-blue-600">Download</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-12 border border-dashed border-gray-200 text-center">
              <Building2 size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Select a company to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
