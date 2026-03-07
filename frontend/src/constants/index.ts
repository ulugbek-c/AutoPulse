import { parseAbi } from "viem";

// Standards
export const ERC20_ABI = parseAbi([
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function decimals() public view returns (uint8)",
    "function symbol() public view returns (string)",
]);

export const SUPPORTED_TOKENS = [
    { symbol: "ETH", address: "0x0000000000000000000000000000000000000000", decimals: 18 },
    { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", decimals: 6 }, // Sepolia USDC
    { symbol: "USDT", address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0", decimals: 6 }, // Sepolia USDT - use ETH as fallback for now
] as const;

// ... intermediate code ...

export const PREDICTION_MARKET_ABI = [
    {
        type: "constructor",
        inputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "STALE_PRICE_THRESHOLD",
        inputs: [],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "VERSION",
        inputs: [],
        outputs: [{ name: "", type: "string", internalType: "string" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "accumulatedFees",
        inputs: [],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "aiResolver",
        inputs: [],
        outputs: [{ name: "", type: "address", internalType: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "checkUpkeep",
        inputs: [{ name: "", type: "bytes", internalType: "bytes" }],
        outputs: [
            { name: "upkeepNeeded", type: "bool", internalType: "bool" },
            { name: "performData", type: "bytes", internalType: "bytes" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "claimWinnings",
        inputs: [{ name: "_marketId", type: "uint256", internalType: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "createMarket",
        inputs: [
            { name: "_priceFeed", type: "address", internalType: "address" },
            { name: "_targetPrice", type: "uint256", internalType: "uint256" },
            { name: "_duration", type: "uint256", internalType: "uint256" },
            { name: "_isAiPowered", type: "bool", internalType: "bool" },
            { name: "_isPrivate", type: "bool", internalType: "bool" },
            { name: "_betToken", type: "address", internalType: "address" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "marketCount",
        inputs: [],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "markets",
        inputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        outputs: [
            { name: "creator", type: "address", internalType: "address" },
            { name: "priceFeed", type: "address", internalType: "address" },
            { name: "targetPrice", type: "uint256", internalType: "uint256" },
            { name: "endTime", type: "uint256", internalType: "uint256" },
            { name: "totalYesBets", type: "uint256", internalType: "uint256" },
            { name: "totalNoBets", type: "uint256", internalType: "uint256" },
            { name: "resolved", type: "bool", internalType: "bool" },
            { name: "finalPrice", type: "int256", internalType: "int256" },
            { name: "outcome", type: "bool", internalType: "bool" },
            { name: "aiSentiment", type: "uint256", internalType: "uint256" },
            { name: "aiAnalysis", type: "string", internalType: "string" },
            { name: "isAiPowered", type: "bool", internalType: "bool" },
            { name: "isPrivate", type: "bool", internalType: "bool" },
            { name: "betToken", type: "address", internalType: "address" },
        ],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "noBets",
        inputs: [
            { name: "", type: "uint256", internalType: "uint256" },
            { name: "", type: "address", internalType: "address" },
        ],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "owner",
        inputs: [],
        outputs: [{ name: "", type: "address", internalType: "address" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "performUpkeep",
        inputs: [{ name: "performData", type: "bytes", internalType: "bytes" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "placeBet",
        inputs: [
            { name: "_marketId", type: "uint256", internalType: "uint256" },
            { name: "_opinion", type: "bool", internalType: "bool" },
            { name: "_amount", type: "uint256", internalType: "uint256" },
        ],
        outputs: [],
        stateMutability: "payable",
    },
    {
        type: "function",
        name: "protocolFeeBps",
        inputs: [],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "renounceOwnership",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "resolveMarket",
        inputs: [{ name: "_marketId", type: "uint256", internalType: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "resolveMarketWithAI",
        inputs: [
            { name: "_marketId", type: "uint256", internalType: "uint256" },
            { name: "_aiSentiment", type: "uint256", internalType: "uint256" },
            { name: "_aiAnalysis", type: "string", internalType: "string" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "setAiResolver",
        inputs: [{ name: "_resolver", type: "address", internalType: "address" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "setProtocolFee",
        inputs: [{ name: "_feeBps", type: "uint256", internalType: "uint256" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "transferOwnership",
        inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "withdrawFees",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "yesBets",
        inputs: [
            { name: "", type: "uint256", internalType: "uint256" },
            { name: "", type: "address", internalType: "address" },
        ],
        outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "event",
        name: "BetPlaced",
        inputs: [
            { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "user", type: "address", indexed: true, internalType: "address" },
            { name: "opinion", type: "bool", indexed: false, internalType: "bool" },
            { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "FeesWithdrawn",
        inputs: [
            { name: "owner", type: "address", indexed: true, internalType: "address" },
            { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "MarketCreated",
        inputs: [
            { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "creator", type: "address", indexed: false, internalType: "address" },
            { name: "targetPrice", type: "uint256", indexed: false, internalType: "uint256" },
            { name: "endTime", type: "uint256", indexed: false, internalType: "uint256" },
            { name: "betToken", type: "address", indexed: false, internalType: "address" },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "MarketResolved",
        inputs: [
            { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
            { name: "finalPrice", type: "int256", indexed: false, internalType: "int256" },
            { name: "outcome", type: "bool", indexed: false, internalType: "bool" },
        ],
        anonymous: false,
    },
    {
        type: "event",
        name: "OwnershipTransferred",
        inputs: [
            { name: "previousOwner", type: "address", indexed: true, internalType: "address" },
            { name: "newOwner", type: "address", indexed: true, internalType: "address" },
        ],
        anonymous: false,
    },
    {
        type: "error",
        name: "OwnableInvalidOwner",
        inputs: [{ name: "owner", type: "address", internalType: "address" }],
    },
    {
        type: "error",
        name: "OwnableUnauthorizedAccount",
        inputs: [{ name: "account", type: "address", internalType: "address" }],
    },
    { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
    {
        type: "error",
        name: "SafeERC20FailedOperation",
        inputs: [{ name: "token", type: "address", internalType: "address" }],
    },
] as const;

/**
 * IMPORTANT: Update CONTRACT_ADDRESS and PRICE_FEEDS after deploying new contract
 * See DEPLOYMENT_GUIDE.md for detailed instructions
 */
export const CONTRACT_ADDRESS = "0x5616F362FA131b392cc6d02067065023F591F15E"; // Sepolia v2.2.0

/**
 * Price feeds for Chainlink Data Feeds on Sepolia testnet
 * These are used to resolve markets based on asset prices
 * See: https://docs.chain.link/data-feeds/price-feeds
 */
export const PRICE_FEEDS: Record<string, string> = {
    "ETH_USD": "0x694AA1769357215DE4FAC081bf1f309aDC325306", // Sepolia
    "BTC_USD": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    "LINK_USD": "0xC59E3633bAB2575389e48007f6E61fD195988296",
    "USDC_USD": "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    "DAI_USD": "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19",
    "USDT_USD": "0x92616fA0C7D8B90E0E9e6C9e6B1A8b8b7E8e8e8E",
    "AAVE_USD": "0x547A514D5E3769680cE22B2361c78CaeC484047D",
    "UNI_USD": "0x553303d460EE0afB37EdFf9bE42922D8FF63220e",
    "SOL_USD": "0xA39434A63A52E749F02807ae27335515BA4b07F7",
    "MATIC_USD": "0xD0D5E3dB44De182D92945dDB8bCA515Bc4465402",
    "ARB_USD": "0x5081a313D33017Ad68032F641A9657091b872b7b",
    "OP_USD": "0x1613bC27A1C167732A297E68a5A9072cec9BBecD",
    "DOT_USD": "0x78d1C7924f881358F102B9d90637F5D1E43e1960",
};
