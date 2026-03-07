# AutoPulse — CRE Workflow

Chainlink Runtime Environment (CRE) workflow for the AutoPulse prediction market. Runs on a cron schedule, checks the on-chain contract for markets due for resolution, and either resolves via Chainlink Price Feeds (standard) or fetches AI sentiment from Gemini and calls `resolveMarketWithAI` (AI-powered markets).

## Config

- **config.staging.json** / **config.production.json** (or the config path set in `workflow.yaml`):
  - `schedule` (required): Cron expression, e.g. `"*/5 * * * * *"` (every 5 seconds).
  - `contractAddress` (required): Deployed `PricePredictionMarket` address (0x-prefixed, 42 chars). Sepolia.
  - `geminiApiKey` (optional): **DEPRECATED** — Use environment variable instead.

## Environment Variables

- **`GEMINI_API_KEY`** (optional): Your Gemini API key for AI-powered markets. If missing or invalid, workflow uses neutral sentiment (50) and a fallback analysis string.
  1. Get your key from https://aistudio.google.com/app/apikey
  2. Copy `.env.example` to `.env`
  3. Add your key: `GEMINI_API_KEY=your_key_here`
  4. The workflow will automatically load it from the environment

## Test / simulate (command line)

**Prereqs:** `cre` CLI installed and authenticated; `autopulse/project.yaml` present (defines RPC for Sepolia).

From **repo root**:

```bash
cd autopulse
cre workflow simulate ./market-automation --target=staging-settings
```

- Interactive: CLI asks which trigger to run → pick the **cron** trigger (index 0).
- Non-interactive (e.g. for scripts):

```bash
cd autopulse
cre workflow simulate ./market-automation --target=staging-settings --non-interactive --trigger-index 0
```

**Useful flags:**

| Flag | Meaning |
|------|--------|
| `-v` | Verbose CLI logs |
| `-g` | Engine logs |
| `--broadcast` | Send real txs (default is dry run) |
| `-e .env` | Use a specific `.env` for `CRE_ETH_PRIVATE_KEY` |

**Example output:** The workflow compiles (TypeScript → WASM), then runs one cron tick. You’ll see `[AUTOPULSE]` logs (contract address, schedule), then an EVM call to `checkUpkeep`. If the contract isn’t deployed at `contractAddress` on the RPC in `project.yaml`, you’ll get `[AUTOPULSE] ⚠️ Invalid checkUpkeep response` and result `"Error: Invalid response"`. With a deployed contract and no markets due, you’ll see `[AUTOPULSE] ✓ System healthy. No pending resolutions.` and result `"Idle"`.

---

Steps to run the example

## 1. Update .env file

You need to add a private key to env file. This is specifically required if you want to simulate chain writes. For that to work the key should be valid and funded.
If your workflow does not do any chain write then you can just put any dummy key as a private key. e.g.

```
CRE_ETH_PRIVATE_KEY=0000000000000000000000000000000000000000000000000000000000000001
```

Note: Make sure your `workflow.yaml` file is pointing to the config.json, example:

```yaml
staging-settings:
  user-workflow:
    workflow-name: "hello-world"
  workflow-artifacts:
    workflow-path: "./main.ts"
    config-path: "./config.json"
```

## 2. Install dependencies

If `bun` is not already installed, see https://bun.com/docs/installation for installing in your environment.

```bash
cd <workflow-name> && bun install
```

Example: For a workflow directory named `hello-world` the command would be:

```bash
cd hello-world && bun install
```

## 3. Simulate the workflow

Run the command from <b>project root directory</b>

```bash
cre workflow simulate <path-to-workflow-directory> --target=staging-settings
```

Example: For workflow named `hello-world` the command would be:

```bash
cre workflow simulate ./hello-world --target=staging-settings
```
