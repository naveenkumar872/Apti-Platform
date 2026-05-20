import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import useAuthStore from '../../stores/authStore';
import { Trophy, Medal } from 'lucide-react';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/student/leaderboard')
      .then(r => setData(r.data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
  const rankBg = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200'];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Trophy size={24} className="text-yellow-500" /> Leaderboard
      </h1>

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No leaderboard data yet</p>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => {
            const isMe = entry.user_id === user?.user_id;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 rounded-xl border ${isMe ? 'border-blue-400 bg-blue-50' : i < 3 ? rankBg[i] : 'bg-white border-gray-100'}`}
              >
                <div className="w-8 text-center">
                  {i < 3 ? (
                    <Medal size={20} className={medalColors[i]} />
                  ) : (
                    <span className="text-sm font-bold text-gray-500">#{i + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{entry.name}{isMe && ' (You)'}</p>
                  <p className="text-xs text-gray-500">{entry.college || 'Unknown College'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{Math.round(entry.avg_score)}%</p>
                  <p className="text-xs text-gray-500">{entry.tests_taken} tests</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
