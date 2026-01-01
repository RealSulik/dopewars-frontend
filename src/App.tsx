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
    : "";

  return (
    <>
      <div
        className="min-h-screen bg-cover bg-center bg-fixed flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      >


        <div className="w-full max-w-7xl mx-auto">
          {/* Pre-game screen */}
          {!inGame && (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
              <h1 className="text-5xl md:text-7xl font-bold mb-16 neon-flicker">
                DOPEWARS
              </h1>

              {!wallet ? (
                <button
                  onClick={connectWallet}
                  className="neon-button neon-button--buy px-12 py-6 text-3xl font-bold cyber-sweep shadow-2xl"
                >
                  CONNECT WALLET
                </button>
              ) : !sessionActive ? (
                <div className="space-y-6">
                  <p className="text-2xl mb-4">Connected: {wallet.slice(0, 6)}...{wallet.slice(-4)}</p>
                  <button
                    onClick={startSession}
                    disabled={loading}
                    className="neon-button neon-button--buy px-16 py-8 text-4xl font-bold cyber-sweep shadow-2xl"
                  >
                    {currentAction || "START GAME"}
                  </button>
                  <p className="text-sm opacity-70 max-w-md">
                    Starting a session creates a temporary key for gasless gameplay.
                    You'll only need to approve once!
                  </p>
                </div>
              ) : loading ? (
                <p className="text-3xl neon-flicker mt-12">Entering the streets...</p>
              ) : null}

              {errorMessage && (
                <p className="text-red-400 text-xl mt-8 max-w-md">{errorMessage}</p>
              )}
            </div>
          )}

          {/* In-game UI */}
          {inGame && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left + Center: HUD + Inventory + Actions */}
              <div className="lg:col-span-2 space-y-8">
                {/* HUD */}
                <div className="backpanel p-6 cyber-card">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xl">
                    <div>
                      <span className="opacity-70">Cash:</span> ${formatMoney(cash)}
                    </div>
                    <div>
                      <span className="opacity-70">Day:</span> {days}
                    </div>
                    <div>
                      <span className="opacity-70">Location:</span> {locationName}
                    </div>
                    <div>
                      <span className="opacity-70">ICE:</span> {ice.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => setShowLeaderboard(true)}
                      className="neon-button px-6 py-3 text-lg"
                    >
                      Leaderboard
                    </button>
                    <button
                      onClick={claimDailyIce}
                      disabled={loading}
                      className="neon-button px-6 py-3 text-lg"
                    >
                      Claim Daily ICE
                    </button>
                  </div>
                </div>

                {/* Inventory */}
                <div className="backpanel p-8 cyber-card">
                  <h2 className="text-3xl font-bold text-center mb-8 neon-flicker">
                    Inventory
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {inventory.map((drug: any, i: number) => (
                      <div key={i} className="backpanel p-6 cyber-card inventory-card">
                        <div className="text-2xl font-bold text-center">{drug.name}</div>
                        <div className="text-4xl font-bold text-center my-6">
                          {drug.amount.toLocaleString()}
                        </div>
                        <div className="text-center opacity-80 text-lg mb-6">
                          ${formatMoney(drug.price)} each
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            min="1"
                            max={drug.amount || 999}
                            value={quantities[i]}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val > 0) {
                                const newQ = [...quantities];
                                newQ[i] = val;
                                setQuantities(newQ);
                              }
                            }}
                            className="w-28 px-4 py-3 bg-black/60 border border-gray-500 rounded text-white text-lg"
                          />
                          <button
                            onClick={() => buy(i, quantities[i])}
                            disabled={loading || cash < drug.price * quantities[i]}
                            className="neon-button neon-button--buy flex-1 py-3 text-lg"
                          >
                            Buy
                          </button>
                          <button
                            onClick={() => sell(i, quantities[i])}
                            disabled={loading || drug.amount < quantities[i]}
                            className="neon-button neon-button--sell flex-1 py-3 text-lg"
                          >
                            Sell
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-center gap-6 mt-10">
                    <button
                      onClick={endDay}
                      disabled={loading}
                      className="neon-button px-10 py-5 text-2xl font-bold bg-blue-600 cyber-sweep"
                    >
                      End Day
                    </button>
                    <button
                      onClick={hustle}
                      disabled={loading || cash !== 0}
                      className={`neon-button px-10 py-5 text-2xl font-bold bg-purple-700 cyber-sweep ${
                        cash !== 0 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Hustle
                    </button>
                    <button
                      onClick={stash}
                      disabled={loading || cash !== 0}
                      className={`neon-button px-10 py-5 text-2xl font-bold bg-pink-600 cyber-sweep ${
                        cash !== 0 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Stash
                    </button>
                    <button
                      onClick={settleGame}
                      disabled={loading || days < 5}
                      className={`neon-button px-10 py-5 text-2xl font-bold border-2 border-white cyber-sweep ${
                        days < 5 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Settle & Restart
                    </button>
                  </div>
                  {days < 5 && (
                    <p className="text-center mt-4 opacity-60">
                      Settlement available on Day 5+
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Last Event */}
                <div className={`backpanel p-6 cyber-card event-panel ${eventPanelClass}`}>
                  <h2 className="text-2xl font-bold text-center mb-4 neon-flicker">
                    Last Event
                  </h2>
                  <p className={`text-center text-lg ${eventColor}`}>
                    {lastEvent || "No events yet"}
                  </p>
                </div>

                {/* Current Prices */}
                {prices.length > 0 && (
                  <div className="backpanel p-6 cyber-card">
                    <h2 className="text-2xl font-bold text-center mb-6 neon-flicker">
                      Current Drug Prices
                    </h2>
                    <ul className="space-y-3 text-xl">
                      <li>Weed: ${formatMoney(prices[0])}</li>
                      <li>Acid: ${formatMoney(prices[1])}</li>
                      <li>Cocaine: ${formatMoney(prices[2])}</li>
                      <li>Heroin: ${formatMoney(prices[3])}</li>
                    </ul>
                  </div>
                )}

                {/* Travel */}
                <div className="backpanel p-6 cyber-card">
                  <h2 className="text-2xl font-bold text-center mb-4 neon-flicker">
                    Travel
                  </h2>
                  <p className="text-center opacity-80 mb-6">
                    Costs $100 · Does not consume a day
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {CITY_NAMES.map((city, i) => (
                      <button
                        key={i}
                        onClick={() => travelTo(i)}
                        disabled={loading || cash < 100 || locIndex === i}
                        className="neon-button py-4 rounded-full text-lg font-medium cyber-sweep"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
