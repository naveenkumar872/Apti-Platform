import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, Circle, Zap, Calendar } from 'lucide-react';

export default function StudyPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPlan = () => {
    setLoading(true);
    api.get('/student/plan')
      .then(r => setPlan(r.data.plan))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlan(); }, []);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/student/plan/generate');
      setPlan(res.data.plan);
      toast.success('Study plan generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      await api.post(`/student/plan/tasks/${taskId}/complete`);
      setPlan(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.task_id === taskId ? { ...t, is_completed: true } : t),
      }));
      toast.success('Task completed!');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="p-6 animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl" />)}</div>;

  if (!plan) return (
    <div className="p-6 max-w-lg mx-auto text-center">
      <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
        <Calendar size={48} className="text-purple-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Study Plan</h2>
        <p className="text-gray-500 text-sm mb-6">Generate a personalized plan based on your weak areas and target companies</p>
        <button
          onClick={generatePlan}
          disabled={generating}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2 mx-auto"
        >
          <Zap size={18} />
          {generating ? 'Generating...' : 'Generate My Plan'}
        </button>
      </div>
    </div>
  );

  const tasksByWeekDay = {};
  (plan.tasks || []).forEach(t => {
    const key = `Week ${t.week_number}`;
    if (!tasksByWeekDay[key]) tasksByWeekDay[key] = {};
    const dayKey = `Day ${t.day_number}`;
    if (!tasksByWeekDay[key][dayKey]) tasksByWeekDay[key][dayKey] = [];
    tasksByWeekDay[key][dayKey].push(t);
  });

  const completedCount = (plan.tasks || []).filter(t => t.is_completed).length;
  const totalCount = (plan.tasks || []).length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Study Plan</h1>
        <button
          onClick={generatePlan}
          disabled={generating}
          className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60"
        >
          {generating ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="font-bold text-purple-600">{percent}% ({completedCount}/{totalCount} tasks)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-purple-600 rounded-full h-2.5 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Weekly Plan */}
      {Object.entries(tasksByWeekDay).map(([week, days]) => (
        <div key={week} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{week}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(days).map(([day, tasks]) => (
              <div key={day} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-3">{day}</h3>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.task_id} className="flex items-start gap-3">
                      <button
                        onClick={() => !task.is_completed && completeTask(task.task_id)}
                        disabled={task.is_completed}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.is_completed
                          ? <CheckCircle size={18} className="text-green-500" />
                          : <Circle size={18} className="text-gray-300 hover:text-purple-500 transition-colors" />
                        }
                      </button>
                      <div className={task.is_completed ? 'opacity-60 line-through' : ''}>
                        <p className="text-sm text-gray-800">{task.description || task.topic_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400 capitalize">{task.task_type}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-400">{task.estimated_minutes} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
