// src/App.tsx

// Forced update for UTF-8 encoding

import "./App.css";

import { useGame } from "./hooks/useGame";

import { useEffect, useState } from "react";

import EventPopup from "./EventPopup";

import LeaderboardModal from "./components/LeaderboardModal";

import ErrorToast from "./components/ErrorToast";

import confetti from 'canvas-confetti';







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


acceptCoatOffer,

declineCoatOffer,

} = useGame();



const [showLeaderboard, setShowLeaderboard] = useState(false);

const [showMillionModal, setShowMillionModal] = useState(false);

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

// NEW: Death modal
const [showDeathModal, setShowDeathModal] = useState(false);

// NEW: Day 30 settlement prompt

const [showDay30Modal, setShowDay30Modal] = useState(false);



// NEW: Early settlement modal (before day 30)

const [showEarlySettlementModal, setShowEarlySettlementModal] = useState(false);

const [earlySettlementData, setEarlySettlementData] = useState<any>(null);



const isMobile = typeof window !== "undefined" && window.innerWidth < 640;



// quantity state

const [quantities, setQuantities] = useState<number[]>(() => [1, 1, 1, 1]);



// Event popup logic — FIXED cop escape (coat image is now in modal only)

useEffect(() => {

const event = playerData?.lastEventDescription;

if (!event) return;



const seenKey = "lastEventSeen";

const lastSeen = localStorage.getItem(seenKey);



if (lastSeen === event) return;

localStorage.setItem(seenKey, event);



const ev = event.toLowerCase();

let img = "";

// Skip death events - handled by death modal now
if (ev.includes("died")) return;

// Fight win

if (ev.includes("won") && ev.includes("fought officer hardass")) {

img = "/events/copshot.png";

}

// Fight lose

else if (ev.includes("hurt") && ev.includes("fought officer hardass")) {

img = "/events/shot.png";

}

// Run fail

else if (ev.includes("got shot")) {

img = "/events/shot.png";

}

// Success escape

else if (ev.includes("got away safely") || ev.includes("ran away from officer hardass")) {

img = "/events/escape.png";

}

// Mugged/robbed

else if (ev.includes("mugged") || ev.includes("robbed")) {

img = "/events/mugged.png";

}

// Stash found

else if (ev.includes("stash") || ev.includes("found")) {

img = "/events/stash.png";

}

// ICE reward

else if (ev.includes("ice")) {

img = "/events/Ice.png";

}



if (!img) return;



setPopupImage(img);

setPopupText(event);

setShowPopup(true);



setTimeout(() => setShowPopup(false), 5000);

}, [playerData?.lastEventDescription]);

// NEW: Coat offer modal trigger (unchanged)

useEffect(() => {

if (playerData?.coatOfferPending) {

setShowCoatOfferModal(true);

}

}, [playerData?.coatOfferPending]);



// NEW: Cop encounter modal trigger (unchanged)

useEffect(() => {

if (playerData?.copEncounterPending) {

setShowCopModal(true);

}

}, [playerData?.copEncounterPending]);

// Death check on page load/refresh - show death modal if health is 0
useEffect(() => {
  if (sessionActive && playerData?.health !== undefined && playerData.health <= 0) {
    setShowDeathModal(true);
  }
}, [sessionActive, playerData?.health]);

// NEW: Day 30 settlement trigger (unchanged)

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



const locIndex = playerData?.location ?? -1;

const locationName = locIndex >= 0 ? CITY_NAMES[locIndex] : "Unknown";

const backgroundFile = locIndex >= 0 ? `/cities/${CITY_FILES[locIndex]}` : "";



const safeInventory = Array.isArray(inventory) && inventory.length > 0

? inventory

: [

{ name: "Weed", price: 0, amount: 0 },

{ name: "Acid", price: 0, amount: 0 },

{ name: "Cocaine", price: 0, amount: 0 },

{ name: "Heroin", price: 0, amount: 0 },

];



const totalDrugs = safeInventory.reduce((sum, d) => sum + (d.amount || 0), 0);

