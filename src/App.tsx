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
    
    // NEW ACTIONS
    depositBank,
    withdrawBank,
    payLoan,
    upgradeCoat,
    buyGun,
    fightCop,
    runFromCop,
  } = useGame();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupImage, setPopupImage] = useState("");
  const [popupText, setPopupText] = useState("");

  // NEW: Bank/Loan modals
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAmount, setBankAmount] = useState("");
  
  // NEW: Cop encounter modal
  const [showCopModal, setShowCopModal] = useState(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  // quantity state
  const [quantities, setQuantities] = useState<number[]>(() => [1, 1, 1, 1]);

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
    else if (ev.includes("police") || ev.includes("busted") || ev.includes("officer hardass")) {
      img = "/events/police.png";
      setShowCopModal(true); // Show cop encounter modal
    }
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
  const debt = playerData?.debt ?? 0;
  const bankBalance = playerData?.bankBalance ?? 0;
  const health = playerData?.health ?? 100;
  const hasGun = playerData?.hasGun ?? false;
  const capacity = playerData?.trenchcoatCapacity ?? 100;
  const currentNetWorth = playerData?.currentNetWorth ?? 0;

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
    lowerEvent.includes("lost") || lowerEvent.includes("failed") || lowerEvent.includes("died")
      ? "text-red-400"
      : lowerEvent.includes("won") ||
        lowerEvent.includes("gained") ||
        lowerEvent.includes("found") ||
        lowerEvent.includes("stash") ||
        lowerEvent.includes("jackpot")
      ? "text-green-400"
      : "text-gray-200";

  const eventPanelClass =
    lowerEvent.includes("lost") || lowerEvent.includes("failed") || lowerEvent.includes("died")
      ? "event-panel--loss"
      : lowerEvent.includes("won") ||
        lowerEvent.includes("gained") ||
        lowerEvent.includes("found") ||
        lowerEvent.includes("stash") ||
        lowerEvent.includes("jackpot")
      ? "event-panel--win"
      : "event-panel--neutral";

  const safeInventory = inventory ?? [];
  
  // Calculate total drugs for capacity
  const totalDrugs = safeInventory.reduce((sum, drug) => sum + (drug.amount || 0), 0);

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
        }}
      >
        <div className="w-full max-w-5xl">
          {/* Header HUD - Absolute positioning */}
          <div className="fixed top-2 left-0 right-0 z-40 flex justify-between items-center px-4 max-w-5xl mx-auto">
            <div className="text-xs opacity-70 font-mono">
              {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : ""}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-3 py-1 rounded-full bg-purple-900/50 text-xs border border-purple-500/30"
              >
                Leaderboard
              </button>
              {wallet && (
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 rounded-full bg-red-900/50 text-xs border border-red-500/30"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* Main Game Container */}
          <div className="pt-12 pb-6">
            {!wallet && (
              <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <h1 className="text-5xl font-bold mb-8 neon-text cyber-text">DOPE WARS</h1>
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="cyber-btn px-8 py-4 text-xl"
                >
                  {loading ? "Connecting..." : "Connect Wallet"}
                </button>
              </div>
            )}

            {wallet && !sessionActive && (
              <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <h2 className="text-3xl font-bold mb-6 neon-text">Start Your Run</h2>
                <p className="text-gray-300 mb-8 text-center max-w-md">
                  Starting conditions: $2,000 cash, $5,500 debt, 100 space coat, 100 HP
                </p>
                <button
                  onClick={startSession}
                  disabled={loading}
                  className="cyber-btn px-8 py-4 text-xl"
                >
                  {loading ? "Starting..." : "Start Session"}
                </button>
              </div>
            )}

            {inGame && (
              <>
                {/* Main Stats Bar */}
                <div className="glass-panel p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs">Cash</div>
                      <div className="text-green-400 font-bold">${formatMoney(cash)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Debt</div>
                      <div className="text-red-400 font-bold">${formatMoney(debt)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Bank</div>
                      <div className="text-blue-400 font-bold">${formatMoney(bankBalance)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Net Worth</div>
                      <div className="text-purple-400 font-bold">${formatMoney(currentNetWorth)}</div>
                    </div>
                  </div>
                  
                  {/* Health & Capacity Bar */}
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Health: {health}/100</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${health > 50 ? 'bg-green-500' : health > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${health}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Space: {totalDrugs}/{capacity}</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${totalDrugs / capacity < 0.8 ? 'bg-blue-500' : 'bg-orange-500'}`}
                          style={{ width: `${(totalDrugs / capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day & Location */}
                <div className="glass-panel p-3 mb-4 flex justify-between items-center">
                  <div>
                    <span className="text-cyan-400 font-bold">Day {days}/30</span>
                    <span className="mx-2">•</span>
                    <span className="text-purple-400">{locationName}</span>
                    {hasGun && <span className="ml-2 text-xs">🔫</span>}
                  </div>
                  <div className="text-xs text-gray-400">
                    Goal: $1,000,000
                  </div>
                </div>

                {/* Event Panel */}
                {lastEvent && (
                  <div className={`event-panel ${eventPanelClass} mb-4`}>
                    <p className={`text-sm ${eventColor}`}>{lastEvent}</p>
                  </div>
                )}

                {/* MOBILE CAROUSEL for Prices */}
                {isMobile && (
                  <div className="mb-4 overflow-hidden">
                    <div className="price-carousel">
                      {safeInventory.map((drug, idx) => (
                        <div key={idx} className="price-chip">
                          <span className="drug-name">{drug.name}</span>
                          <span className="drug-price">${formatMoney(drug.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* LEFT COLUMN */}
                  <div className="space-y-4">
                    {/* Inventory - Horizontal scroll on mobile */}
                    <div className="glass-panel p-4">
                      <h3 className="text-lg font-bold mb-3 neon-text-sm">Inventory</h3>
                      
                      {isMobile ? (
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                          {safeInventory.map((drug, idx) => (
                            <div
                              key={idx}
                              className="min-w-[280px] glass-panel-inner p-3 snap-center"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-cyan-400">{drug.name}</span>
                                <span className="text-sm text-gray-400">${formatMoney(drug.price)}</span>
                              </div>
                              <div className="text-xs text-gray-400 mb-2">
                                Own: {drug.amount}
                              </div>
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="number"
                                  min="1"
                                  value={quantities[idx]}
                                  onChange={(e) => {
                                    const newQ = [...quantities];
                                    newQ[idx] = Math.max(1, parseInt(e.target.value) || 1);
                                    setQuantities(newQ);
                                  }}
                                  className="w-20 px-2 py-1 text-sm rounded bg-gray-800 border border-gray-600"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => buy(idx, quantities[idx])}
                                  disabled={loading || totalDrugs + quantities[idx] > capacity}
                                  className="cyber-btn-sm flex-1"
                                >
                                  Buy
                                </button>
                                <button
                                  onClick={() => sell(idx, quantities[idx])}
                                  disabled={loading || drug.amount < quantities[idx]}
                                  className="cyber-btn-sm flex-1"
                                >
                                  Sell
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {safeInventory.map((drug, idx) => (
                            <div key={idx} className="glass-panel-inner p-3">
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <span className="font-bold text-cyan-400">{drug.name}</span>
                                  <span className="text-sm text-gray-400 ml-2">
                                    ${formatMoney(drug.price)}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400">Own: {drug.amount}</span>
                              </div>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  min="1"
                                  value={quantities[idx]}
                                  onChange={(e) => {
                                    const newQ = [...quantities];
                                    newQ[idx] = Math.max(1, parseInt(e.target.value) || 1);
                                    setQuantities(newQ);
                                  }}
                                  className="w-20 px-2 py-1 text-sm rounded bg-gray-800 border border-gray-600"
                                />
                                <button
                                  onClick={() => buy(idx, quantities[idx])}
                                  disabled={loading || totalDrugs + quantities[idx] > capacity}
                                  className="cyber-btn-sm flex-1"
                                >
                                  Buy
                                </button>
                                <button
                                  onClick={() => sell(idx, quantities[idx])}
                                  disabled={loading || drug.amount < quantities[idx]}
                                  className="cyber-btn-sm flex-1"
                                >
                                  Sell
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bank & Debt Management */}
                    <div className="glass-panel p-4">
                      <h3 className="text-lg font-bold mb-3 neon-text-sm">Finance</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowBankModal(true)}
                          className="cyber-btn-sm w-full"
                        >
                          💰 Bank (${formatMoney(bankBalance)})
                        </button>
                        <button
                          onClick={() => {
                            const amount = prompt("How much to pay?");
                            if (amount && !isNaN(Number(amount))) {
                              payLoan(Number(amount));
                            }
                          }}
                          disabled={loading || debt === 0}
                          className="cyber-btn-sm w-full"
                        >
                          💸 Pay Debt (${formatMoney(debt)})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-4">
                    {/* Travel */}
                    <div className="glass-panel p-4">
                      <h3 className="text-lg font-bold mb-3 neon-text-sm">Travel</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {CITY_NAMES.map((city, idx) => (
                          <button
                            key={idx}
                            onClick={() => travelTo(idx)}
                            disabled={loading || idx === locIndex || health <= 0}
                            className={`cyber-btn-sm ${
                              idx === locIndex ? "opacity-50" : ""
                            }`}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        ⚠️ Travel ends the day (+interest)
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="glass-panel p-4">
                      <h3 className="text-lg font-bold mb-3 neon-text-sm">Actions</h3>
                      <div className="space-y-2">
                        <button
                          onClick={endDay}
                          disabled={loading || health <= 0}
                          className="cyber-btn-sm w-full"
                        >
                          ⏭️ End Day
                        </button>
                        <button
                          onClick={hustle}
                          disabled={loading || playerData?.hustlesUsed >= 3}
                          className="cyber-btn-sm w-full"
                        >
                          💪 Hustle ({playerData?.hustlesUsed || 0}/3)
                        </button>
                        <button
                          onClick={stash}
                          disabled={loading || playerData?.stashesUsed >= 3}
                          className="cyber-btn-sm w-full"
                        >
                          📦 Find Stash ({playerData?.stashesUsed || 0}/3)
                        </button>
                        <button
                          onClick={claimDailyIce}
                          disabled={loading}
                          className="cyber-btn-sm w-full"
                        >
                          ❄️ Claim ICE ({ice})
                        </button>
                      </div>
                    </div>

                    {/* Upgrades */}
                    <div className="glass-panel p-4">
                      <h3 className="text-lg font-bold mb-3 neon-text-sm">Upgrades</h3>
                      <div className="space-y-2">
                        <button
                          onClick={upgradeCoat}
                          disabled={loading || cash < 5000}
                          className="cyber-btn-sm w-full"
                        >
                          🧥 Upgrade Coat ($5,000) - {capacity} spaces
                        </button>
                        <button
                          onClick={buyGun}
                          disabled={loading || hasGun || cash < 3000}
                          className="cyber-btn-sm w-full"
                        >
                          {hasGun ? "🔫 Have Gun" : "🔫 Buy Gun ($3,000)"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="glass-panel p-4">
                  <button
                    onClick={settleGame}
                    disabled={loading || health <= 0}
                    className="cyber-btn w-full"
                  >
                    🏁 Settle & Restart
                  </button>
                </div>
              </>
            )}

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-center">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowBankModal(false)}
        >
          <div className="glass-panel p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 neon-text">Bank</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Balance: ${formatMoney(bankBalance)}</p>
              <p className="text-xs text-green-400">Earns 2% interest per day</p>
            </div>
            <input
              type="number"
              value={bankAmount}
              onChange={(e) => setBankAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 mb-4 rounded bg-gray-800 border border-gray-600"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (bankAmount && !isNaN(Number(bankAmount))) {
                    depositBank(Number(bankAmount));
                    setBankAmount("");
                    setShowBankModal(false);
                  }
                }}
                className="cyber-btn-sm flex-1"
              >
                Deposit
              </button>
              <button
                onClick={() => {
                  if (bankAmount && !isNaN(Number(bankAmount))) {
                    withdrawBank(Number(bankAmount));
                    setBankAmount("");
                    setShowBankModal(false);
                  }
                }}
                className="cyber-btn-sm flex-1"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cop Encounter Modal */}
      {showCopModal && inGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-panel p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-4 text-red-400">⚠️ Officer Hardass!</h3>
            <p className="text-gray-300 mb-6">The cops are onto you! What do you do?</p>
            <div className="space-y-3">
              {hasGun && (
                <button
                  onClick={() => {
                    fightCop();
                    setShowCopModal(false);
                  }}
                  className="cyber-btn w-full"
                >
                  🔫 Fight (60% win, +$2,000)
                </button>
              )}
              <button
                onClick={() => {
                  runFromCop();
                  setShowCopModal(false);
                }}
                className="cyber-btn-sm w-full"
              >
                🏃 Run Away (70% escape)
              </button>
              <button
                onClick={() => setShowCopModal(false)}
                className="cyber-btn-sm w-full opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <EventPopup
        visible={showPopup}
        image={popupImage}
        text={popupText}
        onClose={() => setShowPopup(false)}
      />

      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </>
  );
}
