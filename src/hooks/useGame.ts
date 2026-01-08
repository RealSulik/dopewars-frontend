// src/hooks/useGame.ts
import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

const API_BASE = "https://dopewars-backend.vercel.app/api";

// Contract details
const CONTRACT_ADDRESS = "0x58b200A5ac031DD6245ffc63E0A247AEe39ec609";
const CONTRACT_ABI = [
  "function settleRun(address playerAddress, uint256 finalNetWorth, uint256 daysPlayed, bytes32 runId, bytes signature) public"
];

// Timeout for blockchain confirmation (2 minutes)
const TX_TIMEOUT = 120000;

export function useGame() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [pendingCash, setPendingCash] = useState(false);          // ← NEW: for cash highlight
  const [pendingDrugs, setPendingDrugs] = useState<Set<number>>(new Set());  // ← NEW: for specific drugs

  const [playerData, setPlayerData] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [prices, setPrices] = useState<number[]>([]);
  const [ice, setIce] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorContext, setErrorContext] = useState<string | null>(null);

  const drugNames = ["Weed", "Acid", "Cocaine", "Heroin"];

  function showError(text: string, context?: string) {
    console.error("🚨 Game error:", text, context);
    setErrorMessage(text);
    setErrorContext(context || null);
    setTimeout(() => {
      setErrorMessage(null);
      setErrorContext(null);
    }, 5000);
  }

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      showError("No wallet found! Please install MetaMask or use Base App.", "wallet-connect");
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      });
      
      const address = accounts[0];
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      
      setWallet(address);
      setProvider(ethProvider);
    } catch (err: any) {
      showError(err.message || "Failed to connect wallet", "wallet-connect");
    } finally {
      setLoading(false);
    }
  }, []);

  // Start session
  const startSession = useCallback(async () => {
    if (!wallet || !provider) {
      showError("Connect wallet first", "session-start");
      return;
    }

    try {
      setLoading(true);
      setCurrentAction("Starting session...");
      
      const response = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerAddress: wallet }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to start session");
      }

      setSessionActive(true);
      await refreshGameState();
      
    } catch (err: any) {
      showError(err.message || "Failed to start session", "session-start");
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

      applyGameState(data.gameState);
      
    } catch (err) {
      console.warn("Failed to refresh game state:", err);
      setSessionActive(false);
    }
  }, [wallet]);

  // Auto-refresh state when wallet connects
  useEffect(() => {
    if (wallet) {
      refreshGameState();
    }
  }, [wallet, refreshGameState]);

  // Apply gameState from server response directly
  const applyGameState = useCallback((state: any) => {
    setPlayerData({
      cash: state.cash,
      location: state.location,
      daysPlayed: state.daysPlayed,
      lastEventDescription: state.lastEventDescription,
      netWorthGoal: state.netWorthGoal,
      currentNetWorth: state.currentNetWorth,
      debt: state.debt,
      bankBalance: state.bankBalance,
      trenchcoatCapacity: state.trenchcoatCapacity,
      health: state.health,
      hasGun: state.hasGun,
      coatUpgrades: state.coatUpgrades,
      copEncounterPending: state.copEncounterPending,
      coatOfferPending: state.coatOfferPending,
      wonAtDay: state.wonAtDay,
    });

    const invArr = drugNames.map((name, i) => ({
      name,
      amount: state.inventory[i],
      price: state.prices[i]
    }));

    setInventory(invArr);
    setPrices(state.prices);
    setIce(state.totalIce);
    setSessionActive(true);
  }, [drugNames]);

  // Generic action handler (BLOCKING - for Travel, Hustle, etc.)
  const sendAction = useCallback(async (
    label: string,
    action: string,
    params: any = {}
  ): Promise<string | null> => {
    if (!wallet || !sessionActive) {
      showError("Session not active", action);
      return null;
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
        if (data.mustSettle) {
          showError("⚠️ Day 30 reached! You must settle your game now.", action);
          await refreshGameState();
          return null;
        }
        throw new Error(data.error || "Action failed");
      }

      if (data.gameState) {
        applyGameState(data.gameState);
      }

      return data.eventDescription || null;

    } catch (err: any) {
      showError(err.message || "Action failed", action);
      return null;
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  }, [wallet, sessionActive, refreshGameState, applyGameState]);

  // --- SILENT ACTION (NON-BLOCKING - for instant trades) ---
  const sendTradeAction = useCallback(async (
    action: string,
    params: any = {}
  ): Promise<void> => {
    if (!wallet || !sessionActive) return;

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
      if (data.success && data.gameState) {
        applyGameState(data.gameState);
      } else if (!data.success) {
        // Rollback sync on error
        refreshGameState();
        if (data.error) showError(data.error);
      }
    } catch (err) {
      refreshGameState(); // Rollback sync on network error
    }
  }, [wallet, sessionActive, applyGameState, refreshGameState]);

  // Settle game
  const settleGame = useCallback(async (onSettlementComplete?: (data: any) => void) => {
    if (!wallet || !provider || !sessionActive) return;

    try {
      setLoading(true);
      setCurrentAction("Preparing settlement...");

      const response = await fetch(`${API_BASE}/game/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerAddress: wallet }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Settlement preparation failed");

      setCurrentAction("Confirm transaction in your wallet...");
      
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.settleRun(
        wallet,
        BigInt(data.finalNetWorth),
        BigInt(data.daysPlayed),
        data.runId,
        data.signature
      );
      
      setCurrentAction("Waiting for blockchain confirmation...");
      
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction confirmation timeout")), TX_TIMEOUT)
        )
      ]) as any;

      await fetch(`${API_BASE}/game/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameRunId: data.gameRunId,
          txHash: receipt.hash,
          playerAddress: wallet,
        }),
      });

      if (onSettlementComplete) onSettlementComplete(data);

      setSessionActive(false);
      setPlayerData(null);

    } catch (err: any) {
      showError(err.message || "Settlement failed", "settlement");
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
    errorContext,
    connectWallet,
    startSession,
    settleGame,
    pendingCash,    // ← NEW
    pendingDrugs,   // ← NEW

    buy: async (drugIndex: number, amount: number) => {
      if (!playerData || !inventory[drugIndex]) return;
      
      const cost = inventory[drugIndex].price * amount;
      const totalDrugs = inventory.reduce((sum, d) => sum + (d.amount || 0), 0);
      
      if (cost > playerData.cash) return showError("Not enough cash!");
      if (totalDrugs + amount > playerData.trenchcoatCapacity) return showError("Coat is full!");

      // INSTANT UI UPDATE
      setPlayerData((prev: any) => ({ ...prev, cash: prev.cash - cost }));
      setInventory((prev: any) => {
        const next = [...prev];
        next[drugIndex] = { ...next[drugIndex], amount: next[drugIndex].amount + amount };
        return next;
      });

      // ← NEW: Precise pending feedback
      setPendingCash(true);
      setPendingDrugs(new Set([drugIndex]));

      setTimeout(() => {
        setPendingCash(false);
        setPendingDrugs(new Set());
        refreshGameState(); // safety net
      }, 1000);

      // BACKGROUND SYNC
      sendTradeAction("buy", { drugIndex, amount });
    },

    sell: async (drugIndex: number, amount: number) => {
      if (!playerData || !inventory[drugIndex]) return;
      if (amount > inventory[drugIndex].amount) return showError("Not enough units!");

      const gain = inventory[drugIndex].price * amount;

      // INSTANT UI UPDATE
      setPlayerData((prev: any) => ({ ...prev, cash: prev.cash + gain }));
      setInventory((prev: any) => {
        const next = [...prev];
        next[drugIndex] = { ...next[drugIndex], amount: next[drugIndex].amount - amount };
        return next;
      });

      // ← NEW: Precise pending feedback
      setPendingCash(true);
      setPendingDrugs(new Set([drugIndex]));

      setTimeout(() => {
        setPendingCash(false);
        setPendingDrugs(new Set());
        refreshGameState(); // safety net
      }, 1000);

      // BACKGROUND SYNC
      sendTradeAction("sell", { drugIndex, amount });
    },

    endDay: () => sendAction("Ending day...", "endDay"),
    hustle: () => sendAction("Hustling...", "hustle"),
    stash: () => sendAction("Stashing...", "stash"),
    claimDailyIce: () => sendAction("Claiming ICE...", "claimDailyIce"),
    travelTo: (location: number) => sendAction("Traveling...", "travelTo", { location }),
    depositBank: (amount: number) => sendAction("Depositing...", "depositBank", { amount }),
    withdrawBank: (amount: number) => sendAction("Withdrawing...", "withdrawBank", { amount }),
    payLoan: (amount: number) => sendAction("Paying loan...", "payLoan", { amount }),
    acceptCoatOffer: () => sendAction("Accepting coat...", "acceptCoatOffer"),
    declineCoatOffer: () => sendAction("Declining coat...", "declineCoatOffer"),
    buyGun: () => sendAction("Buying gun...", "buyGun"),
    fightCop: () => sendAction("Fighting...", "fightCop"),
    runFromCop: () => sendAction("Running...", "runFromCop"),
  };
}