// $1M Early Win Detection

const currentNetWorth = cash + bankBalance - debt +

safeInventory.reduce((sum, d) => sum + (d.amount || 0) * (d.price || 0), 0);



useEffect(() => {

if (inGame && currentNetWorth >= 1000000 && !playerData?.wonAtDay && days < 30) {

setShowMillionModal(true);

// Confetti celebration!

confetti({

particleCount: 150,

spread: 70,

origin: { y: 0.6 },

colors: ['#ffd700', '#ffea00', '#ffbf00', '#ffa500', '#ffff00'],

scalar: 1.2,

gravity: 0.8,

});

}

}, [currentNetWorth, inGame, playerData?.wonAtDay, days]);

const prices = safeInventory.map(d => d.price || 0);



const lastEvent = playerData?.lastEventDescription;



let eventColor = "text-gray-100";

let eventPanelClass = "";

if (lastEvent) {

const ev = lastEvent.toLowerCase();


// BAD events - red

if (

ev.includes("mugged") ||

ev.includes("robbed") ||

ev.includes("hurt") || // ← covers fight lose

ev.includes("got shot") || // ← covers run fail

ev.includes("died") // ← death

) {

eventColor = "text-red-400";

eventPanelClass = "event-bad";

}

// GOOD events - green

else if (

ev.includes("ice") ||

ev.includes("stash") ||

ev.includes("found") ||

ev.includes("won") && ev.includes("fought") // ← fight win

) {

eventColor = "text-green-400";

eventPanelClass = "event-good";

}

// WARNING / NEUTRAL cop-related - yellow

else if (ev.includes("police") || ev.includes("busted") || ev.includes("officer hardass")) {

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

// Only show city background when actually in game

backgroundImage: inGame ? `url(${backgroundFile})` : "none",

backgroundSize: "cover",

backgroundPosition: "center",

backgroundAttachment: "fixed",

}}

>

<div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/75 pointer-events-none" />



<div className="relative z-10 mx-auto px-2 sm:px-4 py-4 max-w-7xl">

{/* NICE TOP POPUP ERROR */}

{errorMessage && (

<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full max-w-md px-4">

<div className="pointer-events-auto">

<ErrorToast message={errorMessage} onClose={() => {}} />

</div>

</div>

)}

{/* LOADING INDICATOR */}
{loading && (
  <div className="loading-chip">
    <div className="loading-dot" />
    <span>{currentAction || "Loading..."}</span>
  </div>
)}



{/* START SCREEN - Not connected - uses home.png */}

