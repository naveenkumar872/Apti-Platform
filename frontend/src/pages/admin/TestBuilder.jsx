import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Wand2, ChevronRight, ClipboardList, Users, TrendingUp, Award, Clock, FileText, BookOpen, Shield, Calendar } from 'lucide-react';

const STEPS = ['Basic Info', 'Questions', 'Settings', 'Publish'];
const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl";
const inputCls = "w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none";

function Step1({ data, onChange }) {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignMode, setAssignMode] = useState('all'); // 'all' | 'batch' | 'student'

  useEffect(() => {
    api.get('/admin/batches').then(r => setBatches(r.data.batches || [])).catch(() => {});
    api.get('/admin/users', { params: { role: 'student', limit: 100 } }).then(r => setStudents(r.data.users || [])).catch(() => {});
  }, []);

  const toggleBatch = (batchId) => {
    const current = data.assigned_to?.batch_ids || [];
    const updated = current.includes(batchId) ? current.filter(b => b !== batchId) : [...current, batchId];
    onChange({ assigned_to: { batch_ids: updated, student_ids: [] } });
  };

  const toggleStudent = (userId) => {
    const current = data.assigned_to?.student_ids || [];
    const updated = current.includes(userId) ? current.filter(s => s !== userId) : [...current, userId];
    onChange({ assigned_to: { batch_ids: [], student_ids: updated } });
  };

  const handleModeChange = (m) => {
    setAssignMode(m);
    onChange({ assigned_to: { batch_ids: [], student_ids: [] } });
  };

  const selBatches = data.assigned_to?.batch_ids || [];
  const selStudents = data.assigned_to?.student_ids || [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Title *</label>
        <input value={data.title} onChange={e => onChange({ title: e.target.value })}
          className={inputCls} placeholder="e.g., TCS NQT Mock Test 1" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea value={data.description} onChange={e => onChange({ description: e.target.value })}
          rows={3} className={inputCls + " resize-none"}
          placeholder="Describe the test..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
          <select value={data.mode} onChange={e => onChange({ mode: e.target.value })}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
            <option value="practice">Practice</option>
            <option value="test">Test (Proctored)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes)</label>
          <input type="number" value={data.duration_minutes} onChange={e => onChange({ duration_minutes: e.target.value })}
            className={inputCls} min={1} />
        </div>
      </div>

      {/* Assign To */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign To</label>
        {/* Mode selector */}
        <div className="flex gap-2 mb-3">
          {[
            { key: 'all', label: '🌐 All Students' },
            { key: 'batch', label: '👥 By Batch' },
            { key: 'student', label: '👤 Specific Students' },
          ].map(({ key, label }) => (
            <button key={key} type="button" onClick={() => handleModeChange(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${assignMode === key ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Batch picker */}
        {assignMode === 'batch' && (
          batches.length === 0 ? (
            <p className="text-xs text-gray-400 mt-1">No batches created yet. Go to Users &amp; Batches to create one.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {batches.map(b => (
                <button key={b.batch_id} type="button" onClick={() => toggleBatch(b.batch_id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selBatches.includes(b.batch_id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400'}`}>
                  {selBatches.includes(b.batch_id) ? '✓ ' : ''}{b.name}
                </button>
              ))}
            </div>
          )
        )}

        {/* Individual student picker */}
        {assignMode === 'student' && (
          students.length === 0 ? (
            <p className="text-xs text-gray-400 mt-1">No students registered yet.</p>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl max-h-40 overflow-y-auto">
              {students.map(s => (
                <button key={s.user_id} type="button" onClick={() => toggleStudent(s.user_id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b last:border-b-0 border-gray-100 dark:border-gray-800 transition-colors text-sm ${selStudents.includes(s.user_id) ? 'bg-violet-50 dark:bg-violet-950/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${selStudents.includes(s.user_id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                    {selStudents.includes(s.user_id) ? '✓' : ''}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}{s.batch_name ? ` · ${s.batch_name}` : ''}</p>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {/* Summary */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
          {assignMode === 'all' && 'Visible to all students once published'}
          {assignMode === 'batch' && (selBatches.length === 0 ? 'Select at least one batch' : `Assigned to ${selBatches.length} batch(es)`)}
          {assignMode === 'student' && (selStudents.length === 0 ? 'Select at least one student' : `Assigned to ${selStudents.length} student(s)`)}
        </p>
      </div>
    </div>
  );
}

function Step2({ questions, onAdd, onRemove, onAIGenerate }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topics, setTopics] = useState([]);
  const [aiTopic, setAITopic] = useState('');
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState('');
  const [aiCount, setAICount] = useState(5);
  const [aiLoading, setAILoading] = useState(false);
  const [manual, setManual] = useState({ question_text: '', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }], correct_answer: 'A', difficulty: 3 });

  // Load all subjects
  useEffect(() => {
    api.get('/admin/subjects')
      .then(r => setSubjects(r.data.subjects || []))
      .catch(() => {});
  }, []);

  // Cascading load of topics
  useEffect(() => {
    if (!selectedSubject) {
      setTopics([]);
      setAITopic('');
      setSelectedConcept('');
      return;
    }
    api.get('/admin/topics', { params: { subject_id: selectedSubject } })
      .then(r => setTopics(r.data.topics || []))
      .catch(() => {});
  }, [selectedSubject]);

  // Cascading load of concepts
  useEffect(() => {
    if (!aiTopic) {
      setConcepts([]);
      setSelectedConcept('');
      return;
    }
    api.get('/admin/concepts', { params: { topic_id: aiTopic } })
      .then(r => setConcepts(r.data.concepts || []))
      .catch(() => {});
  }, [aiTopic]);

  const handleAIGenerate = async () => {
    if (!selectedSubject || !aiTopic) {
      toast.error('Subject and Topic are required');
      return;
    }

    const subjName = subjects.find(s => s.subject_id === selectedSubject)?.name || '';
    const topicName = topics.find(t => t.topic_id === aiTopic)?.name || '';
    const conceptName = concepts.find(c => c.concept_id === selectedConcept)?.name || '';

    setAILoading(true);
    try {
      const res = await api.post('/admin/tests/ai-generate', {
        subject: subjName,
        topic: topicName,
        concept: conceptName || undefined,
        num_questions: Number(aiCount),
        difficulty: 'medium'
      });

      const mappedQuestions = (res.data.questions || []).map((q, idx) => {
        const cleanOptionText = (optStr) => {
          if (!optStr) return '';
          return optStr.replace(/^[A-D]\.\s*/i, '').trim();
        };

        const options = [
          { id: 'A', text: cleanOptionText(q.options[0]) },
          { id: 'B', text: cleanOptionText(q.options[1]) },
          { id: 'C', text: cleanOptionText(q.options[2]) },
          { id: 'D', text: cleanOptionText(q.options[3]) },
        ];

        const letterMap = ['A', 'B', 'C', 'D'];
        const correctLetter = letterMap[q.correct_index] || 'A';

        return {
          question_text: q.question,
          options,
          correct_answer: correctLetter,
          difficulty: q.difficulty === 'easy' ? 1 : q.difficulty === 'medium' ? 3 : 5,
          explanation: q.explanation || '',
          estimated_time_seconds: q.estimated_time_seconds || 60,
          question_id: `ai_${Date.now()}_${idx}`
        };
      });

      onAIGenerate(mappedQuestions);
      toast.success(`${mappedQuestions.length} questions generated!`);
    } catch { 
      toast.error('AI generation failed'); 
    } finally { 
      setAILoading(false); 
    }
  };

  const addManual = () => {
    if (!manual.question_text.trim()) { toast.error('Question text required'); return; }
    onAdd({ ...manual, question_id: `manual_${Date.now()}` });
    setManual({ question_text: '', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }], correct_answer: 'A', difficulty: 3 });
  };

  return (
    <div className="space-y-6">
      {/* AI Generate */}
      <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900/40">
        <h3 className="font-medium text-violet-800 dark:text-violet-300 mb-3 flex items-center gap-2"><Wand2 size={16}/> AI Question Generator</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Subject *</label>
            <select value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setAITopic(''); setSelectedConcept(''); }}
              className="w-full bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-800 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.subject_id} value={s.subject_id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Topic *</label>
            <select value={aiTopic} onChange={e => { setAITopic(e.target.value); setSelectedConcept(''); }}
              disabled={!selectedSubject}
              className="w-full bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-800 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none disabled:opacity-50">
              <option value="">Select topic</option>
              {topics.map(t => <option key={t.topic_id} value={t.topic_id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Concept (optional)</label>
            <select value={selectedConcept} onChange={e => setSelectedConcept(e.target.value)}
              disabled={!aiTopic}
              className="w-full bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-800 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none disabled:opacity-50">
              <option value="">-- All Concepts --</option>
              {concepts.map(c => <option key={c.concept_id} value={c.concept_id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Count</label>
              <select value={aiCount} onChange={e => setAICount(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-800 text-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none">
                {[5, 10, 15].map(n => <option key={n} value={n}>{n} Q</option>)}
              </select>
            </div>
            <button onClick={handleAIGenerate} disabled={aiLoading || !selectedSubject || !aiTopic}
              className="bg-violet-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-violet-500 disabled:opacity-60 transition-colors self-end h-[38px] flex items-center justify-center font-semibold">
              {aiLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Added Questions */}
      {questions.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Questions ({questions.length})</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {questions.map((q, i) => (
              <div key={q.question_id || i} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-400 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 line-clamp-2">{q.question_text}</p>
                <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-500 flex-shrink-0 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Add */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"><Plus size={16}/> Add Question Manually</h3>
        <textarea value={manual.question_text}
          onChange={e => setManual(m => ({ ...m, question_text: e.target.value }))}
          rows={2} placeholder="Question text..."
          className={inputCls + " resize-none mb-3"} />
        {manual.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-2 mb-2">
            <span className="w-6 text-sm font-medium text-gray-600 dark:text-gray-400">{opt.id}.</span>
            <input value={opt.text}
              onChange={e => setManual(m => ({ ...m, options: m.options.map((o, j) => j === i ? { ...o, text: e.target.value } : o) }))}
              className={inputCls}
              placeholder={`Option ${opt.id}`} />
          </div>
        ))}
        <div className="flex items-center gap-3 mt-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Correct:</label>
          <select value={manual.correct_answer} onChange={e => setManual(m => ({ ...m, correct_answer: e.target.value }))}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-3 py-1.5 text-sm">
            {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
          </select>
          <button onClick={addManual} className="ml-auto bg-violet-600 text-white text-sm px-4 py-1.5 rounded-xl hover:bg-violet-500 transition-colors">
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
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Shuffle Questions</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Randomize question order for each student</p>
        </div>
        <button
          onClick={() => onChange({ shuffle_questions: !data.shuffle_questions })}
          className={`relative w-11 h-6 rounded-full transition-colors ${data.shuffle_questions ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.shuffle_questions ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Shuffle Options</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Randomize option order</p>
        </div>
        <button
          onClick={() => onChange({ shuffle_options: !data.shuffle_options })}
          className={`relative w-11 h-6 rounded-full transition-colors ${data.shuffle_options ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.shuffle_options ? 'translate-x-5' : ''}`} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correct Marks</label>
          <input type="number" step="0.25"
            value={data.marking_scheme?.correct ?? 1}
            onChange={e => onChange({ marking_scheme: { ...data.marking_scheme, correct: parseFloat(e.target.value) } })}
            className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wrong Marks (negative)</label>
          <input type="number" step="0.25"
            value={data.marking_scheme?.wrong ?? -0.25}
            onChange={e => onChange({ marking_scheme: { ...data.marking_scheme, wrong: parseFloat(e.target.value) } })}
            className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time (optional)</label>
          <input type="datetime-local"
            value={data.start_time || ''}
            onChange={e => onChange({ start_time: e.target.value })}
            className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time (optional)</label>
          <input type="datetime-local"
            value={data.end_time || ''}
            onChange={e => onChange({ end_time: e.target.value })}
            className={inputCls} />
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
    assigned_to: { batch_ids: [], student_ids: [] },
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
      const payload = {
        ...form,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        questions: questions.map((q, i) => ({ ...q, display_order: i, marks: form.marking_scheme.correct }))
      };
      const res = await api.post('/admin/tests', payload);
      setTests(prev => [res.data.test, ...prev].filter(Boolean));
      toast.success('Test created!');
      setShowForm(false);
      setForm({ title: '', description: '', mode: 'practice', duration_minutes: 60, shuffle_questions: false, shuffle_options: false, marking_scheme: { correct: 1, wrong: -0.25 }, start_time: '', end_time: '', assigned_to: { batch_ids: [], student_ids: [] } });
      setQuestions([]);
      setStep(0);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create test');
    } finally { setSaving(false); }
  };

  const publishTest = async (testId) => {
    try {
      await api.post(`/admin/tests/${testId}/publish`);
      setTests(prev => prev.map(t => t.test_id === testId ? { ...t, status: 'live' } : t));
      toast.success('Test published!');
    } catch { toast.error('Failed to publish'); }
  };

  const deleteTest = async (testId) => {
    if (!window.confirm('Delete this test? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/tests/${testId}`);
      setTests(prev => prev.filter(t => t.test_id !== testId));
      toast.success('Test deleted');
    } catch { toast.error('Failed to delete test'); }
  };

  const deleteAll = async () => {
    if (!window.confirm(`Delete all ${tests.length} tests? This cannot be undone.`)) return;
    try {
      await Promise.all(tests.map(t => api.delete(`/admin/tests/${t.test_id}`)));
      setTests([]);
      toast.success('All tests deleted');
    } catch { toast.error('Failed to delete some tests'); }
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    live: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
  };

  const totalTests = tests.length;
  const practiceTests = tests.filter(t => t.mode === 'practice').length;
  const proctoredTests = tests.filter(t => t.mode === 'test').length;
  const liveTests = tests.filter(t => t.status === 'live').length;

  const cards = [
    { label: 'Total Tests', value: totalTests, icon: ClipboardList, grad: 'from-blue-500 to-indigo-600' },
    { label: 'Practice Mode', value: practiceTests, icon: Award, grad: 'from-emerald-500 to-teal-600' },
    { label: 'Proctored Mode', value: proctoredTests, icon: Users, grad: 'from-violet-500 to-purple-600' },
    { label: 'Live Tests', value: liveTests, icon: TrendingUp, grad: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Assessments</span>
            </div>
            <h1 className="text-2xl md:text-[28px] font-semibold text-white tracking-tight">Test Builder</h1>
            <p className="text-white/70 text-sm mt-1.5">Create & manage student tests</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2.5 rounded-xl backdrop-blur-sm transition-colors mt-1 flex-shrink-0">
            <Plus size={15} /> New Test
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {cards.map(({ label, value, icon: Icon, grad }) => (
            <div key={label} className={C + " p-4 shadow-sm"}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
        {/* Test Builder Form */}
        {showForm && (
          <div className={C + " mb-6 overflow-hidden shadow-sm"}>
            {/* Steps */}
            <div className="flex border-b border-gray-100 dark:border-gray-800">
              {STEPS.map((s, i) => (
                <button key={s} onClick={() => setStep(i)}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${step === i ? 'border-violet-600 text-violet-700 dark:text-violet-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <span className={`inline-flex w-6 h-6 rounded-full text-xs items-center justify-center mr-2 ${step >= i ? 'bg-violet-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>{i + 1}</span>
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
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Review & Save</h3>
                  <div className="inline-block text-left bg-gray-50 dark:bg-gray-800/40 rounded-xl p-5 mb-6 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Title:</strong> {form.title}</p>
                    <p><strong>Mode:</strong> {form.mode}</p>
                    <p><strong>Duration:</strong> {form.duration_minutes} minutes</p>
                    <p><strong>Questions:</strong> {questions.length}</p>
                    <p><strong>Shuffle:</strong> {form.shuffle_questions ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button onClick={saveTest} disabled={saving} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60">
                      {saving ? 'Saving...' : 'Save Test'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-4 py-2 border rounded-lg text-sm text-gray-600 dark:text-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Back</button>
                {step < STEPS.length - 1 && (
                  <button onClick={() => setStep(s => s + 1)} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm flex items-center gap-1">
                    Next <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tests List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
          </div>
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
              <ClipboardList size={28} className="text-violet-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No tests yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click &ldquo;New Test&rdquo; to create your first assessment</p>
          </div>
        ) : (
          <>
            {/* List header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{tests.length} test{tests.length !== 1 ? 's' : ''}</p>
              <button onClick={deleteAll}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors font-medium">
                <Trash2 size={12} /> Delete All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tests.map(t => (
                <div key={t.test_id} className={C + " flex flex-col shadow-sm hover:shadow-md transition-shadow"}>
                  {/* Card top color bar */}
                  <div className={`h-1.5 rounded-t-2xl ${
                    t.status === 'live' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                    t.status === 'scheduled' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                    t.status === 'completed' ? 'bg-gradient-to-r from-purple-400 to-violet-500' :
                    'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600'
                  }`} />
                  <div className="flex-1 p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate text-base leading-tight">{t.title}</h3>
                        {t.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">{t.description}</p>}
                      </div>
                      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${statusColors[t.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {t.status}
                      </span>
                    </div>
                    {/* Meta pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">
                        <Clock size={11} /> {t.duration_minutes} min
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2.5 py-1 rounded-full">
                        <FileText size={11} /> {t.total_marks} marks
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                        t.mode === 'practice'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                      }`}>
                        {t.mode === 'practice' ? <BookOpen size={11} /> : <Shield size={11} />}
                        {t.mode === 'practice' ? 'Practice' : 'Proctored'}
                      </span>
                    </div>
                    {/* Start time if set */}
                    {t.start_time && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mb-4">
                        <Calendar size={11} /> Starts {new Date(t.start_time).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {/* Card actions */}
                  <div className="px-5 pb-4 flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                    {t.status === 'draft' ? (
                      <button onClick={() => publishTest(t.test_id)}
                        className="flex-1 text-sm bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-emerald-600 hover:to-green-700 font-semibold transition-all shadow-sm">
                        Publish
                      </button>
                    ) : (
                      <span className="flex-1 text-xs text-gray-400 dark:text-gray-500">
                        {t.status === 'live' ? 'Live now' : t.status === 'scheduled' ? 'Scheduled' : 'Completed'}
                      </span>
                    )}
                    <button onClick={() => deleteTest(t.test_id)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
