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

  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640;

  // quantity state
  const [quantities, setQuantities] = useState<number[]>(() => [1, 1, 1, 1]);

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
  const locationName =
    locIndex >= 0 && locIndex < CITY_NAMES.length ? CITY_NAMES[locIndex] : "";

  let backgroundUrl = "/cyberpunk-bg.jpg";
  if (inGame && locIndex >= 0 && locIndex < CITY_FILES.length) {
    backgroundUrl = `/cities/${CITY_FILES[locIndex]}`;
  }

  const lastEvent = playerData?.lastEventDescription ?? "";
  const lowerEvent = lastEvent.toLowerCase();

  const eventColor =
    lowerEvent.includes("lost") || lowerEvent.includes("failed")
      ? "text-red-400"
      : lowerEvent.includes("won") ||
        lowerEvent.includes("gained") ||
        lowerEvent.includes("found") ||
        lowerEvent.includes("stash") ||
        lowerEvent.includes("jackpot")
      ? "text-green-400"
      : "text-gray-200";

  const eventPanelClass =
    lowerEvent.includes("lost") || lowerEvent.includes("failed")
      ? "event-panel--loss"
      : lowerEvent.includes("won") ||
        lowerEvent.includes("gained") ||
        lowerEvent.includes("found") ||
        lowerEvent.includes("stash") ||
        lowerEvent.includes("jackpot")
      ? "event-panel--win"
      : "event-panel--neutral";

  // Mock daily claim for old UI compatibility (not used in session version)
  const canClaim = true;
  const remainingClaim = 0;
  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

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
        <div
          className={`w-full ${
            isMobile ? "max-w-md" : inGame ? "max-w-5xl" : "max-w-3xl"
          } relative`}
        >

          {/* Desktop wallet */}
          {wallet && !isMobile && (
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

          {/* Desktop top-right buttons */}
          {wallet && !isMobile && (
            <div className="absolute top-2 right-0 flex gap-4 text-xs">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="text-blue-300 hover:text-blue-400 underline"
              >
                Leaderboard
              </button>
            </div>
          )}

          {/* MOBILE: leaderboard only */}
          {wallet && isMobile && (
            <div className="absolute top-2 right-2 z-50">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-3 py-1 rounded-full text-xs font-semibold neon-button cyber-sweep"
              >
                Leaderboard
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2 mb-4 bg-red-600 text-center font-semibold rounded animate-fadeIn cyber-card">
              ⚠ {errorMessage}
            </div>
          )}

          {/* START SCREEN - Not connected */}
          {!wallet && (
            <div className="flex flex-col items-center justify-center pt-6 pb-4 animate-fadeIn">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 neon-flicker">
                DopeWars on Base
              </h2>
              <p className="text-lg opacity-90 mb-10">
                Trade. Hustle. Survive. Collect ICE.
              </p>

              <button
                onClick={connectWallet}
                disabled={loading}
                className="mt-6 px-8 py-3 rounded-lg font-semibold neon-button cyber-sweep text-lg"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
            </div>
          )}

          {/* SESSION START SCREEN - Connected but no session */}
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

          {/* GAME HEADER */}
          {wallet && inGame && (
            <h1 className="mt-10 sm:mt-4 text-center mb-6 text-2xl sm:text-3xl md:text-4xl font-bold neon-flicker neon-text-glow">
              DopeWars on Base
            </h1>
          )}

          {/* HUD AREA */}
          {wallet && inGame && (
            <>
              {isMobile ? (
                // MOBILE HUD
                <div className="px-2 mb-3">
                  <div className="backpanel cyber-card cyber-scanlines cyber-trace px-3 py-3 flex flex-col items-center gap-2 text-center">
                    <p className="text-sm font-semibold opacity-90">
                      {locationName} · Day {days} · Cash ${formatMoney(cash)}
                    </p>

                    <div className="flex items-center justify-center gap-2 text-xs">
                      <span className="font-semibold">ICE: {ice}</span>

                      <button
                        onClick={claimDailyIce}
                        disabled={loading}
                        className="px-3 py-1 rounded-full text-xs font-semibold neon-button cyber-sweep"
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // DESKTOP HUD
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3 px-2">
                  <div className="flex-1 p-3">
                    <div className="backpanel cyber-card cyber-scanlines cyber-trace text-center px-2 py-2 h-[64px] flex items-center justify-center">
                      <p className="text-sm font-semibold opacity-90">
                        {locationName} · Day {days} · Cash ${formatMoney(cash)}
                      </p>
                    </div>
                  </div>

                  {/* ICE Panel */}
                  <div className="w-80 p-3">
                    <div className="backpanel cyber-card cyber-scanlines cyber-trace text-center px-2 py-2 h-[64px] flex items-center justify-center">
                      <div className="flex flex-col leading-tight">
                        <p className="text-sm font-semibold opacity-90 mb-0.5">
                          ICE: {ice}
                        </p>

                        <button
                          onClick={claimDailyIce}
                          disabled={loading}
                          className="px-3 py-0.5 rounded text-xs font-semibold neon-button cyber-sweep"
                        >
                          Claim
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* LEFT column */}
                <div className="flex flex-col w-full md:flex-1 backpanel cyber-card cyber-scanlines cyber-trace pt-3 pb-3">
                  {/* MOBILE prices carousel */}
                  {isMobile && prices.length > 0 && (
                    <div className="px-2 mb-3">
                      <h2 className="text-lg font-bold mb-2 text-center neon-flicker">
                        Current Drug Prices
                      </h2>

                      <div className="overflow-hidden relative py-0.5">
                        <div className="flex gap-6 animate-price-marquee whitespace-nowrap">
                          {[...Array(2)].flatMap(() =>
                            [
                              ["Weed", prices[0]],
                              ["Acid", prices[1]],
                              ["Cocaine", prices[2]],
                              ["Heroin", prices[3]],
                            ].map(([name, value], i) => (
                              <div
                                key={`${name}-${i}-${Math.random()}`}
                                className="px-2 py-1 rounded-md text-center price-chip text-sm"
                              >
                                {name}: ${formatMoney(value as number)}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <h2 className="text-lg font-bold mb-3 text-center neon-flicker">
                    Inventory &amp; Trading
                  </h2>

                  {safeInventory.length > 0 ? (
                    <div
                      className={`overflow-x-auto flex gap-3 px-1 ${
                        isMobile
                          ? "snap-x snap-mandatory inventory-grid"
                          : "grid grid-cols-2 sm:grid-cols-2"
                      }`}
                    >
                      {safeInventory.map((d, i) => {
                        // safe qty
                        const qty: number = Number(quantities[i] ?? 1);
                        const canSell = d.amount > 0;

                        function updateQtyRaw(v: string) {
                          const num = Number(v);
                          const next: number[] = [...quantities];
                          next[i] = num > 0 ? num : 1;
                          setQuantities(next);
                        }

                        function normalizeQty() {
                          const current = Number(quantities[i]);
                          const safe = current > 0 ? current : 1;
                          const next: number[] = [...quantities];
                          next[i] = safe;
                          setQuantities(next);
                        }

                        return (
                          <div
                            key={i}
                            className={`p-1 ${
                              isMobile
                                ? "snap-center shrink-0 w-[65vw]"
                                : "w-full"
                            }`}
                          >
                            <div
                              className={`backpanel cyber-card cyber-scanlines cyber-trace inventory-card flex flex-col w-full ${
                                isMobile ? "h-auto" : "h-[198px]"
                              }`}
                            >

                              {/* ITEM NAME */}
                              <div className="font-semibold text-lg mb-1">
                                {d.name}
                              </div>

                              {/* PRICE / TOTAL BLOCK */}
                              {(() => {
                                const price = Number(d.price ?? 0);
                                const rawQty = quantities[i];
                                const qtySafe =
                                  Number.isFinite(Number(rawQty)) &&
                                  Number(rawQty) > 0
                                    ? Number(rawQty)
                                    : 1;

                                const totalCost = price * qtySafe;

                                return (
                                  <>
                                    {/* ROW 1: Amount left / Total label right */}
                                    <div className="grid grid-cols-2 text-sm gap-y-1 mb-2">
                                      <span className="opacity-80">Amount: {d.amount} units</span>
                                      <span className="opacity-80 text-right">Total</span>

                                      <span className="opacity-90">Price: ${formatMoney(price)}</span>
                                      <span className="opacity-90 text-right">${formatMoney(totalCost)}</span>
                                    </div>
                                  </>
                                );
                              })()}

                              {/* QTY INPUT */}
                              <input
                                type="number"
                                min={1}
                                value={qty}
                                onChange={(e) =>
                                  updateQtyRaw(e.target.value)
                                }
                                onBlur={normalizeQty}
                                className="trade-qty"
                                placeholder="Qty"
                              />

                              {/* BUY / SELL BUTTONS */}
                              <div className="mt-auto flex gap-2">
                                <button
                                  onClick={() => buy(i, qty)}
                                  disabled={loading}
                                  className="flex-1 px-3 py-1 rounded-full text-sm font-semibold neon-button cyber-sweep neon-button--buy"
                                >
                                  Buy
                                </button>

                                <button
                                  onClick={() => sell(i, qty)}
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
                    <p className="text-center opacity-60 text-sm">
                      No inventory yet.
                    </p>
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
                <div className="flex flex-col gap-2 w-full md:w-80">

                  {/* LAST EVENT PANEL */}
                  <div
                    className={`p-4 backpanel cyber-card cyber-scanlines cyber-trace event-panel ${eventPanelClass}`}
                  >
                    <h2 className="text-lg font-bold mb-1 text-center neon-flicker">
                      Last Event
                    </h2>
                    <div className={`text-center opacity-90 ${eventColor}`}>
                      {lastEvent || "No events yet"}
                    </div>
                  </div>

                  {/* DESKTOP PRICES PANEL */}
                  {!isMobile && prices.length > 0 && (
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

                  {/* TRAVEL PANEL */}
                  <div className="p-4 backpanel cyber-card cyber-scanlines cyber-trace">
                    <h2 className="text-lg font-bold mb-2 text-center neon-flicker">
                      Travel
                    </h2>

                    <div className="text-xs opacity-80 mb-2 text-center">
                      Costs $100 · Does not consume a day
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-2">
                      {CITY_NAMES.map((city, i) => (
                        <button
                          key={i}
                          disabled={loading || cash < 100 || locIndex === i}
                          onClick={() => travelTo(i)}
                          className={`rounded-full neon-button cyber-sweep py-2 text-sm text-center ${
                            isMobile ? "w-full" : "px-4"
                          }`}
                          style={isMobile ? { minWidth: "120px" } : {}}
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

      {/* POPUP EVENT */}
      <EventPopup
        visible={showPopup}
        image={popupImage}
        text={popupText}
        onClose={() => setShowPopup(false)}
      />

      {/* LEADERBOARD */}
      {showLeaderboard && (
        <LeaderboardModal onClose={() => setShowLeaderboard(false)} />
      )}
    </>
  );
}
