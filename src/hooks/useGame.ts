// src/hooks/useGame.ts
import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";

const API_BASE = "https://dopewars-backend.vercel.app/api";
// const API_BASE = "http://localhost:3000/api"; // For local testing

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
      
      console.log("✅ Wallet connected:", address);
      
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

      console.log("✅ Session started");
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

      const state = data.gameState;
      
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
      
      setSessionActive(true); // Ensure session is marked active if state exists
      
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

  // Generic action handler
  const sendAction = useCallback(async (
    label: string,
    action: string,
    params: any = {}
  ) => {
    if (!wallet || !sessionActive) {
      showError("Session not active", action);
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
        if (data.mustSettle) {
          showError("⚠️ Day 30 reached! You must settle your game now.", action);
          await refreshGameState();
          return;
        }
        throw new Error(data.error || "Action failed");
      }

      await refreshGameState();
      
    } catch (err: any) {
      showError(err.message || "Action failed", action);
    } finally {
      setLoading(false);
      setCurrentAction(null);
      
      setTimeout(() => refreshGameState(), 2000);
    }
  }, [wallet, sessionActive, refreshGameState]);

  // Settle game — no alert, instead return data via callback
  const settleGame = useCallback(async (onSettlementComplete?: (data: any) => void) => {
    if (!wallet || !provider || !sessionActive) {
      showError("Session not active", "settlement");
      return;
    }

    let settlementData: any = null;

    try {
      setLoading(true);
      setCurrentAction("Preparing settlement...");

      const response = await fetch(`${API_BASE}/game/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerAddress: wallet }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Settlement preparation failed");
      }

      settlementData = data;

      if (!data.signature || !data.runId || data.finalNetWorth === undefined || data.daysPlayed === undefined) {
        throw new Error("Invalid settlement data from server.");
      }

      setCurrentAction("Confirm transaction in your wallet...");
      
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      let tx;
      try {
        tx = await contract.settleRun(
          wallet,
          BigInt(data.finalNetWorth),
          BigInt(data.daysPlayed),
          data.runId,
          data.signature
        );
      } catch (err: any) {
        if (err.code === 4001 || err.code === "ACTION_REJECTED") {
          throw new Error("Transaction cancelled");
        }
        throw new Error("Transaction failed: " + (err.reason || err.message));
      }

      console.log("⏳ Transaction sent:", tx.hash);
      
      setCurrentAction("Waiting for blockchain confirmation...");
      
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction confirmation timeout")), TX_TIMEOUT)
        )
      ]) as any;
      
      console.log("✅ Settlement confirmed on-chain:", receipt.hash);

      try {
        await fetch(`${API_BASE}/game/settle`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            runId: settlementData.runId,
            txHash: receipt.hash,
            playerAddress: wallet,
          }),
        });
        console.log("✅ Backend notified — leaderboard will update soon");
      } catch (patchErr) {
        console.warn("⚠️ Failed to notify backend (PATCH), but on-chain settlement succeeded:", patchErr);
      }

      // Instead of alert, call the callback with data
      if (onSettlementComplete) {
        onSettlementComplete(settlementData);
      }

      // Reset session
      setSessionActive(false);
      setPlayerData(null);
      setInventory([]);
      setPrices([]);

    } catch (err: any) {
      console.error("Settlement error:", err);
      
      let userMessage = err.message;
      if (err.message.includes("timeout")) {
        userMessage = "Transaction is taking longer than expected. Check your wallet to see if it completed.";
      } else if (err.message.includes("insufficient funds")) {
        userMessage = "Not enough ETH for gas. Transaction needs tiny gas buffer.";
      } else if (err.message.includes("cancelled")) {
        userMessage = "Transaction cancelled. Your game is still saved.";
      }
      
      showError(userMessage, "settlement");
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
    
    depositBank: (amount: number) =>
      sendAction("Depositing...", "depositBank", { amount }),
    withdrawBank: (amount: number) =>
      sendAction("Withdrawing...", "withdrawBank", { amount }),
    payLoan: (amount: number) =>
      sendAction("Paying loan...", "payLoan", { amount }),
    
    acceptCoatOffer: () => 
      sendAction("Accepting coat upgrade...", "acceptCoatOffer"),
    declineCoatOffer: () => 
      sendAction("Declining coat upgrade...", "declineCoatOffer"),
    
    buyGun: () => sendAction("Buying gun...", "buyGun"),
    
    fightCop: () => sendAction("Fighting...", "fightCop"),
    runFromCop: () => sendAction("Running...", "runFromCop"),
    
    settleGame, // Now accepts optional callback
  };
}