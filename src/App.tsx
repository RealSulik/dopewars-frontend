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
    
    // V2 ACTIONS
    depositBank,
    withdrawBank,
    payLoan,
    buyGun,
    fightCop,
    runFromCop,
    
    // NEW: Coat upgrade actions (random offer mechanic!)
    acceptCoatOffer,
    declineCoatOffer,
  } = useGame();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupImage, setPopupImage] = useState("");
  const [popupText, setPopupText] = useState("");
  
  // Bank/Loan modal states
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAction, setBankAction] = useState<'deposit' | 'withdraw'>('deposit');
  const [bankAmount, setBankAmount] = useState("");
  
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  
  // Cop encounter modal
  const [showCopModal, setShowCopModal] = useState(false);
  
  // NEW: Coat offer modal
  const [showCoatOfferModal, setShowCoatOfferModal] = useState(false);
  
  // NEW: Day 30 settlement prompt
  const [showDay30Modal, setShowDay30Modal] = useState(false);

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
    }
    else if (ev.includes("stash") || ev.includes("found")) img = "/events/stash.png";
    else if (ev.includes("ice")) img = "/events/ice.png";

    if (!img) return;

    setPopupImage(img);
    setPopupText(event);
    setShowPopup(true);

    setTimeout(() => setShowPopup(false), 5000);
  }, [playerData?.lastEventDescription]);

  // NEW: Coat offer modal trigger
  useEffect(() => {
    if (playerData?.coatOfferPending) {
      setShowCoatOfferModal(true);
    }
  }, [playerData?.coatOfferPending]);

  // NEW: Cop encounter modal trigger
  useEffect(() => {
    if (playerData?.copEncounterPending) {
      setShowCopModal(true);
    }
  }, [playerData?.copEncounterPending]);

  // NEW: Day 30 settlement trigger
  useEffect(() => {
    if (playerData?.daysPlayed >= 30 && sessionActive) {
      setShowDay30Modal(true);
    }
  }, [playerData?.daysPlayed, sessionActive]);

  const inGame = wallet && sessionActive && playerData && playerData.netWorthGoal > 0;
  const days = playerData?.daysPlayed ?? 0;
  const cash = playerData?.cash ?? 0;
  
  // V2 fields
  const debt = playerData?.debt ?? 0;
  const bankBalance = playerData?.bankBalance ?? 0;
  const capacity = playerData?.trenchcoatCapacity ?? 100;
  const health = playerData?.health ?? 100;
  const hasGun = playerData?.hasGun ?? false;
  const coatUpgrades = playerData?.coatUpgrades ?? 0;

  const locIndex = playerData?.location ?? -1;
  const locationName = locIndex >= 0 ? CITY_NAMES[locIndex] : "Unknown";
  const backgroundFile = locIndex >= 0 ? `/cities/${CITY_FILES[locIndex]}` : ""; // FIXED: Correct path

  const safeInventory = Array.isArray(inventory) && inventory.length > 0
    ? inventory
    : [
        { name: "Weed", price: 0, amount: 0 },
        { name: "Acid", price: 0, amount: 0 },
        { name: "Cocaine", price: 0, amount: 0 },
        { name: "Heroin", price: 0, amount: 0 },
      ];

  const totalDrugs = safeInventory.reduce((sum, d) => sum + (d.amount || 0), 0);
  const prices = safeInventory.map(d => d.price || 0);

  const lastEvent = playerData?.lastEventDescription;

  let eventColor = "text-gray-100";
  let eventPanelClass = "";
  if (lastEvent) {
    const ev = lastEvent.toLowerCase();
    if (ev.includes("mugged") || ev.includes("robbed")) {
      eventColor = "text-red-400";
      eventPanelClass = "event-bad";
    } else if (ev.includes("ice") || ev.includes("stash") || ev.includes("found")) {
      eventColor = "text-green-400";
      eventPanelClass = "event-good";
    } else if (ev.includes("police") || ev.includes("busted")) {
      eventColor = "text-yellow-400";
      eventPanelClass = "event-warning";
    }
  }
  
  // Bank modal handlers
  const handleBankSubmit = () => {
    const amount = parseInt(bankAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (bankAction === 'deposit') {
      if (amount > cash) {
        alert("Not enough cash!");
        return;
      }
      depositBank(amount);
    } else {
      if (amount > bankBalance) {
        alert("Not enough in bank!");
        return;
      }
      withdrawBank(amount);
    }
    
    setShowBankModal(false);
    setBankAmount("");
  };
  
  // Loan modal handler
  const handleLoanSubmit = () => {
    const amount = parseInt(loanAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (amount > cash) {
      alert("Not enough cash to pay loan!");
      return;
    }
    
    if (amount > debt) {
      alert("Can't pay more than you owe!");
      return;
    }
    
    payLoan(amount);
    setShowLoanModal(false);
    setLoanAmount("");
  };

  // NEW: Coat offer handlers
  const handleAcceptCoatOffer = async () => {
    if (cash < 5000) {
      alert("Not enough cash! Need $5,000");
      return;
    }
    await acceptCoatOffer();
    setShowCoatOfferModal(false);
  };

  const handleDeclineCoatOffer = async () => {
    await declineCoatOffer();
    setShowCoatOfferModal(false);
  };

  return (
    <>
      <div
        className="min-h-screen text-white relative"
        style={{
          backgroundImage: inGame ? `url(${backgroundFile})` : "url(/backgrounds/default-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/75 pointer-events-none" />

        <div className="relative z-10 mx-auto px-2 sm:px-4 py-4">
          {errorMessage && (
            <div className="p-2 mb-4 bg-red-600 text-center font-semibold rounded animate-fadeIn cyber-card">
              âš  {errorMessage}
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

          {/* SESSION START SCREEN */}
          {wallet && !sessionActive && (
            <div className="flex flex-col items-center justify-center pt-20 animate-fadeIn">
              <h2 className="text-3xl font-bold mb-4 neon-flicker">Session Required</h2>
              <p className="text-lg opacity-90 mb-8 max-w-md text-center">
                Start a session to play. Starting conditions: $2,000 cash, $5,500 debt, 100 HP
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
            <>
              {/* Top Bar */}
              <div className="flex justify-between items-center mb-4 px-2">
                <h1 className="text-xl sm:text-2xl font-bold neon-flicker neon-text-glow">
                  DopeWars
                </h1>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLeaderboard(true)}
                    className="px-4 py-2 text-sm rounded-lg neon-button cyber-sweep"
                  >
                    Leaderboard
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 text-sm rounded-lg neon-button cyber-sweep"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* MAIN STATS */}
              <div className="backpanel cyber-card cyber-scanlines mb-3 p-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-400">Cash</div>
                    <div className="text-green-400 font-bold text-lg">${formatMoney(cash)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Debt</div>
                    <div className="text-red-400 font-bold text-lg">${formatMoney(debt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Bank</div>
                    <div className="text-blue-400 font-bold text-lg">${formatMoney(bankBalance)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Net Worth</div>
                    <div className="text-purple-400 font-bold text-lg">${formatMoney(cash + bankBalance - debt)}</div>
                  </div>
                </div>

                {/* Health and Space bars */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Health: {health}/100</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${health > 50 ? 'bg-green-500' : health > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${health}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Space: {totalDrugs}/{capacity} {hasGun && 'ðŸ”«'}</div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${totalDrugs / capacity < 0.8 ? 'bg-blue-500' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(100, (totalDrugs / capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* DAY & LOCATION */}
              {isMobile ? (
                <div className="px-2 mb-3">
                  <div className="backpanel cyber-card cyber-scanlines cyber-trace px-3 py-3 flex flex-col items-center gap-2 text-center">
                    <p className="text-sm font-semibold opacity-90">
                      {locationName} Â· Day {days} {hasGun && 'ðŸ”«'}
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
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3 px-2">
                  <div className="flex-1 p-3">
                    <div className="backpanel cyber-card cyber-scanlines cyber-trace text-center px-2 py-2 h-[64px] flex items-center justify-center">
                      <p className="text-sm font-semibold opacity-90">
                        {locationName} Â· Day {days}
                      </p>
                    </div>
                  </div>
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
                          Claim Daily ICE
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
                              <div className="font-semibold text-lg mb-1">
                                {d.name}
                              </div>

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
                                    <div className="grid grid-cols-2 text-sm gap-y-1 mb-2">
                                      <span className="opacity-80">Amount: {d.amount} units</span>
                                      <span className="opacity-80 text-right">Total</span>
                                      <span className="opacity-90">Price: ${formatMoney(price)}</span>
                                      <span className="opacity-90 text-right">${formatMoney(totalCost)}</span>
                                    </div>
                                  </>
                                );
                              })()}

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
                      ðŸŒ™ End Day
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
                      ðŸ’ª Hustle (0/3)
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
                      ðŸŽ² Find Stash (0/3)
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

                  {/* BANK & LOAN PANEL */}
                  <div className="p-4 backpanel cyber-card cyber-scanlines cyber-trace">
                    <h2 className="text-lg font-bold mb-2 text-center neon-flicker">
                      ðŸ’° Bank & Loan
                    </h2>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setBankAction('deposit');
                          setShowBankModal(true);
                        }}
                        disabled={loading || cash === 0}
                        className="px-4 py-2 rounded-full text-sm font-semibold neon-button cyber-sweep bg-green-700"
                      >
                        ðŸ’µ Deposit to Bank
                      </button>
                      <button
                        onClick={() => {
                          setBankAction('withdraw');
                          setShowBankModal(true);
                        }}
                        disabled={loading || bankBalance === 0}
                        className="px-4 py-2 rounded-full text-sm font-semibold neon-button cyber-sweep bg-blue-700"
                      >
                        ðŸ’¸ Withdraw from Bank
                      </button>
                      <button
                        onClick={() => setShowLoanModal(true)}
                        disabled={loading || cash === 0 || debt === 0}
                        className="px-4 py-2 rounded-full text-sm font-semibold neon-button cyber-sweep bg-red-700"
                      >
                        ðŸ’³ Pay Loan
                      </button>
                    </div>
                  </div>

                  {/* UPGRADES PANEL */}
                  <div className="p-4 backpanel cyber-card cyber-scanlines cyber-trace">
                    <h2 className="text-lg font-bold mb-2 text-center neon-flicker">
                      🛠️ Upgrades
                    </h2>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-sm font-semibold text-purple-400">
                          🧥 Coat Capacity: {capacity}
                        </div>
                        {playerData?.coatOfferPending && (
                          <div className="text-xs text-yellow-400 animate-pulse">
                            ⭐ Upgrade offer available!
                          </div>
                        )}
                        <div className="text-xs text-center opacity-60">
                          Upgrades are rare random offers during travel
                        </div>
                      </div>
                      
                      <button
                        onClick={buyGun}
                        disabled={loading || cash < 3000 || hasGun}
                        className="px-4 py-2 rounded-full text-sm font-semibold neon-button cyber-sweep bg-orange-700"
                        title="Cost: $3,000"
                      >
                        {hasGun ? '✅ Gun Owned' : '🔫 Buy Gun'}
                      </button>
                      {!hasGun && (
                        <div className="text-xs text-center opacity-80">
                          Cost: $3,000 (helps in combat)
                        </div>
                      )}
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
                      âš ï¸ Travel ends the day (+interest)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-2">
                      {CITY_NAMES.map((city, i) => (
                        <button
                          key={i}
                          disabled={loading || locIndex === i}
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

      {/* BANK MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="backpanel cyber-card p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 neon-flicker">
              {bankAction === 'deposit' ? 'ðŸ’µ Deposit to Bank' : 'ðŸ’¸ Withdraw from Bank'}
            </h2>
            <div className="mb-4">
              <p className="text-sm opacity-80 mb-2">
                {bankAction === 'deposit' 
                  ? `Available cash: $${formatMoney(cash)}`
                  : `Bank balance: $${formatMoney(bankBalance)}`}
              </p>
              <input
                type="number"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-600 text-white"
                min="1"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleBankSubmit}
                className="flex-1 px-4 py-2 rounded neon-button cyber-sweep bg-green-700"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowBankModal(false);
                  setBankAmount("");
                }}
                className="flex-1 px-4 py-2 rounded neon-button cyber-sweep bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOAN MODAL */}
      {showLoanModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="backpanel cyber-card p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 neon-flicker">
              ðŸ’³ Pay Loan
            </h2>
            <div className="mb-4">
              <p className="text-sm opacity-80 mb-2">
                Total debt: ${formatMoney(debt)}
              </p>
              <p className="text-sm opacity-80 mb-2">
                Available cash: ${formatMoney(cash)}
              </p>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Enter amount to pay"
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-600 text-white"
                min="1"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLoanSubmit}
                className="flex-1 px-4 py-2 rounded neon-button cyber-sweep bg-red-700"
              >
                Pay Loan
              </button>
              <button
                onClick={() => {
                  setShowLoanModal(false);
                  setLoanAmount("");
                }}
                className="flex-1 px-4 py-2 rounded neon-button cyber-sweep bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COP ENCOUNTER MODAL */}
      {showCopModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="backpanel cyber-card p-6 max-w-md w-full mx-4 border-2 border-red-500">
            <h2 className="text-3xl font-bold mb-4 neon-flicker text-red-400">
              ðŸš¨ OFFICER HARDASS! ðŸš¨
            </h2>
            <p className="text-lg mb-6 text-center">
              You've been spotted! What do you do?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  fightCop();
                  setShowCopModal(false);
                }}
                className="flex-1 px-4 py-3 rounded neon-button cyber-sweep bg-red-700 text-lg font-bold"
              >
                âš”ï¸ Fight!
              </button>
              <button
                onClick={() => {
                  runFromCop();
                  setShowCopModal(false);
                }}
                className="flex-1 px-4 py-3 rounded neon-button cyber-sweep bg-yellow-700 text-lg font-bold"
              >
                ðŸƒ Run!
              </button>
            </div>
            <p className="text-xs mt-4 text-center opacity-60">
              {hasGun ? "ðŸ”« You have a gun - better odds!" : "âš ï¸ No gun - risky!"}
            </p>
          </div>
        </div>
      )}


      {/* COAT OFFER MODAL */}
      {showCoatOfferModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="backpanel cyber-card p-6 max-w-md w-full mx-4 border-2 border-purple-500">
            <h2 className="text-3xl font-bold mb-4 neon-flicker text-purple-400">
              🧥 COAT UPGRADE OFFER!
            </h2>
            <p className="text-lg mb-4 text-center">
              Someone offers to sell you a bigger trenchcoat!
            </p>
            <div className="mb-6 text-center">
              <p className="text-2xl font-bold text-green-400">
                Cost: $5,000
              </p>
              <p className="text-sm opacity-80">
                +50 capacity (currently: {capacity})
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAcceptCoatOffer}
                disabled={loading || cash < 5000}
                className="flex-1 px-4 py-3 rounded neon-button cyber-sweep bg-green-700 text-lg font-bold disabled:opacity-50"
              >
                ✅ Accept ($5k)
              </button>
              <button
                onClick={handleDeclineCoatOffer}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded neon-button cyber-sweep bg-red-700 text-lg font-bold"
              >
                ❌ Decline
              </button>
            </div>
            <p className="text-xs mt-4 text-center opacity-60">
              ⚠️ This is a rare offer! You only get ONE coat upgrade per game.
            </p>
          </div>
        </div>
      )}

      {/* DAY 30 SETTLEMENT MODAL */}
      {showDay30Modal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
          <div className="backpanel cyber-card p-8 max-w-lg w-full mx-4 border-4 border-red-500">
            <h2 className="text-4xl font-bold mb-4 neon-flicker text-red-400 text-center">
              🏁 DAY 30 REACHED!
            </h2>
            <p className="text-xl mb-6 text-center">
              Your time is up! It's time to settle your run.
            </p>
            
            <div className="mb-6 p-4 bg-black/50 rounded-lg">
              <div className="text-center mb-2">
                <p className="text-sm opacity-80">Final Stats:</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Cash:</div><div className="text-right text-green-400">${formatMoney(cash)}</div>
                <div>Bank:</div><div className="text-right text-blue-400">${formatMoney(bankBalance)}</div>
                <div>Debt:</div><div className="text-right text-red-400">${formatMoney(debt)}</div>
                <div className="font-bold">Net Worth:</div>
                <div className="text-right font-bold text-yellow-400">
                  ${formatMoney(playerData?.currentNetWorth || 0)}
                </div>
              </div>
              
              {playerData?.wonAtDay && (
                <div className="mt-4 p-2 bg-green-900/30 rounded text-center">
                  <p className="text-green-400 font-bold">
                    🎉 YOU WON at Day {playerData.wonAtDay}!
                  </p>
                  <p className="text-sm opacity-80">You'll receive 10 ICE!</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setShowDay30Modal(false);
                settleGame();
              }}
              disabled={loading}
              className="w-full px-6 py-4 rounded-lg neon-button cyber-sweep bg-gradient-to-r from-red-700 to-orange-700 text-2xl font-bold"
            >
              🎯 SETTLE NOW
            </button>
            
            <p className="text-xs mt-4 text-center opacity-60">
              Settlement will record your score on the blockchain
            </p>
          </div>
        </div>
      )}

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