{!wallet && (

<>

{/* Fullscreen background */}

<div

className="fixed inset-0 -z-10"

style={{

backgroundImage: "url(/city.jpg)",

backgroundSize: "cover",

backgroundPosition: "center",

backgroundRepeat: "no-repeat",

}}

/>



{/* Content overlay */}

<div className="min-h-screen flex flex-col items-center justify-center pt-1 pb-4 animate-fadeIn px-4">

{/* Social Links - Top Left */}

<div className="absolute top-4 left-4 flex gap-4 z-20">

<a

href="https://x.com/dopewars_xyz"

target="_blank"

rel="noopener noreferrer"

className="text-purple-400 hover:text-purple-300 transition-all hover:scale-110"

title="Follow on X"

>

<svg className="w-8 h-8" viewBox="0 0 300 300.251" fill="currentColor">

<path d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-110.41 81.8 110.41h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"/>

</svg>

</a>

<a

href="https://discord.gg/J5cZfjYC"

target="_blank"

rel="noopener noreferrer"

className="text-cyan-400 hover:text-cyan-300 transition-all hover:scale-110"

title="Join Discord"

>

<svg className="w-8 h-8" viewBox="0 0 127.14 96.36" fill="currentColor">

<path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0 72.37 72.37 0 0 0-3.36-6.83 105.15 105.15 0 0 0-26.23 8.07C5.56 44.29 0 72.27 0 96.36a103.9 103.9 0 0 0 31.39 23.88 79.25 79.25 0 0 0 6.81-4.37 63.16 63.16 0 0 1-10.13-5.83 64.06 64.06 0 0 0 5.5-2.9 102.66 102.66 0 0 0 86.66 0 64.06 64.06 0 0 0 5.5 2.9 63.16 63.16 0 0 1-10.13 5.83 79.25 79.25 0 0 0 6.81 4.37 103.9 103.9 0 0 0 31.39-23.88c0-24.09-5.56-52.07-25.93-88.29zm-65.79 79.87c-5.52 0-10-4.76-10-10.62s4.48-10.62 10-10.62 10 4.76 10 10.62-4.48 10.62-10 10.62zm34.54 0c-5.52 0-10-4.76-10-10.62s4.48-10.62 10-10.62 10 4.76 10 10.62-4.48 10.62-10 10.62z"/>

</svg>

</a>

</div>

<h2 className="text-3xl md:text-4xl font-bold mb-2 neon-flicker text-center">

DopeWars on Base

</h2>

<p className="text-lg opacity-90 mb-1 text-center max-w-2xl px-4">

Trade. Hustle. Survive. Collect ICE.

</p>



<div className="relative max-w-4xl w-full">

<img

src="/home.png"

alt="DopeWars"

className="w-full h-auto rounded-xl shadow-2xl border-4 border-purple-600/50 neon-glow-lg"

/>

</div>



<button

onClick={connectWallet}

disabled={loading}

className="mt-2 px-8 py-4 rounded-full text-lg font-bold neon-button neon-button--buy cyber-sweep shadow-2xl"

>

{loading ? "Connecting..." : "Connect Wallet"}

</button>

</div>

</>

)}



{/* SESSION START SCREEN - Quick Tutorial with Effects */}

{wallet && !sessionActive && (

<>

{/* Fullscreen background */}

<div

className="fixed inset-0 -z-10"

style={{

backgroundImage: "url(/cyberpunk-bg.jpg)",

backgroundSize: "cover",

backgroundPosition: "center",

backgroundRepeat: "no-repeat",

}}

/>



{/* Content overlay */}

<div className="min-h-screen flex flex-col items-center justify-center pt-0 pb-4 animate-fadeIn px-4">

<h2 className="text-3xl md:text-4xl font-bold mb-5 neon-flicker text-center">

DopeWars Quick Guide

</h2>



{/* Tutorial cards with hover effect */}

<div className="max-w-3xl w-full space-y-4 mb-1">

{/* Card 1 - Gear Up */}

<div className="backpanel cyber-card p-4 rounded-xl border border-purple-500/30 flex items-center gap-5 hover:shadow-2xl hover:shadow-purple-900/60 hover:-translate-y-1 transition-all duration-300">

<div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500/60 neon-glow-lg">

<img src="/gear-up.png" alt="Gear Up" className="w-full h-full object-cover" />

</div>

<div>

<h3 className="text-lg font-bold mb-1">Gear Up</h3>

<p className="text-base opacity-90">

Start with $2,000 cash and $5,500 debt.<br />

Pay it off or face 10% daily interest!

</p>

</div>

</div>



{/* Card 2 - Trade Smart */}

<div className="backpanel cyber-card p-4 rounded-xl border border-purple-500/30 flex items-center gap-5 hover:shadow-2xl hover:shadow-purple-900/60 hover:-translate-y-1 transition-all duration-300">

<div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500/60 neon-glow-lg">

<img src="/trade-smart.png" alt="Trade Smart" className="w-full h-full object-cover" />

</div>

<div>

<h3 className="text-lg font-bold mb-1">Trade Smart</h3>

<p className="text-base opacity-90">

Travel NYC boroughs to buy low, sell high.

</p>

</div>

</div>



{/* Card 3 - Upgrade & Survive */}

<div className="backpanel cyber-card p-4 rounded-xl border border-purple-500/30 flex items-center gap-5 hover:shadow-2xl hover:shadow-purple-900/60 hover:-translate-y-1 transition-all duration-300">

<div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-purple-500/60 neon-glow-lg">

<img src="/upgrade-survive.png" alt="Upgrade & Survive" className="w-full h-full object-cover" />

</div>

<div>

<h3 className="text-lg font-bold mb-1">Upgrade & Survive</h3>

<p className="text-base opacity-90">

Buy a gun to fight cops.<br />

Get a bigger coat for more inventory.

</p>

</div>

</div>



{/* Card 4 - ICE (already perfect) */}

<div className="backpanel cyber-card p-4 rounded-xl border border-green-500/50 flex items-center gap-5 hover:shadow-2xl hover:shadow-green-900/60 hover:-translate-y-1 transition-all duration-300">

<div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-green-500/60 neon-glow-lg">

<img src="/ICE.png" alt="ICE" className="w-full h-full object-cover" />

</div>

<div>

<h3 className="text-lg font-bold mb-1 text-green-300">Win Big</h3>

<p className="text-base opacity-90 text-green-200">

Reach $1M → earn 10 ICE!<br />

Survive 30 days for consolation rewards.

</p>

</div>

</div>

</div>



{/* Button with pulse animation */}

<button

onClick={startSession}

disabled={loading}

className="mt-4 px-10 py-5 rounded-full text-lg font-bold neon-button neon-button--buy cyber-sweep shadow-2xl animate-pulse-slow"

>

{currentAction || "START HUSTLING"}

</button>

</div>

</>

)}



