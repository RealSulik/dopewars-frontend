import { useEffect, useState } from "react";

type LeaderboardRow = {
  wallet_address?: string;   // <- this is the real field
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

      // Debug: check field names
      if (data.leaderboard && data.leaderboard.length > 0) {
        console.log("Leaderboard first row:", data.leaderboard[0]);
      }

      setRows(data.leaderboard || []);
    } catch (e) {
      console.error("Leaderboard error:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // Shorten wallet addresses safely
  function short(addr?: string) {
    if (!addr) return "—";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
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
            <div className="text-center py-8 text-gray-400">No leaderboard data yet.</div>
          ) : (
            rows.slice(0, 20).map((row, idx) => {
              // Pick the real wallet address first
              const address =
                row.wallet_address ||
                row.player_address ||
                row.address ||
                row.player ||
                "—";

              return (
                <div key={address + idx} className="flex justify-between bg-gray-800 p-2 rounded">
                  <div>
                    #{idx + 1} {short(address)}
                  </div>
                  <div>
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
