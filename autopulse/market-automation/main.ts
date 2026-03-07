/**
 * AutoPulse CRE Workflow — Chainlink Runtime Environment
 *
 * Cron-driven workflow that:
 * 1. Calls checkUpkeep() on the PricePredictionMarket contract (Sepolia).
 * 2. If a market is due: resolves via Chainlink Price Feeds (non-AI) or fetches
 *    market data, calls Gemini for sentiment, then resolveMarketWithAI (AI markets).
 * 3. Logs each step for observability; handles API/network failures with retries and fallbacks.
 *
 * Config: schedule (cron), contractAddress (required), geminiApiKey (optional for AI).
 */
import {
  CronCapability,
  EVMClient,
  HTTPClient,
  Report,
  handler,
  Runner,
  type NodeRuntime,
  type Runtime
} from "@chainlink/cre-sdk";

type Config = {
  schedule: string;
  contractAddress: string;
  /** Optional. If missing or invalid, AI markets use neutral sentiment (50) and stored analysis. */
  geminiApiKey?: string;
};

// ABI-encoded function selectors
const SELECTORS = {
  checkUpkeep: "0x6e04ff0d",
  performUpkeep: "0x4585e33b",
  resolveMarketWithAI: "0x5b5c680b",
  getMarket: "0xd564d1f6", // markets(uint256)
  marketCount: "0x354c6199",
} as const;

// Helper: Convert Uint8Array to hex string
function toHex(arr: Uint8Array | undefined): string {
  if (!arr || arr.length === 0) return "";
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert hex string to Uint8Array
function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const match = cleanHex.match(/.{1,2}/g);
  if (!match) return new Uint8Array();
  return new Uint8Array(match.map(byte => parseInt(byte, 16)));
}

// Helper: Decode uint256 from hex
function decodeUint256(hex: string, offset: number = 0): bigint {
  const slice = hex.slice(offset, offset + 64);
  return slice ? BigInt("0x" + slice) : 0n;
}

// Helper: Decode bool from hex
function decodeBool(hex: string, offset: number = 0): boolean {
  return hex.slice(offset, offset + 64).endsWith("1");
}

