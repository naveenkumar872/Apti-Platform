import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Wand2, ChevronRight } from 'lucide-react';

const STEPS = ['Basic Info', 'Questions', 'Settings', 'Publish'];

function Step1({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Test Title *</label>
        <input value={data.title} onChange={e => onChange({ title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g., TCS NQT Mock Test 1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={data.description} onChange={e => onChange({ description: e.target.value })}
          rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          placeholder="Describe the test..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select value={data.mode} onChange={e => onChange({ mode: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none">
            <option value="practice">Practice</option>
            <option value="test">Test (Proctored)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input type="number" value={data.duration_minutes} onChange={e => onChange({ duration_minutes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            min={1} />
        </div>
      </div>
    </div>
  );
}

function Step2({ questions, onAdd, onRemove, onAIGenerate }) {
  const [topics, setTopics] = useState([]);
  const [aiTopic, setAITopic] = useState('');
  const [aiCount, setAICount] = useState(5);
  const [aiLoading, setAILoading] = useState(false);
  const [manual, setManual] = useState({ question_text: '', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }], correct_answer: 'A', difficulty: 3 });

  useEffect(() => {
    api.get('/admin/subjects').then(r => {
      const t = [];
      (r.data.subjects || []).forEach(s => (s.topics || []).forEach(tp => t.push(tp)));
      setTopics(t);
    }).catch(() => {});
  }, []);

  const handleAIGenerate = async () => {
    setAILoading(true);
    try {
      const res = await api.post('/admin/tests/ai-generate', { topic_id: aiTopic, count: Number(aiCount) });
      onAIGenerate(res.data.questions);
      toast.success(`${res.data.questions.length} questions generated!`);
    } catch { toast.error('AI generation failed'); }
    finally { setAILoading(false); }
  };

  const addManual = () => {
    if (!manual.question_text.trim()) { toast.error('Question text required'); return; }
    onAdd({ ...manual, question_id: `manual_${Date.now()}` });
    setManual({ question_text: '', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }], correct_answer: 'A', difficulty: 3 });
  };

  return (
    <div className="space-y-6">
      {/* AI Generate */}
      <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
        <h3 className="font-medium text-purple-800 mb-3 flex items-center gap-2"><Wand2 size={16}/> AI Question Generator</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <select value={aiTopic} onChange={e => setAITopic(e.target.value)}
              className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
              <option value="">Select topic</option>
              {topics.map(t => <option key={t.topic_id} value={t.topic_id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <select value={aiCount} onChange={e => setAICount(e.target.value)}
              className="border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none bg-white">
              {[5, 10, 15].map(n => <option key={n} value={n}>{n} Q</option>)}
            </select>
          </div>
          <button onClick={handleAIGenerate} disabled={aiLoading || !aiTopic}
            className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60">
            {aiLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Added Questions */}
      {questions.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Questions ({questions.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {questions.map((q, i) => (
              <div key={q.question_id || i} className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-xs text-gray-400 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-gray-700 flex-1 line-clamp-2">{q.question_text}</p>
                <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Add */}
      <div className="border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><Plus size={16}/> Add Question Manually</h3>
        <textarea value={manual.question_text}
          onChange={e => setManual(m => ({ ...m, question_text: e.target.value }))}
          rows={2} placeholder="Question text..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3" />
        {manual.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2 mb-2">
            <span className="w-6 text-sm font-medium text-gray-600">{opt.id}.</span>
            <input value={opt.text}
              onChange={e => setManual(m => ({ ...m, options: m.options.map((o, j) => j === i ? { ...o, text: e.target.value } : o) }))}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              placeholder={`Option ${opt.id}`} />
          </div>
        ))}
        <div className="flex items-center gap-3 mt-2">
          <label className="text-sm text-gray-600">Correct:</label>
          <select value={manual.correct_answer} onChange={e => setManual(m => ({ ...m, correct_answer: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm">
            {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
          </select>
          <button onClick={addManual} className="ml-auto bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700">
            Add Question
          </button>
        </div>
      </div>
    </div>
  );
}

function Step3({ data, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-700">Shuffle Questions</p>
          <p className="text-xs text-gray-500">Randomize question order for each student</p>
        </div>
        <button
          onClick={() => onChange({ shuffle_questions: !data.shuffle_questions })}
          className={`relative w-11 h-6 rounded-full transition-colors ${data.shuffle_questions ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.shuffle_questions ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-700">Shuffle Options</p>
          <p className="text-xs text-gray-500">Randomize option order</p>
        </div>
        <button
          onClick={() => onChange({ shuffle_options: !data.shuffle_options })}
          className={`relative w-11 h-6 rounded-full transition-colors ${data.shuffle_options ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.shuffle_options ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correct Marks</label>
          <input type="number" step="0.25"
            value={data.marking_scheme?.correct ?? 1}
            onChange={e => onChange({ marking_scheme: { ...data.marking_scheme, correct: parseFloat(e.target.value) } })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wrong Marks (negative)</label>
          <input type="number" step="0.25"
            value={data.marking_scheme?.wrong ?? -0.25}
            onChange={e => onChange({ marking_scheme: { ...data.marking_scheme, wrong: parseFloat(e.target.value) } })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (optional)</label>
          <input type="datetime-local"
            value={data.start_time || ''}
            onChange={e => onChange({ start_time: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time (optional)</label>
          <input type="datetime-local"
            value={data.end_time || ''}
            onChange={e => onChange({ end_time: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none" />
        </div>
      </div>
    </div>
  );
}

export default function TestBuilder() {
  const [step, setStep] = useState(0);
  const [tests, setTests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', mode: 'practice', duration_minutes: 60,
    shuffle_questions: false, shuffle_options: false,
    marking_scheme: { correct: 1, wrong: -0.25 },
    start_time: '', end_time: '',
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/tests')
      .then(r => setTests(r.data.tests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (patch) => setForm(f => ({ ...f, ...patch }));

  const saveTest = async () => {
    if (!form.title.trim()) { toast.error('Title required'); setStep(0); return; }
    if (questions.length === 0) { toast.error('Add at least one question'); setStep(1); return; }
    setSaving(true);
    try {
      const payload = { ...form, questions: questions.map((q, i) => ({ ...q, display_order: i, marks: form.marking_scheme.correct })) };
      const res = await api.post('/admin/tests', payload);
      setTests(prev => [res.data.test, ...prev]);
      toast.success('Test created!');
      setShowForm(false);
      setForm({ title: '', description: '', mode: 'practice', duration_minutes: 60, shuffle_questions: false, shuffle_options: false, marking_scheme: { correct: 1, wrong: -0.25 }, start_time: '', end_time: '' });
      setQuestions([]);
      setStep(0);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create test');
    } finally { setSaving(false); }
  };

  const publishTest = async (testId) => {
    try {
      await api.post(`/admin/tests/${testId}/publish`);
      setTests(prev => prev.map(t => t.test_id === testId ? { ...t, status: 'scheduled' } : t));
      toast.success('Test published!');
    } catch { toast.error('Failed to publish'); }
  };

  const statusColors = { draft: 'bg-gray-100 text-gray-700', scheduled: 'bg-blue-100 text-blue-700', live: 'bg-green-100 text-green-700', completed: 'bg-purple-100 text-purple-700' };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Test Builder</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> New Test
        </button>
      </div>

      {/* Test Builder Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          {/* Steps */}
          <div className="flex border-b border-gray-100">
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => setStep(i)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${step === i ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <span className={`inline-flex w-6 h-6 rounded-full text-xs items-center justify-center mr-2 ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</span>
                {s}
              </button>
            ))}
          </div>

          <div className="p-6">
            {step === 0 && <Step1 data={form} onChange={update} />}
            {step === 1 && <Step2 questions={questions} onAdd={q => setQuestions(prev => [...prev, q])} onRemove={i => setQuestions(prev => prev.filter((_, j) => j !== i))} onAIGenerate={qs => setQuestions(prev => [...prev, ...qs])} />}
            {step === 2 && <Step3 data={form} onChange={update} />}
            {step === 3 && (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Review & Save</h3>
                <div className="inline-block text-left bg-gray-50 rounded-xl p-5 mb-6 space-y-2 text-sm">
                  <p><strong>Title:</strong> {form.title}</p>
                  <p><strong>Mode:</strong> {form.mode}</p>
                  <p><strong>Duration:</strong> {form.duration_minutes} minutes</p>
                  <p><strong>Questions:</strong> {questions.length}</p>
                  <p><strong>Shuffle:</strong> {form.shuffle_questions ? 'Yes' : 'No'}</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <button onClick={saveTest} disabled={saving} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Test'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40">Back</button>
              {step < STEPS.length - 1 && (
                <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
                  Next <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tests List */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : tests.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No tests yet. Create your first test!</p>
      ) : (
        <div className="space-y-3">
          {tests.map(t => (
            <div key={t.test_id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800">{t.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[t.status] || 'bg-gray-100'}`}>{t.status}</span>
                </div>
                <p className="text-xs text-gray-500">{t.duration_minutes} min · {t.total_marks} marks · {t.mode}</p>
              </div>
              {t.status === 'draft' && (
                <button onClick={() => publishTest(t.test_id)} className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Publish
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
