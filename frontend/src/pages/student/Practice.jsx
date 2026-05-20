import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  BarChart2, CheckCircle, XCircle, Clock, ChevronRight, ChevronLeft,
  Flag, SkipForward, BookOpen, Target, Zap, ListChecks, RotateCcw,
  TrendingUp, AlertCircle
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const DIFF_LABELS = { '': 'Any Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFF_COLORS = { easy: 'text-green-600 bg-green-50 border-green-200', medium: 'text-yellow-600 bg-yellow-50 border-yellow-200', hard: 'text-red-600 bg-red-50 border-red-200', '': 'text-gray-600 bg-gray-50 border-gray-200' };

// ─── Setup View ──────────────────────────────────────────────────────────────
function SetupView({ onStart }) {
  const [subjects, setSubjects] = useState([]);
  const [config, setConfig] = useState({ subject_id: '', topic_id: '', count: 10, difficulty: '', mode: 'instant' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/student/subjects').then(r => setSubjects(r.data.subjects || [])).catch(() => {});
  }, []);

  const selectedSubject = subjects.find(s => s.subject_id === config.subject_id);
  const topics = selectedSubject?.topics || [];

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v, ...(k === 'subject_id' ? { topic_id: '' } : {}) }));

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await api.post('/student/practice/start', {
        topic_id: config.topic_id || undefined,
        count: Number(config.count),
        difficulty: config.difficulty || undefined,
      });
      onStart({ ...res.data, mode: config.mode });
    } catch (err) {
      toast.error(err.response?.data?.error || 'No questions found for selected filters. Try different options.');
    } finally { setLoading(false); }
  };

  const modes = [
    { id: 'instant', icon: Zap, label: 'Instant Feedback', desc: 'See answer after each question' },
    { id: 'test', icon: ListChecks, label: 'Test Mode', desc: 'Review all answers at the end' },
  ];

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Practice Questions</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your session and start practicing</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">

        {/* Mode selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Session Mode</label>
          <div className="grid grid-cols-2 gap-3">
            {modes.map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                onClick={() => set('mode', id)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${config.mode === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={15} className={config.mode === id ? 'text-blue-600' : 'text-gray-400'} />
                  <span className={`text-sm font-medium ${config.mode === id ? 'text-blue-700' : 'text-gray-700'}`}>{label}</span>
                </div>
                <p className="text-xs text-gray-400">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select value={config.subject_id} onChange={e => set('subject_id', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
          </select>
        </div>

        {/* Topic — only shown when subject selected */}
        {config.subject_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <select value={config.topic_id} onChange={e => set('topic_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Topics in {selectedSubject?.name}</option>
              {topics.map(t => <option key={t.topic_id} value={t.topic_id}>{t.name}</option>)}
            </select>
          </div>
        )}

        {/* Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20, 25].map(n => (
              <button key={n} onClick={() => set('count', n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${config.count === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(DIFF_LABELS).map(([val, lbl]) => (
              <button key={val} onClick={() => set('difficulty', val)}
                className={`py-2 rounded-lg text-xs font-medium border transition-colors ${config.difficulty === val ? DIFF_COLORS[val] + ' border-2' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleStart} disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? (
            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading questions...</span>
          ) : (
            <><ChevronRight size={18} /> Start Session ({config.count} Questions)</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Session View ────────────────────────────────────────────────────────────
function SessionView({ session, onEnd }) {
  const { questions, session_id, mode } = session;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});        // qId → selectedOption
  const [feedback, setFeedback] = useState({});      // qId → { is_correct, correct_answer, explanation }
  const [flagged, setFlagged] = useState(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Reset per-question timer when navigating
  useEffect(() => { questionStartRef.current = Date.now(); }, [current]);

  const q = questions[current];
  const totalQ = questions.length;
  const answered = Object.keys(answers).length;
  const selectedAnswer = answers[q?.question_id];
  const result = feedback[q?.question_id];
  const isAnswered = !!selectedAnswer;
  const showResult = mode === 'instant' && isAnswered;

  const getTimeTaken = () => Math.round((Date.now() - questionStartRef.current) / 1000);

  const handleSelect = useCallback(async (optId) => {
    if (answers[q.question_id]) return; // already answered
    const timeTaken = getTimeTaken();
    setAnswers(prev => ({ ...prev, [q.question_id]: optId }));
    setSubmitting(true);
    try {
      const res = await api.post('/student/practice/submit-answer', {
        session_id,
        question_id: q.question_id,
        selected_answer: optId,
        time_taken_seconds: timeTaken,
      });
      setFeedback(prev => ({ ...prev, [q.question_id]: res.data }));
    } catch { toast.error('Failed to save answer'); }
    finally { setSubmitting(false); }
  }, [q, answers, session_id]);

  const handleEnd = async () => {
    // In test mode, warn if questions unanswered
    const unanswered = totalQ - answered;
    if (unanswered > 0 && mode === 'test') {
      if (!window.confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`)) return;
    }
    setEnding(true);
    try {
      const res = await api.post('/student/practice/end', { session_id });
      onEnd({ ...res.data, allAnswers: feedback, questions });
    } catch { toast.error('Failed to end session'); }
    finally { setEnding(false); }
  };

  const toggleFlag = () => setFlagged(prev => {
    const next = new Set(prev);
    next.has(q.question_id) ? next.delete(q.question_id) : next.add(q.question_id);
    return next;
  });

  // Dot color for navigator
  const dotColor = (idx) => {
    const qId = questions[idx].question_id;
    if (flagged.has(qId)) return idx === current ? 'bg-yellow-500 ring-2 ring-yellow-300' : 'bg-yellow-400';
    if (feedback[qId]) return feedback[qId].is_correct
      ? (idx === current ? 'bg-green-500 ring-2 ring-green-300' : 'bg-green-400')
      : (idx === current ? 'bg-red-500 ring-2 ring-red-300' : 'bg-red-400');
    if (answers[qId]) return idx === current ? 'bg-blue-500 ring-2 ring-blue-300' : 'bg-blue-400';
    return idx === current ? 'bg-gray-400 ring-2 ring-gray-300' : 'bg-gray-200';
  };

  const options = q?.options || [];
  const diffLabel = q?.difficulty ? ['', 'Easy', 'Easy', 'Medium', 'Hard', 'Hard'][q.difficulty] || '' : '';
  const diffColor = ['', 'text-green-600', 'text-green-600', 'text-yellow-600', 'text-red-600', 'text-red-600'][q?.difficulty] || '';

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-blue-600" />
          <span className="font-semibold text-gray-800 text-sm">Question {current + 1} / {totalQ}</span>
          <span className="text-xs text-gray-400">{answered} answered</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-sm font-mono text-gray-600">
            <Clock size={14} className="text-blue-500" /> {fmtTime(elapsed)}
          </span>
          <button onClick={handleEnd} disabled={ending}
            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60">
            {ending ? 'Submitting…' : 'End Session'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
        <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${(answered / totalQ) * 100}%` }} />
      </div>

      {/* Question Navigator */}
      <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {questions.map((_, idx) => (
            <button key={idx} onClick={() => setCurrent(idx)}
              className={`w-7 h-7 rounded-full text-xs font-bold text-white transition-all ${dotColor(idx)}`}>
              {idx + 1}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Correct</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Wrong</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Answered</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" /> Flagged</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            {q?.topic_name && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{q.topic_name}</span>}
            {diffLabel && <span className={`text-xs font-medium ${diffColor}`}>{diffLabel}</span>}
          </div>
          <button onClick={toggleFlag} title="Flag for review"
            className={`p-1.5 rounded-lg transition-colors ${flagged.has(q?.question_id) ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50'}`}>
            <Flag size={15} />
          </button>
        </div>

        <p className="text-gray-800 text-sm leading-relaxed mb-4 mt-2">{q?.question_text}</p>

        <div className="space-y-2">
          {options.map(opt => {
            let cls = 'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex items-center gap-3 ';
            if (showResult) {
              if (opt.id === result?.correct_answer) cls += 'bg-green-50 border-green-400 text-green-800';
              else if (opt.id === selectedAnswer) cls += 'bg-red-50 border-red-400 text-red-800';
              else cls += 'border-gray-200 text-gray-400';
            } else if (selectedAnswer === opt.id) {
              cls += 'bg-blue-50 border-blue-400 text-blue-800';
            } else {
              cls += 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700';
            }
            const locked = isAnswered || submitting;
            return (
              <button key={opt.id} onClick={() => handleSelect(opt.id)} disabled={locked} className={cls + (locked ? ' cursor-default' : '')}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  showResult && opt.id === result?.correct_answer ? 'bg-green-500 text-white'
                  : showResult && opt.id === selectedAnswer ? 'bg-red-500 text-white'
                  : selectedAnswer === opt.id ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-500'
                }`}>{opt.id}</span>
                <span>{opt.text}</span>
                {showResult && opt.id === result?.correct_answer && <CheckCircle size={15} className="ml-auto text-green-500 flex-shrink-0" />}
                {showResult && opt.id === selectedAnswer && opt.id !== result?.correct_answer && <XCircle size={15} className="ml-auto text-red-500 flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Instant feedback explanation */}
        {showResult && result?.explanation && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex gap-2 ${result.is_correct ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <div><strong>{result.is_correct ? 'Correct! ' : 'Incorrect. '}</strong>{result.explanation}</div>
          </div>
        )}

        {/* Test mode: show selected indication */}
        {mode === 'test' && isAnswered && !showResult && (
          <div className="mt-3 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 flex items-center gap-1">
            <CheckCircle size={13} /> Answer saved. Results shown after you finish the session.
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          className="flex items-center gap-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          <ChevronLeft size={16} /> Prev
        </button>

        {current < totalQ - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            {isAnswered ? 'Next' : 'Skip'} <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={handleEnd} disabled={ending}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60">
            <CheckCircle size={16} /> {ending ? 'Submitting…' : 'Finish Session'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────
function ResultsView({ result, onRetry }) {
  const [showReview, setShowReview] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const { score, total, accuracy_percent, time_taken_seconds, answers = [], questions = [], allAnswers = {} } = result;
  const timeMin = Math.floor((time_taken_seconds || 0) / 60);
  const timeSec = (time_taken_seconds || 0) % 60;

  // Topic breakdown from answers
  const topicMap = {};
  answers.forEach(a => {
    const topic = a.topic_name || 'General';
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total++;
    if (a.is_correct) topicMap[topic].correct++;
  });
  const topicBreakdown = Object.entries(topicMap).map(([name, v]) => ({
    name, correct: v.correct, total: v.total,
    pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
  })).sort((a, b) => a.pct - b.pct);

  const grade = accuracy_percent >= 80 ? { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' }
    : accuracy_percent >= 60 ? { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' }
    : accuracy_percent >= 40 ? { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    : { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-50' };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Score Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-4 text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-3 ${grade.bg} ${grade.color}`}>
          <TrendingUp size={14} /> {grade.label}
        </div>
        <div className="text-5xl font-bold text-gray-800 mb-1">{Math.round(accuracy_percent || 0)}%</div>
        <p className="text-gray-500 text-sm">Accuracy</p>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-3 bg-green-50 rounded-xl">
            <p className="text-xl font-bold text-green-700">{score ?? 0}</p>
            <p className="text-xs text-gray-500">Correct</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl">
            <p className="text-xl font-bold text-red-600">{(total ?? 0) - (score ?? 0)}</p>
            <p className="text-xs text-gray-500">Wrong</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xl font-bold text-gray-700">{timeMin}m {timeSec}s</p>
            <p className="text-xs text-gray-500">Time</p>
          </div>
        </div>
      </div>

      {/* Topic Breakdown */}
      {topicBreakdown.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Target size={16} className="text-blue-500" /> Topic Breakdown
          </h3>
          <div className="space-y-2.5">
            {topicBreakdown.map(t => (
              <div key={t.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{t.name}</span>
                  <span className={t.pct >= 60 ? 'text-green-600' : 'text-red-600'}>{t.correct}/{t.total} ({t.pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${t.pct >= 60 ? 'bg-green-500' : t.pct >= 40 ? 'bg-yellow-400' : 'bg-red-500'}`}
                    style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Review */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
        <button onClick={() => setShowReview(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-800">
          <span className="flex items-center gap-2"><ListChecks size={16} className="text-purple-500" /> Review All Answers</span>
          <ChevronRight size={16} className={`transition-transform ${showReview ? 'rotate-90' : ''}`} />
        </button>
        {showReview && (
          <div className="border-t border-gray-100">
            {answers.map((a, idx) => {
              const isOpen = expandedIdx === idx;
              const isCorrect = !!a.is_correct;
              return (
                <div key={a.question_id || idx} className="border-b border-gray-50 last:border-0">
                  <button onClick={() => setExpandedIdx(isOpen ? null : idx)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 transition-colors">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                      {idx + 1}
                    </span>
                    <p className="text-xs text-gray-700 flex-1 line-clamp-1">{a.question_text}</p>
                    {isCorrect ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> : <XCircle size={14} className="text-red-500 flex-shrink-0" />}
                    <ChevronRight size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 space-y-2">
                      <p className="text-sm text-gray-700">{a.question_text}</p>
                      <div className="space-y-1.5">
                        {(a.options || []).map(opt => {
                          let cls = 'flex items-center gap-2 px-3 py-2 rounded-lg text-xs ';
                          if (opt.id === a.correct_answer) cls += 'bg-green-50 text-green-800 border border-green-200';
                          else if (opt.id === a.selected_answer) cls += 'bg-red-50 text-red-800 border border-red-200';
                          else cls += 'text-gray-500';
                          return (
                            <div key={opt.id} className={cls}>
                              <span className="font-bold w-4">{opt.id}.</span> {opt.text}
                              {opt.id === a.correct_answer && <CheckCircle size={12} className="ml-auto text-green-500" />}
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
              );
            })}
          </div>
        )}
      </div>

      <button onClick={onRetry}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors">
        <RotateCcw size={16} /> Start Another Session
      </button>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Practice() {
  const [view, setView] = useState('setup');
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);

  if (view === 'session') return (
    <SessionView session={session} onEnd={r => { setResult(r); setView('results'); }} />
  );
  if (view === 'results') return (
    <ResultsView result={result} onRetry={() => { setView('setup'); setSession(null); setResult(null); }} />
  );
  return (
    <SetupView onStart={s => { setSession(s); setView('session'); }} />
  );
}
