"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { usePredictionMarket } from "@/hooks/usePredictionMarket";
import { PRICE_FEEDS, SUPPORTED_TOKENS } from "@/constants";
import { ChevronLeft, Rocket, Info, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { parseUnits } from "viem";
import { useReadContract, useAccount } from "wagmi";
import toast from "react-hot-toast";

export default function CreateMarket() {
    const { address, isConnected } = useAccount();
    const { createMarket, isBetting } = usePredictionMarket();
    const [asset, setAsset] = useState<keyof typeof PRICE_FEEDS>("ETH_USD");
    const [targetPrice, setTargetPrice] = useState("");
    const [durationHours, setDurationHours] = useState("24");
    const [isAiPowered, setIsAiPowered] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [betToken, setBetToken] = useState<string>(SUPPORTED_TOKENS[0].address);

    const { data: feedData } = useReadContract({
        address: PRICE_FEEDS[asset] as `0x${string}`,
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
        functionName: "latestRoundData"
    });

    const currentAssetPrice =
        feedData &&
        (() => {
            const [, answer] = feedData as readonly [
                bigint,
                bigint,
                bigint,
                bigint,
                bigint
            ];
            return Number(answer) / 1e8;
        })();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Check if wallet is connected
        if (!isConnected || !address) {
            toast.error("Please connect your wallet to create a market");
            return;
        }

        // Validate form inputs
        if (!targetPrice || Number(targetPrice) <= 0) {
            toast.error("Target price must be greater than 0");
            return;
        }

        if (!durationHours || Number(durationHours) <= 0) {
            toast.error("Duration must be greater than 0");
            return;
        }

        const durationInSeconds = BigInt(Number(durationHours) * 3600);
        const priceInOracle = parseUnits(targetPrice, 8);

        createMarket(
            PRICE_FEEDS[asset],
            priceInOracle,
            durationInSeconds,
            isAiPowered,
            isPrivate,
            betToken
        );
    };

    return (
        <main className="flex-1 overflow-y-auto">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 py-12">
                <Link href="/" className="inline-flex items-center text-sm text-white/50 hover:text-neon-blue transition-colors mb-8 group">
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Markets
                </Link>

                <div className="glass-card p-8 border-t-4 border-neon-purple shadow-neon-purple/20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center border border-neon-purple/30">
                            <Rocket className="w-6 h-6 text-neon-purple" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold italic tracking-tight">Deploy Market</h1>
                            <p className="text-sm text-white/40">Create a new automated prediction challenge</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-white/70 uppercase tracking-widest">Asset Pair</label>
                                <div className="relative group">
                                    <select
                                        value={asset}
                                        onChange={(e) => setAsset(e.target.value as keyof typeof PRICE_FEEDS)}
                                        className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-neon-purple transition-all appearance-none cursor-pointer hover:border-white/30"
                                    >
                                        {Object.keys(PRICE_FEEDS).map((key) => (
                                            <option key={key} value={key} className="bg-gray-900 text-white py-2">
                                                {key.replace("_USD", "")} / USD
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neon-purple/50 group-hover:text-neon-purple transition-colors">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-white/70 uppercase tracking-widest">Betting Token</label>
                                <div className="relative group">
                                    <select
                                        value={betToken}
                                        onChange={(e) => setBetToken(e.target.value)}
                                        className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-neon-blue transition-all appearance-none cursor-pointer hover:border-white/30 font-mono"
                                    >
                                        {SUPPORTED_TOKENS.map((t) => (
                                            <option key={t.address} value={t.address} className="bg-gray-900 text-white py-2">
                                                {t.symbol}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neon-blue/50 group-hover:text-neon-blue transition-colors">
                                        ▼
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-white/30 px-1 mt-[-10px]">
                            Select from {Object.keys(PRICE_FEEDS).length} supported Chainlink Data Feeds.
                            {currentAssetPrice !== undefined && (
                                <> Current oracle price:{" "}
                                    <span className="font-mono text-white/60">
                                        ${currentAssetPrice.toLocaleString()}
                                    </span>
                                </>
                            )}
                        </p>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white/70 uppercase tracking-widest">Target Price (USD)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    placeholder="e.g. 2850.50"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors font-mono"
                                    required
                                />
                                <span className="absolute right-4 top-3 text-white/20 font-bold">$</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-white/70 uppercase tracking-widest">Duration (Hours)</label>
                            <input
                                type="number"
                                value={durationHours}
                                onChange={(e) => setDurationHours(e.target.value)}
                                placeholder="24"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-purple transition-colors font-mono"
                                required
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-neon-blue transition-all cursor-pointer mb-6"
                            onClick={() => setIsAiPowered(!isAiPowered)}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isAiPowered ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/5 text-white/20'}`}>
                                    <Rocket className={`w-5 h-5 ${isAiPowered ? 'animate-pulse' : ''}`} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">AI Sentinel Resolution</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-tight">Advanced Sentiment Analysis</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-all relative ${isAiPowered ? 'bg-neon-blue' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAiPowered ? 'left-7' : 'left-1'}`} />
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-neon-cyan transition-all cursor-pointer ${!isAiPowered ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                            onClick={() => setIsPrivate(!isPrivate)}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isPrivate ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-white/20'}`}>
                                    <ShieldCheck className={`w-5 h-5 ${isPrivate ? 'animate-pulse' : ''}`} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Confidential Compute (Private)</p>
                                    <p className="text-[10px] text-white/40 uppercase tracking-tight">Protected in Chainlink TEE</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-neon-cyan' : 'bg-white/10'}`}>
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-7' : 'left-1'}`} />
                            </div>
                        </div>

                        <div className="bg-neon-blue/5 border border-neon-blue/20 rounded-xl p-4 flex gap-3">
                            <Info className="w-5 h-5 text-neon-blue shrink-0" />
                            <p className="text-xs text-neon-blue/80 leading-relaxed">
                                The market will be automatically resolved exactly {durationHours || '0'} hours after deployment.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isBetting || !isConnected}
                            className="w-full btn-primary bg-neon-purple shadow-neon-purple hover:scale-[1.02] text-white py-4 mt-6 flex items-center justify-center gap-2 group transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {!isConnected ? "Connect Wallet to Launch" : isBetting ? "Deploying..." : "Launch Market"}
                            {!isBetting && isConnected && <Rocket className="w-5 h-5 group-hover:translate-y-[-2px] group-hover:translate-x-[2px] transition-transform" />}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
