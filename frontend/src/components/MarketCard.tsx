"use client";

import { useMarketData, usePredictionMarket, useUserBets, useTokenApproval } from "@/hooks/usePredictionMarket";
import { TrendingUp, Clock, ShieldCheck, Loader2, Brain, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { PRICE_FEEDS, SUPPORTED_TOKENS, ERC20_ABI, CONTRACT_ADDRESS } from "@/constants";
import { TrendChart } from "./TrendChart";

interface MarketCardProps {
    marketId: bigint;
    asset?: string;
    filterMode?: "all" | "active" | "pending" | "resolved" | "myBets";
    userAddress?: `0x${string}`;
}

export function MarketCard({ marketId, asset = "ETH", filterMode = "all", userAddress: userAddressProp }: MarketCardProps) {
    const { address } = useAccount();
    const userAddress = userAddressProp ?? address;
    const { data: market, isLoading } = useMarketData(marketId);

    const [
        _creator,
        priceFeed,
        targetPrice,
        endTime,
        totalYesBets,
        totalNoBets,
        resolved,
        _finalPrice,
        outcome,
        aiSentiment,
        aiAnalysis,
        isAiPowered,
        isPrivate,
        betTokenAddress
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] = (market as readonly any[]) || [];

    const token = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === betTokenAddress?.toLowerCase()) || SUPPORTED_TOKENS[0];
    const isEth = token.symbol === "ETH";

    // Allowance check for ERC20
    const { data: allowance } = useReadContract({
        abi: ERC20_ABI,
        address: betTokenAddress as `0x${string}`,
        functionName: "allowance",
        args: [address!, CONTRACT_ADDRESS],
        query: {
            enabled: !!address && !isEth && !!betTokenAddress
        }
    });

    const [betAmount, setBetAmount] = useState("0.01");
    const needsApproval = !isEth && (allowance === undefined || allowance === null || (allowance as bigint) < parseUnits(betAmount, token.decimals));

    const { approve, isApproving } = useTokenApproval(
        betTokenAddress,
        CONTRACT_ADDRESS,
        betAmount,
        token.decimals
    );

    const { data: currentPriceData } = useReadContract({
        address: priceFeed as `0x${string}`,
        abi: [
            {
                name: "latestRoundData",
                type: "function",
                stateMutability: "view",
                inputs: [],
                outputs: [
                    { name: "roundId", type: "uint80" },
                    { name: "answer", type: "int256" },
                    { name: "startedAt", type: "uint256" },
                    { name: "updatedAt", type: "uint256" },
                    { name: "answeredInRound", type: "uint80" }
                ]
            }
        ],
        functionName: "latestRoundData",
        query: {
            enabled: !!market && !resolved
        }
    });

    const { placeBet, claimWinnings, isBetting } = usePredictionMarket();
    const { yesBets, noBets } = useUserBets(marketId, userAddress);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading || !market) {
        return (
            <div className="glass-card p-6 h-[300px] flex items-center justify-center animate-pulse">
                <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
            </div>
        );
    }

    // Derive asset symbol from the price feed address
    const assetSymbol = Object.entries(PRICE_FEEDS).find(
        ([, addr]) => addr.toLowerCase() === (priceFeed as string)?.toLowerCase()
    )?.[0]?.replace("_USD", "") || asset;

    const timeRemaining = Number(endTime) - Math.floor(Date.now() / 1000);
    const isExpired = timeRemaining <= 0;
    const hasUserBets = (yesBets && yesBets > 0n) || (noBets && noBets > 0n);

    // Apply filters
    if (filterMode === "active" && (resolved || isExpired)) return null;
    if (filterMode === "pending" && (resolved || !isExpired)) return null;
    if (filterMode === "resolved" && !resolved) return null;
    if (filterMode === "myBets" && !hasUserBets) return null;

    const totalPot = totalYesBets + totalNoBets;
    const yesPercentage = totalPot > 0n
        ? Number((totalYesBets * 100n) / totalPot)
        : 50;
    const noPercentage = 100 - yesPercentage;

    const formatTokenAmount = (amount: bigint) => {
        return formatUnits(amount, token.decimals);
    };

    return (
        <div className={`glass-card relative overflow-hidden p-6 group hover:neon-border transition-all duration-300 ${resolved ? 'opacity-75' : ''}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center border border-white/10">
                        <span className="font-bold text-xs">{assetSymbol}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] leading-tight group-hover:text-neon-blue transition-colors">
                            Market #{marketId.toString()}
                        </h3>
                        <p className="text-xs flex items-center gap-2 mt-1">
                            <span className="text-white/50 flex items-center gap-2">
                                {isAiPowered && !isPrivate && <Brain className="w-3 h-3 text-neon-blue" />}
                                {isPrivate && <ShieldCheck className="w-3 h-3 text-neon-cyan" />}
                                {!isAiPowered && <ShieldCheck className="w-3 h-3" />}
                            </span>
                            <span className={isPrivate ? "text-neon-cyan font-bold text-white/50" : "text-white/50"}>
                                {isPrivate ? "🔒 Confidential" : isAiPowered ? "AI Verified" : "Chainlink Automated"}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Current / Target</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-white/60">
                                {currentPriceData
                                    ? (() => {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const [, answer] = currentPriceData as any;
                                        return `$${(Number(answer) / 1e8).toLocaleString()}`;
                                    })()
                                    : <span className="text-white/30 italic" title="Price feed unavailable">N/A</span>}
                            </span>
                            <span className="text-white/20">/</span>
                            <span className="font-mono text-neon-cyan font-bold underline decoration-neon-cyan/30 underline-offset-4">
                                ${(Number(targetPrice) / 1e8).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 z-10 w-full backdrop-blur-sm">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neon-blue" />
                        <span className="text-sm font-medium">
                            {resolved ? "Resolved" : isExpired ? "Ending..." : "Active"}
                        </span>
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5 z-10 w-full backdrop-blur-sm">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Total Pot</p>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-neon-purple" />
                        <span className="text-sm font-medium">
                            {formatTokenAmount(totalPot)} {token.symbol}
                        </span>
                    </div>
                </div>
                {/* Visual Chart beneath data */}
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-40 mix-blend-screen transform overflow-hidden rounded-lg">
                    <TrendChart
                        color={resolved ? (outcome ? "#00ffcc" : "#ff3366") : (yesPercentage >= 50 ? "#00f3ff" : "#9d00ff")}
                        isBullish={yesPercentage >= 50}
                    />
                </div>
            </div>

            {!resolved && !isExpired && (
                <div className="mb-4 bg-white/5 rounded-xl border border-white/10 p-3 flex flex-col gap-2 relative z-20">
                    <label className="text-[10px] text-white/40 uppercase font-bold px-1">Bet Amount ({token.symbol})</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-blue transition-colors font-mono"
                            placeholder="Amount..."
                        />
                        <span className="absolute right-4 top-2 text-[10px] text-white/20 font-bold uppercase">{token.symbol}</span>
                    </div>
                </div>
            )}

            {!resolved && !isExpired && needsApproval && (
                <button
                    onClick={() => approve()}
                    disabled={isApproving || !betAmount || Number(betAmount) <= 0}
                    className="w-full mb-3 bg-neon-blue/10 hover:bg-neon-blue/20 border border-neon-blue/30 text-neon-blue font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-xs"
                >
                    {isApproving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    APPROVE {token.symbol} TO BET
                </button>
            )}

            <div className="flex gap-3">
                <button
                    onClick={() => placeBet(marketId, true, betAmount, token.address, token.decimals)}
                    disabled={isBetting || resolved || isExpired || needsApproval || !betAmount || Number(betAmount) <= 0}
                    className="flex-1 bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/50 text-green-400 font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center"
                >
                    <span className="text-xs">BET YES</span>
                    <span className="text-[10px] opacity-60 font-mono">{yesPercentage}% Chance</span>
                </button>
                <button
                    onClick={() => placeBet(marketId, false, betAmount, token.address, token.decimals)}
                    disabled={isBetting || resolved || isExpired || needsApproval || !betAmount || Number(betAmount) <= 0}
                    className="flex-1 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-red-400 font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center"
                >
                    <span className="text-xs">BET NO</span>
                    <span className="text-[10px] opacity-60 font-mono">{noPercentage}% Chance</span>
                </button>
            </div>

            {resolved && (
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                    <p className="text-sm font-bold text-neon-cyan mb-2">
                        Outcome: {outcome ? "YES" : "NO"}
                    </p>

                    {isAiPowered && (
                        <div className="mb-4 p-3 bg-neon-blue/5 border border-neon-blue/20 rounded-lg text-left">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-neon-blue font-bold uppercase">AI Sentiment</span>
                                <span className="text-[10px] font-mono">{Number(aiSentiment)}%</span>
                            </div>
                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-neon-blue shadow-neon-blue transition-all duration-1000"
                                    style={{ width: `${Number(aiSentiment)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-white/60 mt-2 leading-tight italic">
                                &quot;{isPrivate ? "Reasoning hidden for privacy - processed in TEE." : aiAnalysis}&quot;
                            </p>
                        </div>
                    )}

                    {((outcome && yesBets > 0n) || (!outcome && noBets > 0n)) && (
                        <button
                            onClick={() => claimWinnings(marketId)}
                            disabled={isBetting}
                            className="w-full bg-neon-blue hover:bg-neon-cyan text-black text-xs font-bold py-2 rounded-lg transition-all shadow-neon-blue"
                        >
                            {isBetting ? "..." : "CLAIM WINNINGS"}
                        </button>
                    )}
                </div>
            )}

            {(yesBets > 0n || noBets > 0n) && !resolved && (
                <div className="mt-4 pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Your Position:</span>
                    <span className={`text-[10px] font-bold ${yesBets > 0n ? 'text-green-400' : 'text-red-400'}`}>
                        {yesBets > 0n ? `YES (${formatTokenAmount(yesBets)} ${token.symbol})` : `NO (${formatTokenAmount(noBets)} ${token.symbol})`}
                    </span>
                </div>
            )}
        </div>
    );
}
