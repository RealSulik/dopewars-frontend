import { useEffect, useState } from "react";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../config";
import { ethers } from "ethers";

export default function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [tab, setTab] = useState<"ice" | "score">("ice");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // For now, just show placeholder data since we don't have blockchain data yet
      // In the session-based system, data only goes to blockchain on settlement
      
      // You can implement this later to read from your backend API instead:
      // const response = await fetch('https://dopewars-backend.vercel.app/api/leaderboard');
      // const data = await response.json();
      
      setRows([]);
      setLoading(false);
    } catch (e) {
      console.error('Leaderboard error:', e);
      setLoading(false);
    }
  }

  function short(a: string) {
    return a.slice(0, 6) + "..." + a.slice(-4);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-start justify-center pt-24 z-[9999]">
      <div className="bg-black text-white rounded-xl p-6 w-[600px] border border-gray-600">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <button onClick={onClose} className="text-red-400">
            Close
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab("ice")}
            className={`px-3 py-1 rounded ${tab === "ice" ? "bg-purple-600" : "bg-gray-700"}`}
          >
            Total ICE
          </button>
          <button
            onClick={() => setTab("score")}
            className={`px-3 py-1 rounded ${tab === "score" ? "bg-purple-600" : "bg-gray-700"}`}
          >
            Best Runs
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No leaderboard data yet. Complete a game run and settle to appear on the leaderboard!
            </div>
          ) : (
            rows
              .sort((a, b) => (tab === "ice" ? b.ice - a.ice : b.best - a.best))
              .slice(0, 20)
              .map((row, idx) => (
                <div key={row.addr} className="flex justify-between bg-gray-800 p-2 rounded">
                  <div>
                    #{idx + 1} {short(row.addr)}
                  </div>
                  <div>
                    {tab === "ice" ? `${row.ice.toLocaleString()} ICE` : `$${row.best.toLocaleString()}`}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}