import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrendingUp, Award, ChevronRight, CheckCircle, XCircle,
  AlertTriangle, BookOpen, Target, RotateCcw, ChevronDown
} from 'lucide-react';

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    api.get('/student/reports')
      .then(r => setReports(r.data.attempts || []))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = async (id) => {
    if (selected === id) { setSelected(null); setDetail(null); return; }
    setSelected(id);
    setDetail(null);
    setExpandedQ(null);
    setShowAnswers(false);
    setDetailLoading(true);
    try {
      const res = await api.get(`/student/reports/${id}`);
      setDetail(res.data);
    } catch { toast.error('Failed to load report details'); }
    finally { setDetailLoading(false); }
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      await api.post('/student/plan/generate');
      toast.success('Study plan generated!');
      navigate('/student/plan');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate plan');
    } finally { setGeneratingPlan(false); }
  };

  const fmtTime = (s) => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '';

  const grade = (acc) => acc >= 80 ? { label: 'Excellent', color: 'text-green-600 bg-green-50', bar: 'bg-green-500' }
    : acc >= 60 ? { label: 'Good', color: 'text-blue-600 bg-blue-50', bar: 'bg-blue-500' }
    : acc >= 40 ? { label: 'Average', color: 'text-yellow-600 bg-yellow-50', bar: 'bg-yellow-400' }
    : { label: 'Needs Work', color: 'text-red-600 bg-red-50', bar: 'bg-red-500' };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Performance Reports</h1>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No sessions completed yet</p>
          <p className="text-gray-400 text-sm mt-1">Complete a practice session to see your report here</p>
          <button onClick={() => navigate('/student/practice')}
            className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Start Practice
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* ── Left: Session List ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-2">
            {reports.map((r, idx) => {
              const g = grade(r.accuracy_percent || 0);
              return (
                <button key={r.id} onClick={() => loadDetail(r.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selected === r.id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type === 'practice' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {r.type === 'practice' ? 'Practice' : 'Test'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.color}`}>{g.label}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(r.submitted_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${Math.round(r.accuracy_percent) >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.round(r.accuracy_percent || 0)}%
                      </p>
                      <p className="text-xs text-gray-400">{r.score ?? 0} correct</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Right: Detail Panel ────────────────────────────────── */}
          <div className="lg:col-span-3">
            {detailLoading && (
              <div className="bg-white rounded-xl p-8 border border-gray-100 flex items-center justify-center">
                <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!detailLoading && !detail && (
              <div className="bg-gray-50 rounded-xl p-12 text-center border border-dashed border-gray-200">
                <Target size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">Select a session to view detailed report</p>
              </div>
            )}

            {!detailLoading && detail && (() => {
              const { attempt, answers = [], topic_analysis = [], weak_topics = [] } = detail;
              const g = grade(attempt.accuracy_percent || 0);
              const totalQ = answers.length;
              const correct = answers.filter(a => a.is_correct).length;

              return (
                <div className="space-y-4">

                  {/* Score Card */}
                  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Award size={18} className="text-yellow-500" /> {attempt.title}
                      </h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${g.color}`}>
                        {g.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Accuracy', value: `${Math.round(attempt.accuracy_percent || 0)}%` },
                        { label: 'Correct', value: correct, color: 'text-green-600' },
                        { label: 'Wrong', value: totalQ - correct, color: 'text-red-600' },
                        { label: 'Time', value: fmtTime(attempt.time_taken_seconds || 0) },
                      ].map(s => (
                        <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                          <p className={`text-lg font-bold ${s.color || 'text-gray-800'}`}>{s.value}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Topic Breakdown + Weak Areas */}
                  {topic_analysis.length > 0 && (
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-500" /> Topic Breakdown
                      </h3>
                      <div className="space-y-2.5">
                        {topic_analysis.map(t => (
                          <div key={t.topic_name}>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1.5">
                                {t.is_weak && <AlertTriangle size={12} className="text-orange-500 flex-shrink-0" />}
                                <span className="text-xs text-gray-700 font-medium">{t.topic_name}</span>
                                {t.is_weak && <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">Weak</span>}
                              </div>
                              <span className={`text-xs font-semibold ${t.accuracy >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                {t.correct}/{t.total} ({t.accuracy}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${t.accuracy >= 60 ? 'bg-green-500' : t.accuracy >= 40 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                style={{ width: `${t.accuracy}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Generate Plan CTA */}
                      {weak_topics.length > 0 && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-sm font-medium text-orange-800 mb-1 flex items-center gap-1.5">
                            <AlertTriangle size={14} /> {weak_topics.length} weak area{weak_topics.length > 1 ? 's' : ''} detected
                          </p>
                          <p className="text-xs text-orange-600 mb-3">
                            {weak_topics.map(t => t.topic_name).join(', ')}
                          </p>
                          <button onClick={handleGeneratePlan} disabled={generatingPlan}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                            {generatingPlan
                              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Plan...</>
                              : <><Target size={14} /> Generate Personalized Study Plan</>}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Q&A Review */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <button onClick={() => setShowAnswers(v => !v)}
                      className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <BookOpen size={16} className="text-purple-500" /> Review All Answers ({totalQ} questions)
                      </span>
                      <ChevronDown size={16} className={`transition-transform text-gray-400 ${showAnswers ? 'rotate-180' : ''}`} />
                    </button>

                    {showAnswers && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {answers.map((a, idx) => (
                          <div key={a.question_id || idx}>
                            <button onClick={() => setExpandedQ(expandedQ === idx ? null : idx)}
                              className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${a.is_correct ? 'bg-green-500' : 'bg-red-500'}`}>
                                {idx + 1}
                              </span>
                              <p className="text-xs text-gray-700 flex-1 line-clamp-1">{a.question_text}</p>
                              {a.is_correct
                                ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                                : <XCircle size={14} className="text-red-500 flex-shrink-0" />}
                              <ChevronRight size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${expandedQ === idx ? 'rotate-90' : ''}`} />
                            </button>
                            {expandedQ === idx && (
                              <div className="px-5 pb-4 space-y-2 bg-gray-50">
                                <p className="text-sm text-gray-700 font-medium">{a.question_text}</p>
                                <div className="space-y-1.5">
                                  {(typeof a.options === 'string' ? JSON.parse(a.options) : a.options || []).map(opt => {
                                    let cls = 'flex items-center gap-2 px-3 py-2 rounded-lg text-xs ';
                                    if (opt.id === a.correct_answer) cls += 'bg-green-50 text-green-800 border border-green-200';
                                    else if (opt.id === a.selected_answer && !a.is_correct) cls += 'bg-red-50 text-red-800 border border-red-200';
                                    else cls += 'text-gray-500 border border-transparent';
                                    return (
                                      <div key={opt.id} className={cls}>
                                        <span className="font-bold w-4">{opt.id}.</span> {opt.text}
                                        {opt.id === a.correct_answer && <CheckCircle size={11} className="ml-auto text-green-500" />}
                                      </div>
                                    );
                                  })}
                                </div>
                                {a.explanation && (
                                  <div className="p-2.5 bg-blue-50 rounded-lg text-xs text-blue-800">
                                    <strong>Explanation:</strong> {a.explanation}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={() => navigate('/student/practice')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-blue-200 text-blue-600 rounded-xl text-sm hover:bg-blue-50 transition-colors">
                    <RotateCcw size={14} /> Practice Again
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
