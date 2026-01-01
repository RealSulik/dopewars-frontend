// src/config.ts

export const CONTRACT_ADDRESS = "0xb4b5E8654EFd675Cde9EFAf4E6131D33ABEa3aF5";

export const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_serverAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newBalance",
        type: "uint256",
      },
    ],
    name: "IceBalanceUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "netWorth",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "daysPlayed",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "iceAwarded",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "didWin",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "runId",
        type: "bytes32",
      },
    ],
    name: "RunSettled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldServer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newServer",
        type: "address",
      },
    ],
    name: "ServerAddressUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "bestNetWorth",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "netWorth",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "daysPlayed",
        type: "uint256",
      },
    ],
    name: "calculateIceReward",
    outputs: [
      {
        internalType: "uint256",
        name: "iceReward",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "messageHash",
        type: "bytes32",
      },
    ],
    name: "getEthSignedMessageHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "player",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "netWorth",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "daysPlayed",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "runId",
        type: "bytes32",
      },
    ],
    name: "getMessageHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "player",
        type: "address",
      },
    ],
    name: "getPlayerStats",
    outputs: [
      {
        internalType: "uint256",
        name: "ice",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bestScore",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "runs",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "wins",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "runId",
        type: "bytes32",
      },
    ],
    name: "isRunSettled",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "ethSignedMessageHash",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "recoverSigner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "serverAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "finalNetWorth",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "daysPlayed",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "runId",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "signature",
        type: "bytes",
      },
    ],
    name: "settleRun",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "settledRuns",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "sig",
        type: "bytes",
      },
    ],
    name: "splitSignature",
    outputs: [
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "totalIce",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "totalRuns",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "totalWins",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newServer",
        type: "address",
      },
    ],
    name: "updateServerAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];