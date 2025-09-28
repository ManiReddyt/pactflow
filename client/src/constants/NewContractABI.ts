export const CONTRACT_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "contractAddress",
        type: "address",
      },
    ],
    name: "NftSignDeployed",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "_fileName", type: "string" },
      { internalType: "string", name: "_documentTitle", type: "string" },
      {
        internalType: "string",
        name: "_documentDescription",
        type: "string",
      },
      {
        internalType: "address",
        name: "_intendedSigner",
        type: "address",
      },
      {
        internalType: "string",
        name: "_documentContentHash",
        type: "string",
      },
    ],
    name: "deployNftSign",
    outputs: [{ internalType: "address", name: "deployed", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "getDeployments",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "getDeploymentsCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyDeployments",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