{/* GAME UI - uses city backgrounds */}

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



{/* MAIN STATS - ultra-tight on mobile */}

<div className="backpanel cyber-card cyber-scanlines mb-1 p-2 md:mb-3 md:p-3">

<div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-3 text-center">

<div>

<div className="text-xs text-gray-400">Cash</div>

<div className="text-green-400 font-bold text-base md:text-lg">${formatMoney(cash)}</div>

</div>

<div>

<div className="text-xs text-gray-400">Debt</div>

<div className="text-red-400 font-bold text-base md:text-lg">${formatMoney(debt)}</div>

</div>

<div>

<div className="text-xs text-gray-400">Bank</div>

<div className="text-blue-400 font-bold text-base md:text-lg">${formatMoney(bankBalance)}</div>

</div>

<div>

<div className="text-xs text-gray-400">Net Worth</div>

<div className="text-purple-400 font-bold text-base md:text-lg">${formatMoney(cash + bankBalance - debt)}</div>

</div>

</div>



{/* Health and Space bars - ultra-tight */}

<div className="mt-1 md:mt-3 grid grid-cols-2 gap-1 md:gap-3">

<div>

<div className="text-xs text-gray-400 mb-0.5">Health: {health}/100</div>

<div className="w-full bg-gray-700 rounded-full h-2">

<div

