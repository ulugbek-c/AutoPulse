// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {PricePredictionMarket} from "../src/PricePredictionMarket.sol";

contract TestEconomy is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address marketAddress = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
        address ethPriceFeed = 0x5FbDB2315678afecb367f032d93F642f64180aa3;

        PricePredictionMarket market = PricePredictionMarket(marketAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Create a test market with 30 second duration
        uint256 marketId = market.marketCount();
        market.createMarket(
            ethPriceFeed,
            2500 * 1e8, // Target $2500
            5, // short duration for testing (5s)
            true, // isAiPowered
            false, // isPrivate
            address(0) // betToken (ETH)
        );

        console2.log("Created market ID:", marketId);
        console2.log("Placing bets from deployer address...");

        // Place YES bet (0.1 ETH)
        market.placeBet{value: 0.1 ether}(marketId, true, 0);
        console2.log("Placed YES bet: 0.1 ETH");

        // Place NO bet (0.05 ETH)
        market.placeBet{value: 0.05 ether}(marketId, false, 0);
        console2.log("Placed NO bet: 0.05 ETH");

        vm.stopBroadcast();

        console2.log("\n=== Market Created ===");
        console2.log("Market ID:", marketId);
        console2.log("Total YES bets: 0.1 ETH");
        console2.log("Total NO bets: 0.05 ETH");
        console2.log("Total pot: 0.15 ETH");
        console2.log(
            "\nWait 30 seconds, then resolve the market to test claims."
        );
        console2.log(
            "Winners should be able to claim their proportional share."
        );
    }
}
