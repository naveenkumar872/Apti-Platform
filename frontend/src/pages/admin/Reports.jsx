import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft } from 'lucide-react';

export default function AdminReports() {
  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    api.get('/admin/tests', { params: { status: 'completed' } })
      .then(r => setTests(r.data.tests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadReport = async (test) => {
    setSelected(test);
    setLoadingReport(true);
    try {
      const res = await api.get(`/admin/tests/${test.test_id}/report`);
      setReport(res.data);
    } catch { setReport(null); }
    finally { setLoadingReport(false); }
  };

  if (selected) {
    const chartData = (report?.students || []).slice(0, 15).map(s => ({
      name: s.student_name.split(' ')[0],
      score: Math.round(s.percentage),
    }));

    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => { setSelected(null); setReport(null); }} className="flex items-center gap-1 text-blue-600 text-sm mb-4 hover:underline">
          <ChevronLeft size={16} /> Back to Tests
        </button>
        <h1 className="text-xl font-bold text-gray-800 mb-1">{selected.title}</h1>
        <p className="text-sm text-gray-500 mb-6">Test Report</p>

        {loadingReport ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}</div>
        ) : report ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Attempts', value: report.total_attempts },
                { label: 'Average Score', value: `${Math.round(report.avg_score || 0)}%` },
                { label: 'Highest Score', value: `${Math.round(report.max_score || 0)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-2xl font-bold text-gray-800">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {chartData.length > 0 && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
                <h2 className="font-semibold text-gray-700 mb-3">Score Distribution</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}
                      fill="#3b82f6"
                      label={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Student</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Score</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Percentage</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {(report.students || []).map(s => (
                    <tr key={s.attempt_id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.student_name}</td>
                      <td className="px-4 py-3 text-gray-600">{s.score}/{s.max_score}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${s.percentage >= 70 ? 'bg-green-100 text-green-700' : s.percentage >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {Math.round(s.percentage)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-center py-10">No report data available</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : tests.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No completed tests</p>
      ) : (
        <div className="space-y-3">
          {tests.map(t => (
            <button key={t.test_id} onClick={() => loadReport(t)}
              className="w-full bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-blue-300 transition-colors text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{t.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{t.duration_minutes} min · {t.total_marks} marks</p>
                </div>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">Completed</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
