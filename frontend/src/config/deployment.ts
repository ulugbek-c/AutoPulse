/**
 * Deployment Configuration Management
 * This file handles all network-specific contract addresses and configurations
 * Update this file when deploying to new networks
 */

export type NetworkName = 'localhost' | 'sepolia' | 'mainnet';

export interface NetworkConfig {
    name: NetworkName;
    chainId: number;
    rpcUrl: string;
    contractAddress: `0x${string}`;
    explorerUrl: string;
    priceFeeds: Record<string, `0x${string}`>;
    tokens: TokenConfig[];
}

export interface TokenConfig {
    symbol: string;
    address: `0x${string}`;
    decimals: number;
    name: string;
}

// IMPORTANT: Update these addresses when deploying to new networks
export const NETWORKS: Record<NetworkName, NetworkConfig> = {
    localhost: {
        name: 'localhost',
        chainId: 31337,
        rpcUrl: 'http://localhost:8545',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642F64180aa3',
        explorerUrl: 'http://localhost:8545',
        priceFeeds: {
            'ETH/USD': '0x5FbDB2315678afecb367f032d93F642F64180aa3',
            'BTC/USD': '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512',
        },
        tokens: [
            { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18, name: 'Ethereum' },
            { symbol: 'USDC', address: '0xa513E6E4b8Efb4F2a3d6c35B6c4D6B7b6f6b5f4e', decimals: 6, name: 'USD Coin (Mock)' },
            { symbol: 'USDT', address: '0x4a5b3b6a6b5c4d4e4f5a5b5c5d5e5f606162636', decimals: 6, name: 'Tether (Mock)' },
        ],
    },
    sepolia: {
        name: 'sepolia',
        chainId: 11155111,
        rpcUrl: 'https://sepolia.infura.io/v3/',
        contractAddress: '0x5616F362FA131b392cc6d02067065023F591F15E', // UPDATE THIS AFTER DEPLOYING
        explorerUrl: 'https://sepolia.etherscan.io',
        priceFeeds: {
            'ETH/USD': '0x694AA1769357215DE4FAC081bf1f309aDC325306',
            'BTC/USD': '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43',
            'LINK/USD': '0xc59E3633BAB2575389E48007F6e61fD195988296',
            'USDC/USD': '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E',
            'DAI/USD': '0x14866185B1962B63C3Ea9E03Bc1da838bab34C19',
            'AAVE/USD': '0x547a514d5e3769680Ce22B2361c78caec484047d',
            'UNI/USD': '0x553303d460EE0afB37EdFf9bE42922D8FF63220e',
            'SOL/USD': '0xA39434A63A52E749F02807ae27335515BA4b07F7',
            'MATIC/USD': '0xd0D5e3DB44DE182D92945DdB8bcA515bc4465402',
            'ARB/USD': '0x5081a313d33017Ad68032f641a9657091B872b7B',
            'OP/USD': '0x1613bC27A1C167732a297e68A5a9072ceC9bBeCD',
            'DOT/USD': '0x78D1C7924F881358F102B9D90637F5D1e43E1960',
        },
        tokens: [
            { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18, name: 'Ethereum' },
            { symbol: 'USDC', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6, name: 'USD Coin' },
            { symbol: 'USDT', address: '0x7169D388De81E1358F102B9D90637F5D1e43E1960', decimals: 6, name: 'Tether' },
        ],
    },
    mainnet: {
        name: 'mainnet',
        chainId: 1,
        rpcUrl: 'https://mainnet.infura.io/v3/',
        contractAddress: '0x0000000000000000000000000000000000000000', // TODO: Update after mainnet deployment
        explorerUrl: 'https://etherscan.io',
        priceFeeds: {
            'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
            'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97beE88c',
        },
        tokens: [
            { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', decimals: 18, name: 'Ethereum' },
            { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, name: 'USD Coin' },
            { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, name: 'Tether' },
        ],
    },
};

/**
 * Get the current network configuration based on environment
 */
export function getCurrentNetworkConfig(): NetworkConfig {
    // Default to Sepolia for now
    const network = (process.env.NEXT_PUBLIC_NETWORK as NetworkName) || 'sepolia';
    const config = NETWORKS[network];

    if (!config) {
        console.warn(`Network ${network} not found, defaulting to Sepolia`);
        return NETWORKS.sepolia;
    }

    return config;
}

/**
 * Format deployment addresses for documentation
 */
export function generateDeploymentGuide(): string {
    return `
# Deployment Address Update Guide

After deploying the smart contract to a new network, update the following:

## 1. Update CONTRACT_ADDRESS in src/constants/index.ts
- Search for: export const CONTRACT_ADDRESS
- Update to: the address returned from deployment

## 2. Update NETWORKS in src/config/deployment.ts
- Update the contractAddress field for the target network
- Verify all price feeds are available on that network

## 3. Environment Variables
- Set NEXT_PUBLIC_NETWORK to the target network name
- Update NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

## 4. Deployment Checklist
- [ ] Contract deployed and verified
- [ ] Address updated in constants
- [ ] Price feeds verified on network
- [ ] Test market creation
- [ ] Test betting functionality
- [ ] Test market resolution

## Current Deployments
${Object.entries(NETWORKS).map(([name, config]) =>
        `- ${name.toUpperCase()}: ${config.contractAddress}`
    ).join('\n')}
`;
}
