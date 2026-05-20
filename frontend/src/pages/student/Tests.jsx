import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

// Proctor hooks
function useProctor(config, onViolation) {
  useEffect(() => {
    if (!config) return;

    const handleVisibility = () => {
      if (document.hidden) onViolation('tab_switch');
    };
    const handleFullscreenExit = () => {
      if (!document.fullscreenElement) onViolation('fullscreen_exit');
    };
    const handleContextMenu = (e) => { e.preventDefault(); onViolation('right_click'); };
    const handleCopy = (e) => { e.preventDefault(); onViolation('copy_attempt'); };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenExit);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenExit);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, [config, onViolation]);
}

function TestInterface({ attempt, test, onSubmit }) {
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState((test.duration_minutes || 60) * 60);
  const [violations, setViolations] = useState(0);
  const questions = attempt.questions || [];

  const handleViolation = useCallback(async (type) => {
    setViolations(v => v + 1);
    toast.error(`Violation: ${type.replace('_', ' ')}`);
    try {
      const res = await api.post(`/student/tests/attempts/${attempt.attempt_id}/violation`, { violation_type: type });
      if (res.data.auto_submit) {
        toast.error('Auto-submitting due to violations!');
        onSubmit(attempt.attempt_id, answers);
      }
    } catch {}
  }, [attempt.attempt_id, answers, onSubmit]);

  useProctor(test.proctoring_config, handleViolation);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { onSubmit(attempt.attempt_id, answers); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attempt.attempt_id, answers, onSubmit]);

  const saveAnswer = async (qId, ans) => {
    setAnswers(prev => ({ ...prev, [qId]: ans }));
    try {
      await api.post(`/student/tests/attempts/${attempt.attempt_id}/answer`, {
        question_id: qId,
        selected_answer: ans,
        time_taken_seconds: (test.duration_minutes * 60) - timeLeft,
      });
    } catch {}
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const q = questions[currentIdx];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 mb-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="font-semibold text-gray-800">{test.title}</h2>
          <p className="text-xs text-gray-500">{questions.length} questions · {test.total_marks} marks</p>
        </div>
        <div className="flex items-center gap-4">
          {violations > 0 && (
            <span className="flex items-center gap-1 text-orange-600 text-sm">
              <AlertTriangle size={14} /> {violations} violation{violations > 1 ? 's' : ''}
            </span>
          )}
          <span className={`flex items-center gap-1 text-sm font-mono font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-700'}`}>
            <Clock size={14} /> {mins}:{secs}
          </span>
          <button
            onClick={() => onSubmit(attempt.attempt_id, answers)}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Question Palette */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-xs font-medium text-gray-600 mb-2">Questions</p>
            <div className="grid grid-cols-5 gap-1">
              {questions.map((q, i) => (
                <button
                  key={q.question_id}
                  onClick={() => setCurrentIdx(i)}
                  className={`w-8 h-8 text-xs rounded-md font-medium ${
                    i === currentIdx ? 'bg-blue-600 text-white' :
                    answers[q.question_id] ? 'bg-green-500 text-white' :
                    'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 inline-block"/> Answered</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-200 inline-block"/> Not visited</div>
            </div>
          </div>
        </div>

        {/* Current Question */}
        {q && (
          <div className="flex-1 bg-white rounded-xl p-6 shadow-sm">
            <p className="text-xs text-gray-500 mb-3">Question {currentIdx + 1} of {questions.length}</p>
            <p className="text-gray-800 text-sm leading-relaxed mb-5">{q.question_text}</p>

            <div className="space-y-2">
              {(q.options || []).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => saveAnswer(q.question_id, opt.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    answers[q.question_id] === opt.id
                      ? 'bg-blue-50 border-blue-400 text-blue-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium mr-2">{opt.id}.</span> {opt.text}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                disabled={currentIdx === questions.length - 1}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState(null);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [submittedResult, setSubmittedResult] = useState(null);

  useEffect(() => {
    api.get('/student/tests')
      .then(r => setTests(r.data.tests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (test) => {
    try {
      if (test.proctoring_config?.fullscreen) {
        await document.documentElement.requestFullscreen?.();
      }
      const res = await api.post(`/student/tests/${test.test_id}/start`);
      setActiveTest(test);
      setActiveAttempt(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start test');
    }
  };

  const handleSubmit = async (attemptId) => {
    try {
      const res = await api.post(`/student/tests/attempts/${attemptId}/submit`);
      setSubmittedResult(res.data);
      setActiveTest(null);
      setActiveAttempt(null);
      if (document.fullscreenElement) document.exitFullscreen();
    } catch { toast.error('Submit failed'); }
  };

  if (submittedResult) return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Submitted!</h2>
        <div className="grid grid-cols-3 gap-4 my-6">
          <div className="p-3 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-700">{submittedResult.score}</p>
            <p className="text-xs text-gray-500">Score</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-700">{Math.round(submittedResult.accuracy_percent)}%</p>
            <p className="text-xs text-gray-500">Accuracy</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-700">{submittedResult.correct_count}/{submittedResult.total_questions}</p>
            <p className="text-xs text-gray-500">Correct</p>
          </div>
        </div>
        <button onClick={() => setSubmittedResult(null)} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700">
          Back to Tests
        </button>
      </div>
    </div>
  );

  if (activeTest && activeAttempt) return (
    <TestInterface
      test={activeTest}
      attempt={activeAttempt}
      onSubmit={(id) => handleSubmit(id)}
    />
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Assigned Tests</h1>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No tests assigned yet</div>
      ) : (
        <div className="space-y-4">
          {tests.map(t => (
            <div key={t.test_id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">{t.title}</h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span><Clock size={12} className="inline mr-1" />{t.duration_minutes} min</span>
                  <span>{t.total_marks} marks</span>
                  {t.start_time && <span>Starts: {new Date(t.start_time).toLocaleString()}</span>}
                </div>
              </div>
              <button
                onClick={() => handleStart(t)}
                className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-blue-700"
              >
                Start Test
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
