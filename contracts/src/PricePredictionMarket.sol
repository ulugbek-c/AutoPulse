// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PricePredictionMarket
 * @dev A decentralized prediction market using Chainlink Data Feeds and Automation
 * Enhanced with Oracle safety, protocol fees, and emergency controls.
 */
contract PricePredictionMarket is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    string public constant VERSION = "2.2.0-ERC20";

    struct Market {
        address creator;
        address priceFeed;
        uint256 targetPrice;
        uint256 endTime;
        uint256 totalYesBets;
        uint256 totalNoBets;
        bool resolved;
        int256 finalPrice;
        bool outcome; // Outcome (true = Yes, false = No)
        uint256 aiSentiment; // 0-100
        string aiAnalysis;
        bool isAiPowered;
        bool isPrivate;
        address betToken; // address(0) for native ETH
    }

    uint256 public marketCount;
    uint256 public protocolFeeBps = 100; // 1% default
    uint256 public accumulatedFees;
    uint256 public constant STALE_PRICE_THRESHOLD = 4 hours;

    /// @notice Address allowed to resolve AI-powered markets (e.g. CRE workflow)
    address public aiResolver;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;

    event MarketCreated(
        uint256 indexed marketId,
        address creator,
        uint256 targetPrice,
        uint256 endTime,
        address betToken
    );
    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        bool opinion,
        uint256 amount
    );
    event MarketResolved(
        uint256 indexed marketId,
        int256 finalPrice,
        bool outcome
    );
    event FeesWithdrawn(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new price prediction market
     * @param _priceFeed The Chainlink Data Feed address for the asset
     * @param _targetPrice The price threshold (using same decimals as the feed)
     * @param _duration How long the market remains open for betting (in seconds)
     * @param _betToken The token address to use for betting (address(0) for native ETH)
     */
    function createMarket(
        address _priceFeed,
        uint256 _targetPrice,
        uint256 _duration,
        bool _isAiPowered,
        bool _isPrivate,
        address _betToken
    ) external {
        require(_priceFeed != address(0), "Invalid price feed");
        require(_targetPrice > 0, "Target price must be > 0");
        require(_duration > 0, "Duration must be > 0");

        uint256 marketId = marketCount++;

        markets[marketId] = Market({
            creator: msg.sender,
            priceFeed: _priceFeed,
            targetPrice: _targetPrice,
            endTime: block.timestamp + _duration,
            totalYesBets: 0,
            totalNoBets: 0,
            resolved: false,
            finalPrice: 0,
            outcome: false,
            aiSentiment: 0,
            aiAnalysis: "",
            isAiPowered: _isAiPowered,
            isPrivate: _isPrivate,
            betToken: _betToken
        });

        emit MarketCreated(
            marketId,
            msg.sender,
            _targetPrice,
            block.timestamp + _duration,
            _betToken
        );
    }

    /**
     * @notice Place a bet on a market
     * @param _marketId The ID of the market
     * @param _opinion true for "Price >= Target", false for "Price < Target"
     * @param _amount Necessary for ERC20 bets, ignored for Native ETH (uses msg.value)
     */
    function placeBet(
        uint256 _marketId,
        bool _opinion,
        uint256 _amount
    ) external payable nonReentrant {
        Market storage market = markets[_marketId];
        require(block.timestamp < market.endTime, "Market betting closed");
        require(!market.resolved, "Market already resolved");

        uint256 betAmount;
        if (market.betToken == address(0)) {
            require(msg.value > 0, "Native ETH bet must be > 0");
            betAmount = msg.value;
        } else {
            require(_amount > 0, "ERC20 bet must be > 0");
            require(msg.value == 0, "Native ETH not allowed for token market");
            betAmount = _amount;
            IERC20(market.betToken).safeTransferFrom(
                msg.sender,
                address(this),
                betAmount
            );
        }

        if (_opinion) {
            yesBets[_marketId][msg.sender] += betAmount;
            market.totalYesBets += betAmount;
        } else {
            noBets[_marketId][msg.sender] += betAmount;
            market.totalNoBets += betAmount;
        }

        emit BetPlaced(_marketId, msg.sender, _opinion, betAmount);
    }

    /**
     * @notice Resolves the market using Chainlink Data Feeds
     * @dev This can be called by anyone or by Chainlink Automation
     */
    function resolveMarket(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(block.timestamp >= market.endTime, "Market not yet ended");
        require(!market.resolved, "Already resolved");
        require(!market.isAiPowered, "Use resolveMarketWithAI");

        AggregatorV3Interface feed = AggregatorV3Interface(market.priceFeed);
        (, int256 price, , uint256 updatedAt, ) = feed.latestRoundData();

        require(price > 0, "Invalid oracle price");
        require(
            block.timestamp - updatedAt <= STALE_PRICE_THRESHOLD,
            "Stale oracle price"
        );

        market.finalPrice = price;
        market.outcome = (uint256(price) >= market.targetPrice);
        market.resolved = true;

        emit MarketResolved(_marketId, price, market.outcome);
    }

    /**
     * @notice Resolves the market using AI Sentiment and Price Feeds
     * @dev Only the CRE Workflow (Owner/Authorized) should call this in production
     */
    function resolveMarketWithAI(
        uint256 _marketId,
        uint256 _aiSentiment,
        string calldata _aiAnalysis
    ) external nonReentrant {
        Market storage market = markets[_marketId];
        require(block.timestamp >= market.endTime, "Market not yet ended");
        require(!market.resolved, "Already resolved");
        require(market.isAiPowered, "Not an AI market");
        require(
            msg.sender == aiResolver || msg.sender == owner(),
            "Not authorized"
        );

        AggregatorV3Interface feed = AggregatorV3Interface(market.priceFeed);
        (, int256 _feedPrice, , uint256 updatedAt, ) = feed.latestRoundData();
        int256 price = _feedPrice;

        require(price > 0, "Invalid oracle price");
        require(
            block.timestamp - updatedAt <= STALE_PRICE_THRESHOLD,
            "Stale oracle price"
        );
        market.finalPrice = price;
        market.outcome = (uint256(price) >= market.targetPrice);

        market.aiSentiment = _aiSentiment;

        if (market.isPrivate) {
            market
                .aiAnalysis = "CONFIDENTIAL: Resolution handled securely within TEE.";
        } else {
            market.aiAnalysis = _aiAnalysis;
        }

        market.resolved = true;

        emit MarketResolved(_marketId, price, market.outcome);
    }

    /**
     * @notice Claim winnings after market resolution
     */
    function claimWinnings(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved");

        uint256 userBet = market.outcome
            ? yesBets[_marketId][msg.sender]
            : noBets[_marketId][msg.sender];
        require(userBet > 0, "No winning bet");

        uint256 totalPot = market.totalYesBets + market.totalNoBets;
        uint256 winningPool = market.outcome
            ? market.totalYesBets
            : market.totalNoBets;

        uint256 grossWinnings = (userBet * totalPot) / winningPool;

        // Fee calculation
        uint256 fee = (grossWinnings * protocolFeeBps) / 10000;
        uint256 netWinnings = grossWinnings - fee;
        accumulatedFees += fee;

        if (market.outcome) yesBets[_marketId][msg.sender] = 0;
        else noBets[_marketId][msg.sender] = 0;

        if (market.betToken == address(0)) {
            (bool success, ) = msg.sender.call{value: netWinnings}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(market.betToken).safeTransfer(msg.sender, netWinnings);
        }
    }

    // --- Admin Functions ---

    function setProtocolFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 500, "Max fee 5%");
        protocolFeeBps = _feeBps;
    }

    function setAiResolver(address _resolver) external onlyOwner {
        require(_resolver != address(0), "Invalid resolver");
        aiResolver = _resolver;
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
        emit FeesWithdrawn(owner(), amount);
    }

    // --- Chainlink Automation ---

    /**
     * @dev Logic for Chainlink Automation to check if any market needs resolution
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view returns (bool upkeepNeeded, bytes memory performData) {
        for (uint256 i = 0; i < marketCount; i++) {
            if (block.timestamp >= markets[i].endTime && !markets[i].resolved) {
                return (
                    true,
                    abi.encode(i, markets[i].isAiPowered, markets[i].isPrivate)
                );
            }
        }
        return (false, "");
    }

    /**
     * @dev Logic executed by Chainlink Automation
     */
    function performUpkeep(bytes calldata performData) external {
        (uint256 marketId, bool isAi, ) = abi.decode(
            performData,
            (uint256, bool, bool)
        );
        if (isAi) {
            // In a real decentralized setup, the 'performData' should already contain the AI results
            // provided by the off-chain workflow. For now, we'll let the CRE workflow
            // call resolveMarketWithAI directly for AI markets.
        } else {
            this.resolveMarket(marketId);
        }
    }
}
