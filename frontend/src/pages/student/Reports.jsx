import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Award } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/reports')
      .then(r => setReports(r.data.attempts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = async (attemptId) => {
    try {
      const res = await api.get(`/student/reports/${attemptId}`);
      setSelected(attemptId);
      setDetail(res.data);
    } catch {}
  };

  const chartData = reports.slice(0, 10).map(r => ({
    name: r.title?.substring(0, 12),
    score: Math.round(r.accuracy_percent || 0),
  })).reverse();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Performance Reports</h1>

      {!loading && reports.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" /> Score Trend
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((e, i) => (
                  <Cell key={i} fill={e.score >= 70 ? '#22c55e' : e.score >= 50 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attempts List */}
        <div>
          <h2 className="font-medium text-gray-700 mb-3">Test Attempts</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-xl" />)}</div>
          ) : reports.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">No test attempts yet</p>
          ) : (
            <div className="space-y-2">
              {reports.map(r => (
                <button
                  key={r.attempt_id}
                  onClick={() => loadDetail(r.attempt_id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${selected === r.attempt_id ? 'border-blue-400 bg-blue-50' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(r.submitted_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-sm font-bold ${r.accuracy_percent >= 70 ? 'text-green-600' : r.accuracy_percent >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {Math.round(r.accuracy_percent)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div>
          {detail ? (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award size={18} className="text-yellow-500" /> Detailed Report
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Score', value: `${detail.attempt?.score}/${detail.attempt?.total_marks}` },
                  { label: 'Accuracy', value: `${Math.round(detail.attempt?.accuracy_percent)}%` },
                  { label: 'Time Taken', value: `${Math.floor((detail.attempt?.time_taken_seconds || 0) / 60)}m` },
                  { label: 'Violations', value: detail.attempt?.violations_count || 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-800">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {detail.topic_analysis?.length > 0 && (
                <>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Topic Breakdown</h3>
                  <div className="space-y-2">
                    {detail.topic_analysis.slice(0, 5).map(t => (
                      <div key={t.topic_name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-24 truncate">{t.topic_name}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${t.accuracy}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700 w-8 text-right">{t.accuracy}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Select an attempt to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
