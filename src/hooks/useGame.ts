// src/hooks/useGame.ts
import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config";

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

  // Connect wallet (MetaMask, Base App, etc.)
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

  // Start session (one blockchain transaction)
  const startSession = useCallback(async () => {
    console.log("🔍 startSession called");
    console.log("🔍 wallet:", wallet);
    console.log("🔍 provider:", provider);
    
    if (!wallet || !provider) {
      showError("Connect wallet first");
      return;
    }

    try {
      setLoading(true);
      setCurrentAction("Starting session...");

      const signer = await provider.getSigner();
      
      // Call backend to start session
      const requestBody = { playerAddress: wallet };
      console.log("📤 Sending to backend:", requestBody);
      console.log("📤 API endpoint:", `${API_BASE}/game/start`);
      
      const response = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);
      
      const data = await response.json();
      console.log("📥 Response data:", data);
      
      if (!data.success) {
        throw new Error(data.error || "Failed to start session");
      }

      // Sign the session key message
      const message = `DopeWars Session Key\nNonce: ${data.nonce}\nExpires: ${data.expiresAt}`;
      console.log("✍️ Signing message:", message);
      
      const signature = await signer.signMessage(message);
      console.log("✍️ Signature:", signature);

      // Submit signature to activate session
      const activateBody = { 
        playerAddress: wallet,
        signature,
        nonce: data.nonce,
      };
      console.log("📤 Activating session:", activateBody);
      
      const activateResponse = await fetch(`${API_BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activateBody),
      });

      console.log("📥 Activate response status:", activateResponse.status);
      
      const activateData = await activateResponse.json();
      console.log("📥 Activate response data:", activateData);
      
      if (!activateData.success) {
        throw new Error(activateData.error || "Failed to activate session");
      }

      setSessionActive(true);
      console.log("✅ Session activated!");
      
      // Refresh game state
      await refreshGameState();
      
    } catch (err: any) {
      console.error("❌ startSession error:", err);
      showError(err.message || "Failed to start session");
    } finally {
      setLoading(false);
      setCurrentAction(null);
    }
  }, [wallet, provider]);

  // Refresh game state from backend
  const refreshGameState = useCallback(async () => {
    if (!wallet) return;

    try {
      const response = await fetch(`${API_BASE}/game/state?playerAddress=${wallet}`);
      const data = await response.json();

      if (!data.success) {
        console.warn("Failed to fetch game state:", data.error);
        return;
      }

      const state = data.gameState;
      
      setPlayerData({
        cash: state.cash,
        location: state.location,
        netWorthGoal: state.netWorthGoal,
        daysPlayed: state.daysPlayed,
        lastEventDescription: state.lastEventDescription || "",
        hasFinished: state.hasFinished,
        didWin: state.didWin,
        finalNetWorth: state.finalNetWorth,
        hustlesUsed: state.hustlesUsed,
        stashesUsed: state.stashesUsed,
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

  // Generic action handler for backend API calls
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

  // Settle game (final blockchain transaction)
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

      // Reset session
      setSessionActive(false);
      setPlayerData(null);
      setInventory([]);
      setPrices([]);
      setIce(0);
      
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
    
    // Game actions (all go through backend)
    endDay: () => sendAction("Ending day...", "endDay"),
    buy: (drugIndex: number, amount: number) => 
      sendAction("Buying...", "buyDrug", { drugIndex, amount }),
    sell: (drugIndex: number, amount: number) => 
      sendAction("Selling...", "sellDrug", { drugIndex, amount }),
    hustle: () => sendAction("Hustling...", "hustle"),
    stash: () => sendAction("Stashing...", "stash"),
    claimDailyIce: () => sendAction("Claiming ICE...", "claimDailyIce"),
    travelTo: (location: number) => 
      sendAction("Traveling...", "travelTo", { location }),
    
    // Settlement
    settleGame,
  };
}