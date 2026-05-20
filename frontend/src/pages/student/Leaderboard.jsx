import { useEffect, useState } from "react";
import api from "../../services/api";
import useAuthStore from "../../stores/authStore";
import { Trophy, Medal, Star } from "lucide-react";

const C = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800";

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/leaderboard").then(r => setData(r.data.leaderboard || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const top3Grads = ["from-yellow-400 to-amber-500", "from-gray-300 to-gray-400", "from-orange-400 to-amber-600"];
  const top3Icons = ["text-yellow-500", "text-gray-400", "text-amber-600"];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
          <Trophy size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Leaderboard</h1>
          <p className="text-xs text-gray-400">Top performers this week</p>
        </div>
      </div>

      {/* Top 3 podium */}
      {!loading && data.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6">
          {[data[1], data[0], data[2]].map((entry, pos) => {
            const realPos = pos === 0 ? 1 : pos === 1 ? 0 : 2;
            const heights = ["h-24", "h-32", "h-20"];
            const isMe = entry?.user_id === user?.user_id;
            return (
              <div key={entry.user_id} className="flex flex-col items-center">
                <div className={"w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center mb-2 shadow-md " + top3Grads[realPos]}>
                  <span className="text-white font-bold text-sm">{((entry.name || "?")[0]).toUpperCase()}</span>
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1 truncate max-w-20 text-center">{entry.name?.split(" ")[0]}{isMe ? " (You)" : ""}</p>
                <div className={"w-20 rounded-t-xl flex flex-col items-center justify-end pb-2 bg-gradient-to-t " + top3Grads[realPos] + " " + heights[realPos]}>
                  <Medal size={18} className={top3Icons[realPos]} />
                  <span className="text-white text-xs font-bold mt-1">#{realPos + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl" />)}</div>
      ) : data.length === 0 ? (
        <div className={"rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-14 text-center " + C}>
          <Star size={32} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No leaderboard data yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => {
            const isMe = entry.user_id === user?.user_id;
            return (
              <div key={entry.user_id}
                className={"flex items-center gap-4 p-4 rounded-xl border transition-all " + C + (isMe ? " border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" : "")}>
                <div className="w-8 text-center flex-shrink-0">
                  {i < 3
                    ? <Medal size={18} className={top3Icons[i]} />
                    : <span className="text-sm font-bold text-gray-400">#{i + 1}</span>}
                </div>
                <div className={"w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm bg-gradient-to-br " + (i < 3 ? top3Grads[i] : "from-gray-400 to-gray-500")}>
                  {((entry.name || "?")[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{entry.name}{isMe && " (You)"}</p>
                  <p className="text-xs text-gray-400">{entry.college || "Unknown College"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{Math.round(entry.avg_score)}%</p>
                  <p className="text-xs text-gray-400">{entry.tests_taken} tests</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
