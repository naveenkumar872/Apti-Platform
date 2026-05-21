import { useEffect, useState } from "react";
import api from "../../services/api";
import { CalendarDays, Sparkles, CheckCircle2, Circle, RefreshCw } from "lucide-react";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";

export default function StudyPlan() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/student/plan").then(r => setPlan(r.data.plan || null)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try { const r = await api.post("/student/plan/generate"); setPlan(r.data.plan || null); }
    catch {}
    setGenerating(false);
  };

  const complete = async (taskId) => {
    try {
      await api.post(`/student/plan/tasks/${taskId}/complete`);
      setPlan(p => ({
        ...p,
        tasks: p.tasks.map(t => t.task_id === taskId ? { ...t, is_completed: true } : t)
      }));
    } catch {}
  };

  const tasks = plan?.tasks || [];
  const done = tasks.filter(t => t.is_completed).length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="w-full min-h-full flex flex-col">
      <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 px-6 pt-8 pb-7 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays size={15} className="text-white/70" />
              <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Study Plan</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">Your Learning Path</h1>
            <p className="text-white/70 text-sm mt-1.5">AI-generated personal study plan</p>
          </div>
          <button onClick={generate} disabled={generating}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0 disabled:opacity-60">
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {plan ? "Regenerate" : "Generate Plan"}
          </button>
        </div>
      </div>
      <div className="flex-1 p-5 md:p-8">

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}</div>
      ) : !plan ? (
        <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-14 text-center " + C}>
          <Sparkles size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No plan yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Generate Plan" to get your personalized study plan</p>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className={"rounded-2xl border p-5 mb-5 " + C}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Overall Progress</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">{done} of {tasks.length} tasks completed</p>
          </div>

          {/* Goal */}
          {plan.goal && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Goal: {plan.goal}</p>
            </div>
          )}

          {/* Tasks */}
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.task_id} className={"flex items-center gap-4 p-4 rounded-2xl border transition-all " + C + (task.is_completed ? " opacity-60" : "")}>
                <button onClick={() => !task.is_completed && complete(task.task_id)} className="flex-shrink-0">
                  {task.is_completed
                    ? <CheckCircle2 size={22} className="text-emerald-500" />
                    : <Circle size={22} className="text-gray-300 dark:text-gray-600 hover:text-emerald-500 transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={"text-sm font-medium " + (task.is_completed ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-100")}>{task.description}</p>
                  {(task.week_number || task.day_number) && <p className="text-xs text-gray-400 mt-0.5">Week {task.week_number} · Day {task.day_number} · ~{task.estimated_minutes}min</p>}
                </div>
                {task.priority === "high" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">High</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
