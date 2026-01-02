// src/App.tsx
import "./App.css";
import { useGame } from "./hooks/useGame";
import { useEffect, useState } from "react";
import EventPopup from "./EventPopup";
import LeaderboardModal from "./components/LeaderboardModal";

function formatMoney(v: number) {
  return Math.round(v).toLocaleString();
}

const CITY_NAMES = [
  "Staten Island",
  "Bronx",
  "Queens",
  "Brooklyn",
  "Central Park",
  "Coney Island",
  "Manhattan",
];

const CITY_FILES = [
  "Staten-Island.png",
  "Bronx.png",
  "Queens.png",
  "Brooklyn.png",
  "Central-Park.png",
  "Coney-Island.png",
  "Manhattan.png",
];

export default function App() {
  const {
    wallet,
    sessionActive,
    playerData,
    inventory,
    prices,
    ice,
    loading,
    errorMessage,
    currentAction,

    connectWallet,
    startSession,
    endDay,
    hustle,
    stash,
    settleGame,
    claimDailyIce,
    travelTo,
    buy,
    sell,
  } = useGame();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupImage, setPopupImage] = useState("");
  const [popupText, setPopupText] = useState("");
  const [quantities, setQuantities] = useState<number[]>([1, 1, 1, 1]);

  // Event popup logic
  useEffect(() => {
    const event = playerData?.lastEventDescription;
    if (!event) return;

    const seenKey = "lastEventSeen";
    const lastSeen = localStorage.getItem(seenKey);
    if (lastSeen === event) return;

    localStorage.setItem(seenKey, event);

    const ev = event.toLowerCase();
    let img = "";
    if (ev.includes("mugged") || ev.includes("robbed")) img = "/events/mugged.png";
    else if (ev.includes("police") || ev.includes("busted")) img = "/events/police.png";
    else if (ev.includes("stash") || ev.includes("found")) img = "/events/stash.png";
    else if (ev.includes("ice")) img = "/events/ice.png";

    if (!img) return;

    setPopupImage(img);
    setPopupText(event);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 5000);
  }, [playerData?.lastEventDescription]);

  const inGame = wallet && sessionActive && playerData && playerData.netWorthGoal > 0;
  const days = playerData?.daysPlayed ?? 0;
  const cash = playerData?.cash ?? 0;
  const locIndex = playerData?.location ?? -1;
  const locationName = locIndex >= 0 && locIndex < CITY_NAMES.length ? CITY_NAMES[locIndex] : "";

  let backgroundUrl = "/cyberpunk-bg.jpg";
  if (inGame && locIndex >= 0 && locIndex < CITY_FILES.length) {
    backgroundUrl = `/cities/${CITY_FILES[locIndex]}`;
  }

  const lastEvent = playerData?.lastEventDescription ?? "";
  const lowerEvent = lastEvent.toLowerCase();
  const eventColor = lowerEvent.includes("lost") || lowerEvent.includes("failed")
    ? "text-red-400"
    : lowerEvent.includes("won") || lowerEvent.includes("gained") || lowerEvent.includes("found") || lowerEvent.includes("stash") || lowerEvent.includes("jackpot")
    ? "text-green-400"
    : "text-gray-200";

  const eventPanelClass = lowerEvent.includes("lost") || lowerEvent.includes("failed")
    ? "event-panel--loss"
    : lowerEvent.includes("won") || lowerEvent.includes("gained") || lowerEvent.includes("found") || lowerEvent.includes("stash") || lowerEvent.includes("jackpot")
    ? "event-panel--win"
    : "event-panel--neutral";

  const safeInventory = inventory ?? [];

  return (
    <>
      {loading && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-700 rounded-full text-sm shadow-lg z-50"
          style={{ opacity: 0.85 }}
        >
          {currentAction || "Confirming…"}
        </div>
      )}

      <div
        className="min-h-screen text-white flex justify-center py-0.5 px-3 crt cyber-scanlines"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.9)), url("${backgroundUrl}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className={`${inGame ? "w-full max-w-5xl" : "w-full max-w-3xl"} relative`}>

          {wallet && (
            <div className="absolute top-2 left-0 inline-flex px-3 py-1 rounded-lg backpanel cyber-card cyber-trace cyber-scanlines items-center gap-3 text-sm shadow-lg w-auto">
              <span className="text-green-400">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
              <button
                onClick={() => navigator.clipboard.writeText(wallet)}
                className="underline text-gray-300 hover:text-white"
              >
                Copy
              </button>
            </div>
          )}

          {wallet && (
            <div className="absolute top-2 right-0 flex gap-4 text-xs">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="text-blue-300 hover:text-blue-400 underline"
              >
                Leaderboard
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="p-2 mb-4 bg-red-600 text-center font-semibold rounded animate-fadeIn cyber-card">
              ⚠ {errorMessage}
            </div>
          )}

          {!wallet && (
            <div className="flex flex-col items-center justify-center pt-6 pb-4 animate-fadeIn">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 neon-flicker">DopeWars on Base</h2>
              <p className="text-lg opacity-90 mb-10">Trade. Hustle. Survive. Collect ICE.</p>

              <button
                onClick={connectWallet}
                disabled={loading}
                className="px-10 py-5 rounded-full neon-button neon-button--buy text-2xl font-bold cyber-sweep shadow-2xl"
              >
                {currentAction || "Connect Wallet"}
              </button>
            </div>
          )}

          {wallet && !sessionActive && (
            <div className="flex flex-col items-center justify-center pt-20 animate-fadeIn">
              <h2 className="text-3xl font-bold mb-4 neon-flicker">Session Required</h2>
              <p className="text-lg opacity-90 mb-8 max-w-md text-center">
                Start a session to play. You'll approve once, then enjoy gasless gameplay!
              </p>
              <button
                onClick={startSession}
                disabled={loading}
                className="px-12 py-6 rounded-full neon-button neon-button--buy text-3xl font-bold cyber-sweep shadow-2xl"
              >
                {currentAction || "START SESSION"}
              </button>
            </div>
          )}

          {inGame && (
            <>
              <div className="pt-14 pb-4">
                <div className="backpanel cyber-card cyber-scanlines cyber-trace hud-animate hud-pulse">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-base">
                    <div>
                      <span className="opacity-70 text-sm">Cash:</span>{" "}
                      <span className="font-semibold">${formatMoney(cash)}</span>
                    </div>
                    <div>
                      <span className="opacity-70 text-sm">Day:</span>{" "}
                      <span className="font-semibold">{days}</span>
                    </div>
                    <div>
                      <span className="opacity-70 text-sm">Location:</span>{" "}
                      <span className="font-semibold">{locationName}</span>
                    </div>
                    <div>
                      <span className="opacity-70 text-sm">ICE:</span>{" "}
                      <span className="font-semibold text-purple-300 ice-flash">
                        {ice.toLocaleString()}
                      </span>

                      <button
                        onClick={claimDailyIce}
                        disabled={loading}
                        className="ml-2 px-3 py-0.5 rounded text-xs font-semibold neon-button cyber-sweep"
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                {/* LEFT column */}
                <div className="flex-1 flex flex-col backpanel cyber-card cyber-scanlines cyber-trace pt-3 pb-3">
                  <h2 className="text-lg font-bold mb-3 text-center neon-flicker">
                    Inventory &amp; Trading
                  </h2>

                  {safeInventory.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {safeInventory.map((d, i) => {
                        const qty = quantities[i] ?? 1;
                        const canSell = d.amount > 0;

                        function updateQtyRaw(v: string) {
                          const val = v === "" ? "" : Number(v);
                          const n = [...quantities];
                          n[i] = val as any;
                          setQuantities(n);
                        }

                        function normalizeQty() {
                          const current = quantities[i];
                          const safe = !current || current < 1 ? 1 : current;
                          const n = [...quantities];
                          n[i] = safe;
                          setQuantities(n);
                        }

                        return (
                          <div key={i} className="p-1">
                            <div className="backpanel cyber-card cyber-scanlines cyber-trace h-[200px] flex flex-col">
                              <div className="font-semibold text-lg mb-2">{d.name}</div>
                              <div className="text-sm opacity-80 mb-1">
                                Amount: {d.amount} units
                              </div>
                              <div className="text-sm opacity-90 mb-2">
                                Price: ${formatMoney(d.price)}
                              </div>

                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) => updateQtyRaw(e.target.value)}
                                onBlur={normalizeQty}
                                className="trade-qty"
                                placeholder="Qty"
                              />

                              <div className="mt-auto flex gap-2">
                                <button
                                  onClick={() => buy(i, Number(qty))}
                                  disabled={loading}
                                  className="flex-1 px-3 py-1 rounded-full text-sm font-semibold neon-button cyber-sweep neon-button--buy"
                                >
                                  Buy
                                </button>

                                <button
                                  onClick={() => sell(i, Number(qty))}
                                  disabled={!canSell || loading}
                                  className={`flex-1 px-3 py-1 rounded-full text-sm font-semibold neon-button cyber-sweep ${
                                    canSell
                                      ? "neon-button--sell"
                                      : "neon-button--disabled cursor-not-allowed"
                                  }`}
                                >
                                  Sell
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center opacity-60 text-sm">No inventory yet.</p>
                  )}

                  {/* CONTROLS */}
                  <div className="flex flex-wrap gap-3 justify-center mt-3 mb-2">
                    <button
                      onClick={endDay}
                      disabled={loading}
                      className="px-5 py-2 rounded font-semibold neon-button cyber-sweep bg-blue-600"
                    >
                      End Day
                    </button>

                    <button
                      onClick={hustle}
                      disabled={loading || cash !== 0}
                      title={cash !== 0 ? "Cash must be 0 to Hustle" : ""}
                      className={`px-5 py-2 rounded font-semibold neon-button cyber-sweep ${
                        cash === 0
                          ? "bg-purple-700"
                          : "bg-gray-700 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      Hustle
                    </button>

                    <button
                      onClick={stash}
                      disabled={loading || cash !== 0}
                      title={cash !== 0 ? "Cash must be 0 to Stash" : ""}
                      className={`px-5 py-2 rounded font-semibold neon-button cyber-sweep ${
                        cash === 0
                          ? "bg-pink-600"
                          : "bg-gray-700 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      Stash
                    </button>

                    <button
                      onClick={settleGame}
                      disabled={loading || days < 5}
                      className={`px-5 py-2 rounded font-semibold neon-button cyber-sweep ${
                        days >= 5
                          ? "bg-gray-800 border border-white"
                          : "bg-gray-700 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      Settle & Restart
                    </button>
                  </div>

                  {days < 5 && (
                    <p className="text-center opacity-60 text-xs mb-2 neon-flicker">
                      Settlement available on Day 5+
                    </p>
                  )}
                </div>

                {/* RIGHT column */}
                <div className="flex flex-col gap-2 w-80">
                  <div className={`p-4 backpanel cyber-card cyber-scanlines cyber-trace event-panel ${eventPanelClass}`}>
                    <h2 className="text-lg font-bold mb-1 text-center neon-flicker">
                      Last Event
                    </h2>
                    <div className={`text-center opacity-90 ${eventColor}`}>{lastEvent || "No events yet"}</div>
                  </div>

                  {prices.length > 0 && (
                    <div className="p-4 backpanel cyber-card cyber-scanlines cyber-trace">
                      <h2 className="text-lg font-bold mb-2 text-center neon-flicker">
                        Current Drug Prices
                      </h2>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Weed: ${formatMoney(prices[0])}</li>
                        <li>Acid: ${formatMoney(prices[1])}</li>
                        <li>Cocaine: ${formatMoney(prices[2])}</li>
                        <li>Heroin: ${formatMoney(prices[3])}</li>
                      </ul>
                    </div>
                  )}

                  <div className="p-4 backpanel cyber-card cyber-scanlines cyber-trace">
                    <h2 className="text-lg font-bold mb-2 text-center neon-flicker">Travel</h2>

                    <div className="text-xs opacity-80 mb-2 text-center">
                      Costs $100 · Does not consume a day
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {CITY_NAMES.map((city, i) => (
                        <button
                          key={i}
                          disabled={loading || cash < 100 || locIndex === i}
                          onClick={() => travelTo(i)}
                          className="neon-button cyber-sweep py-1"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <EventPopup
        visible={showPopup}
        image={popupImage}
        text={popupText}
        onClose={() => setShowPopup(false)}
      />

      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </>
  );
}
