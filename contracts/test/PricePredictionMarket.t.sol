// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {PricePredictionMarket} from "../src/PricePredictionMarket.sol";

// Simple Mock for AggregatorV3Interface
contract MockPriceFeed {
    int256 private price;
    uint256 private updatedAt;

    constructor(int256 _initialPrice) {
        price = _initialPrice;
        updatedAt = block.timestamp;
    }

    function setPrice(int256 _price) public {
        price = _price;
        updatedAt = block.timestamp;
    }

    function setUpdatedAt(uint256 _updatedAt) public {
        updatedAt = _updatedAt;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (0, price, 0, updatedAt, 0);
    }
}

import {MockERC20} from "./mocks/MockERC20.sol";

contract PricePredictionMarketTest is Test {
    PricePredictionMarket public market;
    MockPriceFeed public ethPriceFeed;
    MockERC20 public usdc;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public owner = address(0x3);

    uint256 public targetPrice = 3000 * 1e8; // $3000
    uint256 public duration = 1 hours;

    function setUp() public {
        vm.warp(100 days); // Move away from 0 to avoid underflows
        vm.prank(owner);
        market = new PricePredictionMarket();
        ethPriceFeed = new MockPriceFeed(2500 * 1e8); // Start at $2500
        usdc = new MockERC20("USD Coin", "USDC", 18);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);

        usdc.mint(alice, 1000 * 1e18);
        usdc.mint(bob, 1000 * 1e18);
    }

    function test_CreateMarket() public {
        market.createMarket(
            address(ethPriceFeed),
            targetPrice,
            duration,
            false, // isAiPowered
            false, // isPrivate
            address(0) // betToken (ETH)
        );
        (
            address creator,
            address feed,
            uint256 target,
            uint256 endTime, // totalYesBets // totalNoBets // resolved // finalPrice // outcome // aiSentiment // aiAnalysis
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            bool isAi,
            ,
            address bToken
        ) = market.markets(0);

        assertEq(creator, address(this));
        assertEq(feed, address(ethPriceFeed));
        assertEq(target, targetPrice);
        assertEq(endTime, block.timestamp + duration);
        assertEq(isAi, false);
        assertEq(bToken, address(0));
    }

    function test_BettingAndResolution_WithFees() public {
        market.createMarket(
            address(ethPriceFeed),
            targetPrice,
            duration,
            false,
            false,
            address(0)
        );

        vm.prank(alice);
        market.placeBet{value: 1 ether}(0, true, 0);

        vm.prank(bob);
        market.placeBet{value: 1 ether}(0, false, 0);

        vm.warp(block.timestamp + duration + 1);
        ethPriceFeed.setPrice(3500 * 1e8);
        market.resolveMarket(0);

        // Alice claims winnings         (1% fee expected)
        uint256 initialBalance = alice.balance;
        vm.prank(alice);
        market.claimWinnings(0);

        // Pot = 2 ETH. Fee = 1% of 2 ETH = 0.02 ETH. Alice gets 1.98 ETH.
        assertEq(alice.balance - initialBalance, 1.98 ether);
        assertEq(market.accumulatedFees(), 0.02 ether);
    }

    function test_ERC20Betting() public {
        market.createMarket(
            address(ethPriceFeed),
            targetPrice,
            duration,
            false,
            false,
            address(usdc)
        );

        vm.startPrank(alice);
        usdc.approve(address(market), 100 * 1e18);
        market.placeBet(0, true, 100 * 1e18);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(market), 100 * 1e18);
        market.placeBet(0, false, 100 * 1e18);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(market)), 200 * 1e18);

        vm.warp(block.timestamp + duration + 1);
        ethPriceFeed.setPrice(3500 * 1e8);
        market.resolveMarket(0);

        uint256 aliceInitial = usdc.balanceOf(alice);
        vm.prank(alice);
        market.claimWinnings(0);

        // Pot = 200 USDC. Fee = 1% = 2 USDC. Alice gets 198 USDC.
        assertEq(usdc.balanceOf(alice) - aliceInitial, 198 * 1e18);
        assertEq(market.accumulatedFees(), 2 * 1e18);
    }

    function test_RevertOnStalePrice() public {
        market.createMarket(
            address(ethPriceFeed),
            targetPrice,
            duration,
            false,
            false,
            address(0)
        );

        vm.warp(block.timestamp + duration + 1);

        // Mock a stale price         (older than 4 hours)
        ethPriceFeed.setUpdatedAt(block.timestamp - 5 hours);

        vm.expectRevert("Stale oracle price");
        market.resolveMarket(0);
    }

    function test_WithdrawFees() public {
        market.createMarket(
            address(ethPriceFeed),
            targetPrice,
            duration,
            false,
            false,
            address(0)
        );
        vm.prank(alice);
        market.placeBet{value: 1 ether}(0, true, 0);
        vm.prank(bob);
        market.placeBet{value: 1 ether}(0, false, 0);

        vm.warp(block.timestamp + duration + 1);
        ethPriceFeed.setPrice(3500 * 1e8);
        market.resolveMarket(0);

        vm.prank(alice);
        market.claimWinnings(0);

        uint256 feeAmount = market.accumulatedFees();
        assertEq(feeAmount, 0.02 ether);

        uint256 ownerInitial = owner.balance;
        vm.prank(owner);
        market.withdrawFees();

        assertEq(owner.balance - ownerInitial, 0.02 ether);
        assertEq(market.accumulatedFees(), 0);
    }

    function test_ResolveMarketWithAI_OnlyResolverOrOwner() public {
        address resolver = address(0x123);
        market.createMarket(
            address(ethPriceFeed),
            targetPrice,
            duration,
            true,
            false,
            address(0)
        );
        vm.prank(owner);
        market.setAiResolver(resolver);
        vm.warp(block.timestamp + duration + 1);
        ethPriceFeed.setPrice(3500 * 1e8);

        vm.prank(alice);
        vm.expectRevert("Not authorized");
        market.resolveMarketWithAI(0, 80, "Bullish");

        vm.prank(resolver);
        market.resolveMarketWithAI(0, 80, "Bullish");
        (, , , , , , bool resolved, , bool outcome, , , , , ) = market.markets(
            0
        );
        assertTrue(resolved);
        assertTrue(outcome);
    }

    function test_ResolveMarketWithAI_RevertOnStalePrice() public {
        address resolver = address(0x123);
        market.createMarket(
            address(ethPriceFeed),
            targetPrice,
            duration,
            true,
            false,
            address(0)
        );
        vm.prank(owner);
        market.setAiResolver(resolver);
        vm.warp(block.timestamp + duration + 1);
        ethPriceFeed.setUpdatedAt(block.timestamp - 5 hours);

        vm.prank(resolver);
        vm.expectRevert("Stale oracle price");
        market.resolveMarketWithAI(0, 80, "Bullish");
    }
}
