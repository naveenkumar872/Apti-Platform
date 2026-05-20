import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, BookOpen, ClipboardList, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 animate-pulse">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl mb-4" />)}
    </div>
  );

  const stats = data?.stats || {};
  const weakAreas = data?.weak_areas || [];
  const recentAttempts = data?.recent_attempts || [];
  const upcomingTests = data?.upcoming_tests || [];
  const planProgress = data?.plan_progress;

  const radarData = weakAreas.slice(0, 6).map(w => ({
    subject: w.topic_name?.split(' ').slice(0, 2).join(' '),
    score: Math.round(w.accuracy_percent || 0),
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your placement preparation overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tests Taken', value: stats.total_tests ?? 0, icon: ClipboardList, color: 'blue' },
          { label: 'Avg Score', value: `${Math.round(stats.avg_score ?? 0)}%`, icon: BarChart2, color: 'green' },
          { label: 'Practice Sessions', value: stats.practice_sessions ?? 0, icon: BookOpen, color: 'purple' },
          { label: 'Streak', value: `${stats.streak ?? 0} days`, icon: Calendar, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-lg bg-${color}-50 flex items-center justify-center mb-3`}>
              <Icon size={20} className={`text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weak Areas Radar */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingDown size={18} className="text-red-500" />
            Weak Areas
          </h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No data yet. Start practicing!</p>
          )}
        </div>

        {/* Upcoming Tests */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-blue-500" />
            Upcoming Tests
          </h2>
          {upcomingTests.length > 0 ? (
            <div className="space-y-3">
              {upcomingTests.slice(0, 4).map(t => (
                <div key={t.test_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.duration_minutes} min · {t.total_marks} marks</p>
                  </div>
                  <Link
                    to="/student/tests"
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
                  >
                    Start
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No upcoming tests</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attempts */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            Recent Performance
          </h2>
          {recentAttempts.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={recentAttempts.slice(0, 7).reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" tick={false} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                <Bar dataKey="accuracy_percent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">No attempts yet</p>
          )}
        </div>

        {/* Study Plan Progress */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-purple-500" />
            Study Plan
          </h2>
          {planProgress ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-medium">{planProgress.percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 rounded-full h-2 transition-all"
                    style={{ width: `${planProgress.percent}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {planProgress.completed} of {planProgress.total} tasks completed
              </p>
              <Link to="/student/plan" className="text-blue-600 text-sm hover:underline mt-3 block">
                View full plan →
              </Link>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-3">No active study plan</p>
              <Link
                to="/student/plan"
                className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Generate Plan
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
