// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PricePredictionMarket} from "../src/PricePredictionMarket.sol";
import {MockV3Aggregator} from "../test/mocks/MockV3Aggregator.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

contract DeployPricePredictionMarket is Script {
    function run() external returns (PricePredictionMarket) {
        uint256 deployerPrivateKey;

        // Try to get PRIVATE_KEY, fallback to CRE_ETH_PRIVATE_KEY if needed
        try vm.envUint("PRIVATE_KEY") returns (uint256 pk) {
            deployerPrivateKey = pk;
        } catch {
            deployerPrivateKey = vm.envUint("CRE_ETH_PRIVATE_KEY");
        }
        vm.startBroadcast(deployerPrivateKey);

        // If we are on a local chain (like Anvil), we deploy a mock aggregator
        // Otherwise on Sepolia, we just deploy the market contract
        if (block.chainid == 31337) {
            // Anvil Default Chain ID
            MockV3Aggregator ethFeed = new MockV3Aggregator(8, 2000 * 10 ** 8);
            console.log("Deployed Mock Price Feed (Local):", address(ethFeed));

            MockERC20 usdc = new MockERC20("USD Coin", "USDC", 18);
            console.log("Deployed Mock USDC (Local):", address(usdc));

            MockERC20 usdt = new MockERC20("Tether USD", "USDT", 18);
            console.log("Deployed Mock USDT (Local):", address(usdt));

            // Mint some to the deployer for convenience
            usdc.mint(msg.sender, 1000 * 1e18);
            usdt.mint(msg.sender, 1000 * 1e18);
        }

        PricePredictionMarket market = new PricePredictionMarket();
        console.log("Deployed PricePredictionMarket:", address(market));

        vm.stopBroadcast();
        return market;
    }
}
