// src/hooks/useGame.ts
import { useState, useCallback } from "react";
import { ethers } from "ethers";

const API_BASE = "https://dopewars-backend.vercel.app/api";
// const API_BASE = "http://localhost:3000/api"; // For local testing

export function useGame() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  
  const [playerData, setPlayerData] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [prices, setPrices] = useState<number[]>([]);
  const [ice, setIce] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const drugNames = ["Weed", "Acid", "Cocaine", "Heroin"];

  function showError(text: string) {
    console.error("🚨 Game error:", text);
    setErrorMessage(text);
    setTimeout(() => setErrorMessage(null), 8000);
  }

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      showError("No wallet found! Please install MetaMask or use Base App.");
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      const address = accounts[0];
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      
      console.log("✅ Wallet connected:", address);
      
      setWallet(address);
      setProvider(ethProvider);
    } catch (err: any) {
      showError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  // Start session
  const startSession = useCallback(async () => {
    if (!wallet || !provider) {
      showError("Connect wallet first");
      return;
    }

    try {
      setLoading(true);
      setCurrentAction("Starting session...");

      const signer = await provider.getSigner();
      
      // Call backend to start session
      const response = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerAddress: wallet }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to start session");
      }

      // Sign the session key message
      const message = `DopeWars Session Key\nNonce: ${data.nonce}\nExpires: ${data.expiresAt}`;
      const signature = await signer.signMessage(message);

      // Submit signature to activate session
      const activateResponse = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          playerAddress: wallet,
          signature,
          nonce: data.nonce,
        }),
      });

      const activateData = await activateResponse.json();
      
      if (!activateData.success) {
        throw new Error(activateData.error || "Invalid signature");
      }

      console.log("✅ Session started");
      setSessionActive(true);
      
      // Refresh game state
      await refreshGameState();
      
    } catch (err: any) {
      showError(err.message || "Failed to start session");
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  }, [wallet, provider]);

  // Refresh game state
  const refreshGameState = useCallback(async () => {
    if (!wallet) return;

    try {
      const response = await fetch(
        `${API_BASE}/game/state?playerAddress=${wallet}`
      );
      
      const data = await response.json();

      if (!data.success || !data.gameState) {
        setSessionActive(false);
        setPlayerData(null);
        return;
      }

      const state = data.gameState;
      
      setPlayerData({
        cash: state.cash,
        location: state.location,
        daysPlayed: state.daysPlayed,
        lastEventDescription: state.lastEventDescription,
        netWorthGoal: state.netWorthGoal,
        currentNetWorth: state.currentNetWorth,
        
        // V2 fields
        debt: state.debt,
        bankBalance: state.bankBalance,
        trenchcoatCapacity: state.trenchcoatCapacity,
        health: state.health,
        hasGun: state.hasGun,
        coatUpgrades: state.coatUpgrades,
        
        // NEW: Event flags
        copEncounterPending: state.copEncounterPending,
        coatOfferPending: state.coatOfferPending,
        wonAtDay: state.wonAtDay, // NEW: Track when won
      });

      // Build inventory
      const invArr: any[] = [];
      const priceArr: number[] = [];
      
      for (let i = 0; i < 4; i++) {
        priceArr.push(state.prices[i]);
        invArr.push({ 
          name: drugNames[i], 
          amount: state.inventory[i], 
          price: state.prices[i] 
        });
      }

      setInventory(invArr);
      setPrices(priceArr);
      setIce(state.totalIce);
      
    } catch (err) {
      console.warn("Failed to refresh game state:", err);
    }
  }, [wallet]);

  // Generic action handler
  const sendAction = useCallback(async (
    label: string,
    action: string,
    params: any = {}
  ) => {
    if (!wallet || !sessionActive) {
      showError("Session not active");
      return;
    }

    setCurrentAction(label);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/game/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerAddress: wallet,
          action,
          ...params,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // Check if game must settle (day 30 reached)
        if (data.mustSettle) {
          showError("⚠️ Day 30 reached! You must settle your game now.");
          await refreshGameState();
          return;
        }
        throw new Error(data.error || "Action failed");
      }

      // Refresh game state
      await refreshGameState();
      
    } catch (err: any) {
      showError(err.message || "Action failed");
    } finally {
      setLoading(false);
      setCurrentAction(null);
      
      // Fallback refresh
      setTimeout(() => refreshGameState(), 2000);
    }
  }, [wallet, sessionActive, refreshGameState]);

  // Settle game
  const settleGame = useCallback(async () => {
    if (!wallet || !provider || !sessionActive) {
      showError("Session not active");
      return;
    }

    try {
      setLoading(true);
      setCurrentAction("Settling game on blockchain...");

      const response = await fetch(`${API_BASE}/game/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerAddress: wallet }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Settlement failed");
      }

      // Wait for blockchain confirmation
      if (data.txHash) {
        const receipt = await provider.waitForTransaction(data.txHash);
        console.log("Settlement confirmed:", receipt);
      }

      // Show settlement results
      const resultMessage = data.didWin 
        ? `🎉 YOU WON at Day ${data.wonAtDay}!\nFinal: $${data.finalNetWorth.toLocaleString()}\nICE Earned: ${data.iceAwarded}\nTotal ICE: ${data.totalIce}`
        : `Game Over!\nFinal: $${data.finalNetWorth.toLocaleString()}\nICE Earned: ${data.iceAwarded}\nTotal ICE: ${data.totalIce}`;
      
      alert(resultMessage);

      // Reset session
      setSessionActive(false);
      setPlayerData(null);
      setInventory([]);
      setPrices([]);

    } catch (err: any) {
      showError(err.message || "Settlement failed");
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  }, [wallet, provider, sessionActive]);

  return {
    wallet,
    sessionActive,
    playerData,
    inventory,
    prices,
    ice,
    loading,
    currentAction,
    errorMessage,

    connectWallet,
    startSession,
    
    // Original game actions
    endDay: () => sendAction("Ending day...", "endDay"),
    buy: (drugIndex: number, amount: number) => 
      sendAction("Buying...", "buy", { drugIndex, amount }),
    sell: (drugIndex: number, amount: number) => 
      sendAction("Selling...", "sell", { drugIndex, amount }),
    hustle: () => sendAction("Hustling...", "hustle"),
    stash: () => sendAction("Stashing...", "stash"),
    claimDailyIce: () => sendAction("Claiming ICE...", "claimDailyIce"),
    travelTo: (location: number) => 
      sendAction("Traveling...", "travelTo", { location }),
    
    // NEW: Banking actions
    depositBank: (amount: number) =>
      sendAction("Depositing...", "depositBank", { amount }),
    withdrawBank: (amount: number) =>
      sendAction("Withdrawing...", "withdrawBank", { amount }),
    payLoan: (amount: number) =>
      sendAction("Paying loan...", "payLoan", { amount }),
    
    // NEW: Coat upgrade actions (random offer mechanic!)
    acceptCoatOffer: () => 
      sendAction("Accepting coat upgrade...", "acceptCoatOffer"),
    declineCoatOffer: () => 
      sendAction("Declining coat upgrade...", "declineCoatOffer"),
    
    // NEW: Upgrade actions (keeping gun for now, should be random offer later)
    buyGun: () => sendAction("Buying gun...", "buyGun"),
    
    // NEW: Combat actions
    fightCop: () => sendAction("Fighting...", "fightCop"),
    runFromCop: () => sendAction("Running...", "runFromCop"),
    
    // Settlement
    settleGame,
  };
}