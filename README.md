<div align="center">
  <br />
  <h1>⚡️ AutoPulse</h1>
  <p><strong>Autonomous, AI-Powered Prediction Markets Orchestrated by Chainlink CRE</strong></p>
  <br />
</div>

## 🚀 Overview

**AutoPulse** is a decentralized prediction market platform built for the Chainlink Hackathon. It redefines traditional prediction markets by completely automating the lifecycle of a market—from creation to settlement—using the **Chainlink Runtime Environment (CRE)** as an autonomous orchestration layer. 

By combining on-chain smart contracts with off-chain CRE workflows, Chainlink Data Feeds, and Gemini AI sentiment analysis, AutoPulse delivers a truly "set-and-forget" betting experience with highly verifiable, tamper-proof resolutions.

---

## 💡 The Innovation: CRE as the Orchestration Layer

Most prediction markets rely on manual resolution or simple triggers that limit their capabilities. AutoPulse introduces **"The Pulse"**: a Chainlink CRE Workflow that acts as the autonomic nervous system of the platform.

### How it Works:
1. **Cron Trigger**: The CRE workflow executes continuously on a set schedule.
2. **State Monitoring (EVM)**: It queries the `PricePredictionMarket` smart contract to detect markets that have reached their expiration time but haven't been resolved (`checkUpkeep`).
3. **External Verification (HTTP)**: Before triggering an on-chain resolution, the workflow securely fetches external data (e.g., querying external APIs or AI models for sentiment/pricing data).
4. **Verifiable Settlement (EVM)**: The workflow safely executes the final resolution directly on-chain (`performUpkeep` / `resolveMarketWithAI`), settling all bets autonomously.

---

## 🔗 Chainlink Ecosystem Integrations

To ensure maximum security and automation, AutoPulse deeply integrates core Chainlink infrastructure:

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **Chainlink CRE (Workflows)** | `autopulse/market-automation/main.ts` | The core backend. Orchestrates Time (Cron), External APIs (HTTP), and Smart Contract execution (EVM) in a single, secure off-chain environment. |
| **Chainlink Data Feeds** | `contracts/src/PricePredictionMarket.sol` | Consumes `AggregatorV3Interface` on Sepolia to securely obtain real-time asset prices for standard market resolution. |
| **CRE SDK Core** | `@chainlink/cre-sdk` | Used to build, simulate, and deploy the automated execution logic. |

---

## 🏗 Architecture & Tech Stack

AutoPulse consists of three highly decoupled components:

- **Smart Contracts (Foundry / Solidity)**
  - A robust, gas-optimized ERC20-compatible prediction market contract.
  - Features dynamic pot calculations, fee accumulation, and AI-resolver access controls.
- **Off-Chain Automation (Chainlink CRE / TypeScript)**
  - A staging/production-ready workflow that monitors the blockchain and executes state changes autonomously.
- **Frontend App (Next.js 14 / TailwindCSS / Wagmi)**
  - A premium, dynamic dashboard featuring real-time market updates, smooth animations, and deep wallet integration (`ConnectKit`).

---

## 🚀 Quick Start (Local Setup)

Want to run AutoPulse locally? 

### 1. Smart Contracts
```bash
cd contracts
# Install dependencies
forge build
# Run the test suite
forge test
```

### 2. Frontend / UI
```bash
cd frontend
# Install dependencies
bun install
# Start the development server
bun run dev
# App will be live at http://localhost:3001
```

### 3. Simulate CRE Workflow
To see the Chainlink automation in action (dry-run):
```bash
cd autopulse
# Run the simulation against the deployed Sepolia testnet contract
cre workflow simulate ./market-automation --target=staging-settings --non-interactive --trigger-index 0
```
*(Note: If the terminal outputs "Idle", it means all current markets are already resolved or haven't expired yet!)*

---

## 🔮 Future Roadmap

While AutoPulse was built for the hackathon, the architecture is designed to scale:
- **Zero-Knowledge Privacy**: Moving the AI analysis into a Trusted Execution Environment (TEE) or generating ZK proofs for confidential market resolutions.
- **Cross-Chain Expansion**: Utilizing CCIP to allow users on Arbitrum or Base to place bets on a market resolved on Ethereum Mainnet.
- **Dynamic Liquidity Pools**: Automating market-making directly via the CRE workflow to ensure liquidity at market inception.

---

## ✅ Hackathon Requirements Checklist

This checklist confirms our compliance with the core hackathon rubrics:
- [x] **Integrate Blockchain with External API**: The CRE Workflow fetches AI sentiment/price data via HTTP APIs and broadcasts it on-chain.
- [x] **Orchestration Layer**: Utilizes Chainlink CRE to automate execution over time.
- [x] **Verifiable Data Source**: Smart contracts consume Chainlink Data Feeds (`AggregatorV3`).
- [x] **Public Source Code**: Fully open-source repository.
- [x] **README with Chainlink Links**: Documentation clearly outlines where and how Chainlink tools are used.