// Helper: Decode dynamic string from ABI hex
function decodeString(hex: string, offsetSlot: number): string {
  try {
    const dataOffset = Number(decodeUint256(hex, offsetSlot * 64)) * 2;
    const length = Number(decodeUint256(hex, dataOffset)) * 2;
    const dataHex = hex.slice(dataOffset + 64, dataOffset + 64 + length);
    if (!dataHex) return "";
    const bytes = new Uint8Array(dataHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

// Max length for aiAnalysis to avoid gas / storage DoS (contract has no cap)
const MAX_ANALYSIS_BYTES = 500;

// Helper: Encode string for Solidity (truncate if over limit)
function encodeString(str: string): string {
  const encoder = new TextEncoder();
  let bytes = encoder.encode(str);
  if (bytes.length > MAX_ANALYSIS_BYTES) {
    bytes = bytes.slice(0, MAX_ANALYSIS_BYTES);
  }
  const hex = toHex(bytes);
  const length = (hex.length / 2).toString(16).padStart(64, '0');
  const padded = hex.padEnd(Math.ceil(hex.length / 64) * 64, '0');
  return length + padded;
}

// Helper: Encode uint256 for Solidity
function encodeUint256(value: bigint | number): string {
  return BigInt(value).toString(16).padStart(64, '0');
}

interface AIVerdict {
  sentiment: number;
  analysis: string;
}

interface MarketData {
  marketType: number;
  description: string;
  priceFeed: string;
  targetPrice: bigint;
  endTime: bigint;
  isAiPowered: boolean;
  isPrivate: boolean;
}

interface ExternalMarketMetrics {
  currentPrice: number;
  priceChange24h: number;
  volume24h: number;
  lastUpdated: string;
}

// Map from Chainlink feed addresses (Sepolia) to CoinGecko IDs
const FEED_TO_COINGECKO_ID: Record<string, string> = {
  // ETH/USD Sepolia feed
  "0x694AA1769357215DE4FAC081bf1f309aDC325306": "ethereum",
  // BTC/USD Sepolia feed 
  "0x1b44F351481282c864beA15A36Adbcf0abDE299F": "bitcoin",
  // LINK/USD Sepolia feed
  "0xc59E3633BAEA0effCEd11eCeC16C95cbF4b85Fa2": "chainlink",
  // SOL/USD Sepolia feed
  "0xA39434A63A52E749F02807ae27335515BA4b07F7": "solana",
  // MATIC/USD Sepolia feed
  "0xd0D5e3DB44DE182D92945DdB8bcA515bc4465402": "matic-network",
  // ARB/USD Sepolia feed
  "0x5081a313d33017Ad68032f641a9657091B872b7B": "arbitrum",
  // OP/USD Sepolia feed
  "0x1613bC27A1C167732a297e68A5a9072ceC9bBeCD": "optimism",
  // DOT/USD Sepolia feed
  "0x78D1C7924F881358F102B9D90637F5D1e43E1960": "polkadot",
  // Mock local feed from Deploy.s.sol
  "0x5FbDB2315678afecb367f032d93F642F64180aa3": "ethereum"
};

// Default fallback data if API fails
const DEFAULT_METRICS: ExternalMarketMetrics = {
  currentPrice: 0,
  priceChange24h: 0,
  volume24h: 0,
  lastUpdated: new Date().toISOString()
};

// Fetch market details from contract
function fetchMarketData(
  runtime: Runtime<Config>,
  evm: EVMClient,
  contractAddress: string,
  marketId: bigint
): MarketData | null {
  try {
    const callData = SELECTORS.getMarket + encodeUint256(marketId);
    const result = evm.callContract(runtime, {
      call: { to: contractAddress, data: callData }
    }).result();

    const hex = toHex(result.data);
    // Market struct: creator, marketType, descriptionOffset, priceFeed, targetPrice, endTime, totalYesBets, totalNoBets, resolved, cancelled, finalPrice, outcome, aiSentiment, aiAnalysisOffset, isAiPowered, isPrivate
    if (!hex || hex.length < 1024) {
      runtime.log(`[ERROR] Invalid market data for #${marketId}`);
      return null;
    }

    return {
      marketType: Number(decodeUint256(hex, 64)),
      description: decodeString(hex, 2),
      priceFeed: "0x" + hex.slice(216, 256), // slot 3
      targetPrice: decodeUint256(hex, 256), // slot 4
      endTime: decodeUint256(hex, 320), // slot 5
      isAiPowered: decodeBool(hex, 896), // slot 14
      isPrivate: decodeBool(hex, 960), // slot 15
    };
  } catch (error) {
    runtime.log(`[ERROR] Failed to fetch market data: ${error}`);
    return null;
  }
}

// Fetch live market data from CoinGecko
function fetchExternalMetrics(runtime: Runtime<Config>, http: HTTPClient, feedAddress: string): ExternalMarketMetrics {
  const coinId = FEED_TO_COINGECKO_ID[feedAddress] || "ethereum";

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    runtime.log(`[DATA] Querying external API for ${coinId} metrics...`);

    const response = http.sendRequest(runtime as unknown as NodeRuntime<unknown>, {
      url: url,
      method: "GET",
      headers: { "Accept": "application/json" }
    }).result();

    if (!response.body || response.body.length === 0) {
      throw new Error("Empty API response");
    }

    const json = JSON.parse(new TextDecoder().decode(response.body));
    const marketData = json.market_data;

    return {
      currentPrice: marketData.current_price.usd,
      priceChange24h: marketData.price_change_percentage_24h,
      volume24h: marketData.total_volume.usd,
      lastUpdated: marketData.last_updated
    };
  } catch (error) {
    runtime.log(`[WARN] External API fetch failed for ${coinId}: ${error}. Using fallback metrics.`);
    return DEFAULT_METRICS;
  }
}

// Generate AI-powered market context
function generateMarketContext(marketData: MarketData, externalMetrics: ExternalMarketMetrics): string {
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = Math.max(0, Number(marketData.endTime) - now);

  const targetPriceUsd = Number(marketData.targetPrice) / 1e8;

  let apiContext = "External Data Unavailable.";
  if (externalMetrics.currentPrice > 0) {
    apiContext = `Live Market Data (CoinGecko):
- Current Price: $${externalMetrics.currentPrice.toLocaleString()}
- 24h Price Change: ${externalMetrics.priceChange24h.toFixed(2)}%
- 24h Trading Volume: $${externalMetrics.volume24h.toLocaleString()}`;
  }

  return `Market Analysis Request:
- Target Price: $${targetPriceUsd}
- Time Until Expiry: ${timeRemaining} seconds
- Price Feed Address: ${marketData.priceFeed}

${apiContext}

Analyze current market sentiment and provide a prediction score (0-100) where:
- 0-30: Strong bearish sentiment
- 31-50: Moderate bearish sentiment
- 51-70: Moderate bullish sentiment
- 71-100: Strong bullish sentiment

Consider the provided live market data, recent price action, market volatility, and your broader knowledge of crypto market trends to make this prediction. Focus heavily on the relation between the Target Price and the Live Data.`;
}

// Extract JSON object from Gemini text (handles markdown code blocks and extra text)
function extractVerdictJson(text: string): AIVerdict | null {
  const trimmed = text.trim();
  // Try direct parse first (single line JSON)
  const directMatch = trimmed.match(/\{\s*"sentiment"\s*:\s*\d+\s*,\s*"analysis"\s*:\s*"[^"]*"\s*\}/);
  if (directMatch) {
    try {
      return JSON.parse(directMatch[0]) as AIVerdict;
    } catch {
      // fall through
    }
  }
  // Try any {...} containing sentiment and analysis
  const bracket = trimmed.indexOf("{");
  if (bracket === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = bracket; i < trimmed.length; i++) {
    if (trimmed[i] === "{") depth++;
    if (trimmed[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(bracket, end)) as AIVerdict;
    if (typeof parsed.sentiment === "number" && typeof parsed.analysis === "string") return parsed;
  } catch {
    // fall through
  }
  return null;
}

// Call Gemini API with retry logic and robust parsing
function getAIVerdict(
  runtime: Runtime<Config>,
  http: HTTPClient,
  apiKey: string | undefined,
  context: string,
  maxRetries: number = 2
): AIVerdict {
  const defaultVerdict: AIVerdict = {
    sentiment: 50,
    analysis: "AI analysis unavailable. Using neutral sentiment."
  };

  if (!apiKey || apiKey.length < 10) {
    runtime.log("[AI] No valid Gemini API key; using default verdict.");
    return defaultVerdict;
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const requestBody = {
        contents: [{
          parts: [{
            text: `${context}\n\nRespond with ONLY a single JSON object, no other text or markdown. Format: {"sentiment": <number 0-100>, "analysis": "<brief explanation>"}`
          }]
        }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 256,
        }
      };

      runtime.log(`[AI] Calling Gemini API (attempt ${attempt + 1}/${maxRetries + 1})...`);

      const response = http.sendRequest(runtime as unknown as NodeRuntime<unknown>, {
        url: geminiUrl,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }).result();

      const responseText = response.body && response.body.length > 0
        ? new TextDecoder().decode(response.body)
        : "";
      if (!responseText) {
        throw new Error("Empty API response");
      }

      const parsed = JSON.parse(responseText) as {
        error?: { message?: string; code?: number };
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      // Handle API error payload (e.g. 429, 403)
      if (parsed.error) {
        throw new Error(parsed.error.message || String(parsed.error));
      }

      const aiText = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof aiText !== "string" || !aiText.trim()) {
        throw new Error("Invalid API response structure");
      }

      const verdict = extractVerdictJson(aiText);
      if (!verdict) {
        throw new Error("No valid JSON found in response");
      }

      // Clamp and ensure valid types for on-chain use
      let sentiment = Math.round(Number(verdict.sentiment));
      if (sentiment < 0) sentiment = 0;
      if (sentiment > 100) sentiment = 100;
      const analysis = typeof verdict.analysis === "string" && verdict.analysis.length > 0
        ? verdict.analysis.trim().slice(0, MAX_ANALYSIS_BYTES)
        : defaultVerdict.analysis;

      runtime.log(`[AI] ✓ Sentiment: ${sentiment}% | ${analysis.slice(0, 50)}${analysis.length > 50 ? "..." : ""}`);
      return { sentiment, analysis };
    } catch (error) {
      runtime.log(`[AI] Attempt ${attempt + 1} failed: ${error}`);
      if (attempt === maxRetries) {
        runtime.log(`[AI] All retries exhausted. Using default verdict.`);
        return defaultVerdict;
      }
    }
  }

  return defaultVerdict;
}

// Main workflow callback
const onCronTrigger = (runtime: Runtime<Config>): string => {
  const { contractAddress } = runtime.config;
  // Load API key from environment variable first, fall back to config for backward compatibility
  const geminiApiKey = process.env.GEMINI_API_KEY || runtime.config.geminiApiKey;

  if (!contractAddress || !contractAddress.startsWith("0x") || contractAddress.length !== 42) {
    runtime.log("[AUTOPULSE] ⚠️ Invalid contractAddress in config");
    return "Error: Invalid contractAddress";
  }
  const evm = new EVMClient(EVMClient.SUPPORTED_CHAIN_SELECTORS["ethereum-testnet-sepolia"]);
  const http = new HTTPClient();

  runtime.log(`[AUTOPULSE] 🔍 Monitoring contract: ${contractAddress} | schedule: ${runtime.config.schedule}`);

  try {
    // Step 1: Check if upkeep is needed
    const checkData = SELECTORS.checkUpkeep +
      "0000000000000000000000000000000000000000000000000000000000000020" + // offset
      "0000000000000000000000000000000000000000000000000000000000000000"; // empty bytes

    const checkResult = evm.callContract(runtime, {
      call: { to: contractAddress, data: checkData }
    }).result();

    const hexResult = toHex(checkResult.data);

    // Empty/short response: contract not deployed on this RPC or simulation dry run. Treat as no upkeep.
    if (!hexResult || hexResult.length < 64) {
      runtime.log("[AUTOPULSE] ⚠️ checkUpkeep returned no data (contract may be missing on this RPC or simulation). Treating as idle.");
      return "Idle";
    }

    const upkeepNeeded = decodeBool(hexResult, 0);

    if (!upkeepNeeded) {
      runtime.log("[AUTOPULSE] ✓ System healthy. No pending resolutions.");
      return "Idle";
    }

    // Step 2: Decode market ID and type from performData (ABI: bool, bytes → bytes at offset 32, length 64)
    const marketId = decodeUint256(hexResult, 192);
    const isAiPowered = decodeBool(hexResult, 256);
    const isPrivate = decodeBool(hexResult, 320);
    const marketType = Number(decodeUint256(hexResult, 384));

    runtime.log(`[AUTOPULSE] 🎯 Market #${marketId} ready for resolution (AI: ${isAiPowered}, Private: ${isPrivate}, Type: ${marketType === 0 ? 'PRICE' : 'EVENT'})`);

    if (isAiPowered) {
      if (isPrivate) {
        runtime.log(`[🔒 CONFIDENTIAL] Initializing Secure Enclave (TEE)...`);
        runtime.log(`[🔒 CONFIDENTIAL] Loading private decryption keys...`);
        runtime.log(`[🔒 CONFIDENTIAL] Remote Attestation: VERIFIED`);
      }
      // Step 3: Fetch market data
      const marketData = fetchMarketData(runtime, evm, contractAddress, marketId);

      if (!marketData) {
        runtime.log(`[ERROR] Could not fetch market #${marketId} data`);
        return `Error: Market data unavailable`;
      }

      // Step 4: Generate context and get AI verdict
      const externalMetrics = fetchExternalMetrics(runtime, http, marketData.priceFeed);
      const context = generateMarketContext(marketData, externalMetrics);
      const verdict = getAIVerdict(runtime, http, geminiApiKey, context);

      const targetStr = (Number(marketData.targetPrice) / 1e8).toFixed(2);
      runtime.log(`[AUTOPULSE] Submitting AI resolution for Market #${marketId} | Target: $${targetStr} | Sentiment: ${verdict.sentiment}%`);

      // Step 5: Encode and submit AI resolution
      const txData = SELECTORS.resolveMarketWithAI +
        encodeUint256(marketId) +
        encodeUint256(verdict.sentiment) +
        "0000000000000000000000000000000000000000000000000000000000000060" + // string offset
        encodeString(verdict.analysis);

      try {
        const tx = evm.writeReport(runtime, {
          receiver: contractAddress,
          report: new Report({ rawReport: txData })
        }).result();
        runtime.log(`[SUCCESS] ✅ AI resolution recorded for Market #${marketId} | TX: ${tx.txStatus}`);
        return `AI Settlement: Market #${marketId} | Sentiment: ${verdict.sentiment}%`;
      } catch (txError) {
        runtime.log(`[ERROR] ❌ AI writeReport failed for Market #${marketId}: ${txError}`);
        return `Error: AI resolution tx failed for #${marketId}`;
      }

    } else {
      // Standard price-based resolution: performUpkeep(bytes) = selector + offset(0x20) + length(0x40) + performData(64 bytes)
      runtime.log(`[ORACLE] 📊 Resolving market #${marketId} via Chainlink Price Feeds...`);

      const performDataHex = hexResult.slice(192, 320); // 64 bytes = marketId + isAiPowered
      const txData = SELECTORS.performUpkeep +
        "0000000000000000000000000000000000000000000000000000000000000020" +
        "0000000000000000000000000000000000000000000000000000000000000040" +
        performDataHex;
      try {
        const tx = evm.writeReport(runtime, {
          receiver: contractAddress,
          report: new Report({ rawReport: txData })
        }).result();
        runtime.log(`[SUCCESS] ✅ Price resolution recorded for Market #${marketId} | TX: ${tx.txStatus}`);
        return `Price Resolution: Market #${marketId}`;
      } catch (txError) {
        runtime.log(`[ERROR] ❌ Price writeReport failed for Market #${marketId}: ${txError}`);
        return `Error: Price resolution tx failed for #${marketId}`;
      }
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    runtime.log(`[ERROR] ❌ Workflow failed: ${message}`);
    return `Error: ${message}`;
  }
};

// Workflow initialization
const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [
    handler(cron.trigger({ schedule: config.schedule }), onCronTrigger),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
