import { useEffect, useState } from "react";

type LeaderboardRow = {
  wallet_address?: string;
  player_address?: string;
  best_net_worth: number;
  total_ice: number;
  address?: string;
  player?: string;
};

export default function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [tab, setTab] = useState<"ice" | "score">("ice");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load(tab);
  }, [tab]);

  async function load(currentTab: "ice" | "score") {
    try {
      setLoading(true);
      const sortBy = currentTab === "ice" ? "total_ice" : "best_net_worth";
      const res = await fetch(
        `https://dopewars-backend.vercel.app/api/leaderboard?sortBy=${sortBy}&limit=100`
      );
      const data = await res.json();
      if (!data.success) throw new Error("Failed to load leaderboard");
      setRows(data.leaderboard || []);
    } catch (e) {
      console.error("Leaderboard error:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function short(addr?: string) {
    if (!addr) return "—";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="backpanel cyber-card cyber-scanlines cyber-trace p-8 max-w-2xl w-full mx-4 rounded-2xl border-2 border-purple-500/60 neon-glow-lg shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold neon-flicker text-purple-300 text-center flex-1">
            Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-300 text-lg font-bold transition-all hover:scale-110"
          >
            ✕ Close
          </button>
        </div>

                {/* Tabs - Equal Width */}
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setTab("ice")}
            className={`px-6 py-4 rounded-full text-lg font-bold transition-all ${
              tab === "ice"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 neon-button cyber-sweep shadow-lg shadow-purple-500/50"
                : "bg-gray-800/60 border border-gray-600 hover:bg-gray-700/80"
            }`}
          >
            Total ICE
          </button>
          <button
            onClick={() => setTab("score")}
            className={`px-6 py-4 rounded-full text-lg font-bold transition-all ${
              tab === "score"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 neon-button cyber-sweep shadow-lg shadow-purple-500/50"
                : "bg-gray-800/60 border border-gray-600 hover:bg-gray-700/80"
            }`}
          >
            Best Runs
          </button>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-xl">Loading rankings...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xl">No data yet. Be the first!</div>
          ) : (
            rows.slice(0, 20).map((row, idx) => {
              const address =
                row.wallet_address ||
                row.player_address ||
                row.address ||
                row.player ||
                "—";

              return (
                <div
                  key={address + idx}
                  className="bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4 flex justify-between items-center hover:border-purple-400/60 transition-all"
                >
                  <div className="text-lg">
                    <span className="text-purple-300 font-bold">#{idx + 1}</span>{" "}
                    <span className="text-cyan-300">{short(address)}</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-300">
                    {tab === "ice"
                      ? `${row.total_ice.toLocaleString()} ICE`
                      : `$${row.best_net_worth.toLocaleString()}`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}