className={`h-2 rounded-full ${health > 50 ? 'bg-green-500' : health > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}

style={{ width: `${health}%` }}

/>

</div>

</div>

<div>

<div className="text-xs text-gray-400 mb-0.5">Inventory: {totalDrugs}/{capacity} {hasGun && '🔫'}</div>

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

<div className="px-0.05 mb-3">

<div className="backpanel cyber-card cyber-scanlines cyber-trace px-3 py-3 flex flex-col items-center gap-2 text-center">

<p className="text-sm font-semibold opacity-90">

{locationName} · Day {days} {hasGun && '🔫'}

</p>

<div className="flex items-center justify-center gap-2 text-xs">

<span className="font-semibold">ICE: {ice}</span>

<button

onClick={claimDailyIce}

disabled={loading}

className="px-3 py-1 rounded-full text-xs font-semibold neon-button cyber-sweep"

>

Claim Daily ICE

</button>

</div>

</div>

</div>

) : (

<div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3 px-2">

<div className="flex-1 p-3">

<div className="backpanel cyber-card cyber-scanlines cyber-trace text-center px-2 py-2 h-[64px] flex items-center justify-center">

<p className="text-sm font-semibold opacity-90">

{locationName} · Day {days}

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

<div className="flex flex-col w-full md:flex-1 backpanel cyber-card cyber-scanlines cyber-trace pt-3 pb-3 pr-3 pl-3">

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

const canSell = (d.amount || 0) > 0;

const price = Number(d.price ?? 0);

const holding = d.amount || 0;



// Calculate MAX for Buy: limited by cash and remaining space

const spaceLeft = capacity - totalDrugs;

const maxByCash = price > 0 ? Math.floor(cash / price) : 0;

const maxBySpace = spaceLeft;

const maxBuy = Math.max(0, Math.min(maxByCash, maxBySpace));



// MAX for Sell: everything held

const maxSell = holding;



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



const setMaxBuy = () => {

const next: number[] = [...quantities];

next[i] = maxBuy > 0 ? maxBuy : 1;

setQuantities(next);

};



const setMaxSell = () => {

const next: number[] = [...quantities];

next[i] = maxSell > 0 ? maxSell : 1;

setQuantities(next);

};



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



<div className="grid grid-cols-2 text-sm gap-y-1 mb-2">

<span className="opacity-80">Holding: {holding} units</span>

<span className="opacity-80 text-right">Price: ${formatMoney(price)}</span>

<span className="opacity-90">Qty:</span>

<span className="opacity-90 text-right">${formatMoney(price * qty)}</span>

</div>



<div className="flex items-center gap-2 mb-3">

<input

type="number"

min={1}

value={qty}

onChange={(e) => updateQtyRaw(e.target.value)}

onBlur={normalizeQty}

className="trade-qty flex-1"

placeholder="Qty"

/>

<button

onClick={holding > 0 ? setMaxSell : setMaxBuy}

disabled={loading || (holding > 0 ? maxSell === 0 : maxBuy === 0)}

className={`px-4 py-1 text-xs rounded border font-bold text-white disabled:opacity-50 transition-all ${

holding > 0

? "bg-orange-700/80 hover:bg-orange-600 border-orange-400"

: "bg-purple-700/80 hover:bg-purple-600 border-purple-400"

}`}

title={holding > 0 ? "Sell everything you're holding" : "Max you can afford (cash + space)"}

>

{holding > 0 ? "ALL" : "MAX"}

</button>

</div>



<div className="mt-auto flex gap-2">

<button

onClick={() => buy(i, qty)}

disabled={loading || price === 0}

className="flex-1 px-3 py-1 rounded-full text-sm font-semibold neon-button cyber-sweep neon-button--buy disabled:opacity-50"

>

Buy

</button>

<button

onClick={() => sell(i, qty)}

disabled={!canSell || loading}

className={`flex-1 px-3 py-1 rounded-full text-sm font-semibold neon-button cyber-sweep ${

canSell

? "neon-button--sell"

: "neon-button--disabled cursor-not-allowed opacity-50"

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

🌙 End Day

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

💪 Hustle (0/3)

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

🎲 Find Stash (0/3)

</button>

<button

onClick={() => {
  const savedStats = { cash, bankBalance, debt, currentNetWorth };
  settleGame((data) => {
    setEarlySettlementData({ ...data, ...savedStats });
    setShowEarlySettlementModal(true);
  });
}}

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

💰 Bank & Loan

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

💵 Deposit to Bank

</button>

<button

onClick={() => {

setBankAction('withdraw');

setShowBankModal(true);

}}

disabled={loading || bankBalance === 0}

className="px-4 py-2 rounded-full text-sm font-semibold neon-button cyber-sweep bg-blue-700"

>

💸 Withdraw from Bank

</button>

<button

onClick={() => setShowLoanModal(true)}

disabled={loading || cash === 0 || debt === 0}

className="px-4 py-2 rounded-full text-sm font-semibold neon-button cyber-sweep bg-red-700"

>

💳 Pay Loan

</button>

</div>

</div>



{/* UPGRADES PANEL */}

<div className="p-4 backpanel cyber-card cyber-scanlines cyber-trace">

<h2 className="text-lg font-bold mb-2 text-center neon-flicker">

🛠️ Upgrades

</h2>

<div className="flex flex-col items-center gap-3">

<div className="text-center">

<div className="text-sm font-semibold text-purple-400">

🧥 Coat Capacity: {capacity}

</div>

{playerData?.coatOfferPending && (

<div className="text-xs text-yellow-400 animate-pulse mt-1">

⭐ Upgrade offer available!

</div>

)}

<div className="text-xs text-center opacity-60 mt-1">

Upgrades are rare random offers during travel

</div>

</div>


<button

onClick={buyGun}

disabled={loading || hasGun}

className={`w-full max-w-xs px-6 py-3 rounded-full text-sm font-semibold neon-button cyber-sweep bg-orange-700 transition-all ${

loading || hasGun ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl hover:shadow-orange-900/50"

}`}

title={hasGun ? "Already owned" : "Cost: $3,000"}

>

{hasGun ? '✅ Gun Owned' : '🔫 Buy Gun ($3,000)'}

</button>


{!hasGun && (

<div className="text-xs text-center opacity-80">

Helps in combat against cops

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

⚠️ Travel ends the day (+interest)

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

{bankAction === 'deposit' ? '💵 Deposit to Bank' : '💸 Withdraw from Bank'}

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

💳 Pay Loan

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



{/* COP ENCOUNTER MODAL — now with image inside */}

{showCopModal && (

<div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">

<div className="backpanel cyber-card p-6 max-w-md w-full mx-4 border-2 border-red-500">

<h2 className="text-3xl font-bold mb-4 neon-flicker text-red-400 text-center">

🚨 OFFICER HARDASS! 🚨

</h2>



{/* Cop image inside modal */}

<div className="mb-6 flex justify-center">

<div className="w-64 h-64 rounded-lg overflow-hidden border-4 border-red-500/60 neon-glow-lg shadow-2xl">

<img

src="/events/cop_approach.png"

alt="Officer Hardass approaching"

className="w-full h-full object-cover"

/>

</div>

</div>



<p className="text-lg mb-6 text-center">

He's coming for you! What do you do?

</p>



<div className="flex gap-3">

<button

onClick={async () => {

setShowCopModal(false);
const event = await fightCop();
if (event?.includes('died')) {
  setShowDeathModal(true);
}

}}

className="flex-1 px-4 py-3 rounded neon-button cyber-sweep bg-red-700 text-lg font-bold"

>

⚔️ Fight!

</button>

<button

onClick={async () => {

setShowCopModal(false);
const event = await runFromCop();
if (event?.includes('died')) {
  setShowDeathModal(true);
}

}}

className="flex-1 px-4 py-3 rounded neon-button cyber-sweep bg-yellow-700 text-lg font-bold"

>

🏃 Run!

</button>

</div>



<p className="text-xs mt-4 text-center opacity-60">

{hasGun ? "🔫 You have a gun - better odds!" : "⚠️ No gun - risky!"}

</p>

</div>

</div>

)}



{/* COAT OFFER MODAL — with coat image inside */}

{showCoatOfferModal && (

<div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">

<div className="backpanel cyber-card p-6 max-w-md w-full mx-4 border-2 border-purple-500">

<h2 className="text-3xl font-bold mb-4 neon-flicker text-purple-400 text-center">

🧥 COAT UPGRADE OFFER!

</h2>



{/* Coat image inside modal */}

<div className="mb-6 flex justify-center">

<div className="w-64 h-64 rounded-lg overflow-hidden border-4 border-purple-500/60 neon-glow-lg shadow-2xl">

<img

src="/events/coat.png"

alt="Bigger Trenchcoat"

className="w-full h-full object-cover"

/>

</div>

</div>



<p className="text-lg mb-4 text-center">

Someone offers to sell you a bigger trenchcoat!

</p>

<div className="mb-6 text-center">

<p className="text-2xl font-bold text-green-400">

Cost: $5,000

</p>

<p className="text-sm opacity-80">

+50 capacity (currently: {capacity} → {capacity + 50})

</p>

</div>

<div className="flex gap-3">

<button

onClick={handleAcceptCoatOffer}

disabled={loading || cash < 5000}

className="flex-1 px-4 py-3 rounded-lg neon-button cyber-sweep bg-green-700 text-lg font-bold disabled:opacity-50"

>

✅ Accept ($5k)

</button>

<button

onClick={handleDeclineCoatOffer}

disabled={loading}

className="flex-1 px-4 py-3 rounded-lg neon-button cyber-sweep bg-red-700 text-lg font-bold"

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

const savedStats = { cash, bankBalance, debt, currentNetWorth };
setShowDay30Modal(false);
settleGame((data) => {
  setEarlySettlementData({ ...data, ...savedStats });
  setShowEarlySettlementModal(true);
});
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

{/* DEATH MODAL */}
{showDeathModal && (
<div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">
<div className="backpanel cyber-card p-8 max-w-lg w-full mx-4 border-4 border-red-700">

<h2 className="text-5xl font-bold mb-6 neon-flicker text-red-500 text-center">
💀 YOU DIED
</h2>

<div className="mb-6">
<img
  src="/events/dead.png"
  alt="Death"
  className="w-full max-h-64 object-contain rounded-lg"
/>
</div>

<p className="text-xl mb-6 text-center text-gray-300">
Officer Hardass got you. Your run is over.
</p>

<div className="mb-6 p-4 bg-black/50 rounded-lg">
<div className="grid grid-cols-2 gap-2 text-sm">
<div>Days Survived:</div>
<div className="text-right text-yellow-400">{playerData?.daysPlayed || 0}</div>
<div>Cash:</div>
<div className="text-right text-green-400">${formatMoney(cash)}</div>
<div>Bank:</div>
<div className="text-right text-blue-400">${formatMoney(bankBalance)}</div>
<div>Debt:</div>
<div className="text-right text-red-400">${formatMoney(debt)}</div>
</div>
</div>

<button
onClick={() => {
  const savedStats = { cash, bankBalance, debt, currentNetWorth };
  setShowDeathModal(false);
  settleGame((data) => {
    setEarlySettlementData({ ...data, ...savedStats });
    setShowEarlySettlementModal(true);
  });
}}
disabled={loading}
className="w-full px-6 py-4 rounded-lg neon-button cyber-sweep bg-gradient-to-r from-red-800 to-red-600 text-2xl font-bold"
>
{loading ? "Settling..." : "☠️ Accept Fate"}
</button>

<p className="text-xs mt-4 text-center opacity-60">
This will end your run and record your score
</p>

</div>
</div>
)}

{/* EARLY SETTLEMENT MODAL */}

{showEarlySettlementModal && earlySettlementData && (

<div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50">

<div className="backpanel cyber-card p-8 max-w-lg w-full mx-4 border-4 border-purple-500">

<h2 className="text-4xl font-bold mb-4 neon-flicker text-purple-400 text-center">

🏁 GAME SETTLED EARLY!

</h2>

<p className="text-xl mb-6 text-center">

You chose to settle before Day 30.

</p>


<div className="mb-6 p-4 bg-black/50 rounded-lg">

<div className="text-center mb-2">

<p className="text-sm opacity-80">Final Stats:</p>

</div>

<div className="grid grid-cols-2 gap-2 text-sm">

<div>Cash:</div><div className="text-right text-green-400">${formatMoney(earlySettlementData.cash || 0)}</div>

<div>Bank:</div><div className="text-right text-blue-400">${formatMoney(earlySettlementData.bankBalance || 0)}</div>

<div>Debt:</div><div className="text-right text-red-400">${formatMoney(earlySettlementData.debt || 0)}</div>

<div className="font-bold">Net Worth:</div>

<div className="text-right font-bold text-yellow-400">

${formatMoney(earlySettlementData.finalNetWorth || earlySettlementData.currentNetWorth || 0)}

</div>

</div>


{earlySettlementData.didWin && (

<div className="mt-4 p-2 bg-green-900/30 rounded text-center">

<p className="text-green-400 font-bold">

🎉 YOU WON at Day {earlySettlementData.wonAtDay}!

</p>

<p className="text-sm opacity-80">You'll receive 10 ICE!</p>

</div>

)}

<div className="mt-4 p-2 bg-purple-900/30 rounded text-center">

<p className="text-purple-300 font-bold">

ICE Earned: {earlySettlementData.iceAwarded}

</p>

<p className="text-sm opacity-80">Total ICE: {earlySettlementData.totalIce}</p>

</div>

</div>


<button

onClick={() => {

setShowEarlySettlementModal(false);

setEarlySettlementData(null);

}}

className="w-full px-6 py-4 rounded-lg neon-button cyber-sweep bg-gradient-to-r from-purple-700 to-pink-700 text-2xl font-bold"

>

BACK TO MENU

</button>


<p className="text-xs mt-4 text-center opacity-60">

Your score has been recorded on the blockchain

</p>

</div>

</div>

)}

{/* $1M EARLY WIN MODAL - GOLD THEME */}

{showMillionModal && (
  <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 px-4">
    <div className="backpanel cyber-card p-6 max-w-sm w-full mx-4 border-4 border-yellow-500 neon-glow-lg shadow-2xl">
      {/* Title - smaller */}
      <h2 className="text-xl font-bold mb-0.1 neon-flicker text-yellow-300 text-center">
        🎉 $1 MILLION ACHIEVED!
      </h2>

      {/* Legend text - smaller */}
      <p className="text-xl mb-0.1 text-center text-yellow-200">
        You're a cyberpunk legend!
      </p>

      {/* Stats box with image inside */}
      <div className="p-5 bg-black/50 rounded-lg border-2 border-yellow-600">
        {/* Win image inside stats box */}
        <div className="mb-6 flex justify-center">
          <div className="w-56 h-56 rounded-lg overflow-hidden border-4 border-yellow-500/60 neon-glow-lg shadow-xl">
            <img 
              src="/events/mil.png" 
              alt="Victory" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Stats header - smaller */}
        <div className="text-center mb-1">
          <p className="text-base opacity-80 text-yellow-100">Current Stats:</p>
        </div>

        {/* Stats grid - smaller text */}
        <div className="grid grid-cols-2 gap-2 text-base">
          <div>Cash:</div><div className="text-right text-green-400">${formatMoney(cash)}</div>
          <div>Bank:</div><div className="text-right text-blue-400">${formatMoney(bankBalance)}</div>
          <div>Debt:</div><div className="text-right text-red-400">${formatMoney(debt)}</div>
          <div className="font-bold text-yellow-300">Net Worth:</div>
          <div className="text-right font-bold text-yellow-300">
            ${formatMoney(currentNetWorth)}
          </div>
        </div>

        {/* ICE reward - smaller */}
        <div className="mt-5 p-3 bg-yellow-900/30 rounded text-center">
          <p className="text-xl font-bold text-yellow-200">
            🎖️ 10 ICE Reward!
          </p>
        </div>
      </div>

      {/* Buttons - slightly smaller */}
      <div className="flex flex-col gap-1.5 mt-3">
        <button
          onClick={() => {
            setShowMillionModal(false);
            settleGame((data) => {
              setEarlySettlementData(data);
              setShowEarlySettlementModal(true);
            });
          }}
          disabled={loading}
          className="w-full px-6 py-4 rounded-lg neon-button cyber-sweep bg-gradient-to-r from-yellow-600 to-amber-600 text-lg font-bold shadow-xl"
        >
          🏆 End Game
        </button>
        <button
          onClick={() => setShowMillionModal(false)}
          className="w-full px-6 py-3 rounded-lg neon-button cyber-sweep bg-gradient-to-r from-purple-700 to-pink-700 text-lg font-bold"
        >
          💰 Continue Playing
        </button>
      </div>

      <p className="text-xs mt-4 text-center opacity-70 text-yellow-100">
        Keep pushing for an even higher leaderboard score!
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