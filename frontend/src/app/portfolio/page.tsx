"use client";

import { Navbar } from "@/components/Navbar";
import { useAccount, useReadContract } from "wagmi";
import { Wallet, ListChecks, History } from "lucide-react";
import { MarketCard } from "@/components/MarketCard";
import { PREDICTION_MARKET_ABI, CONTRACT_ADDRESS } from "@/constants";

export default function Portfolio() {
    const { address, isConnected } = useAccount();

    const { data: marketCount } = useReadContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: PREDICTION_MARKET_ABI,
        functionName: "marketCount",
    });

    return (
        <main className="flex-1 overflow-y-auto">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/30 shadow-neon-blue/20">
                        <Wallet className="w-8 h-8 text-neon-blue" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">My Portfolio</h1>
                        <p className="text-white/40 font-mono text-sm">
                            {isConnected ? address : "Connect wallet to view your positions"}
                        </p>
                    </div>
                </div>


                {!isConnected ? (
                    <div className="glass-card p-20 text-center border-dashed border-2 border-white/10">
                        <h3 className="text-xl font-bold mb-2">Wallet Disconnected</h3>
                        <p className="text-white/40">Please connect your wallet to see your active bets and history.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-neon-cyan" /> My Positions
                            </h2>
                            <p className="text-xs text-white/40 mb-4">Tracking all your predictions on the network.</p>

                            <div className="flex flex-col gap-6">
                                {marketCount && Number(marketCount) > 0 ? (
                                    Array.from({ length: Number(marketCount) }).map((_, i) => (
                                        <MarketCard key={i} marketId={BigInt(i)} filterMode="myBets" />
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-white/20 italic">
                                        No markets found on the network.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-neon-purple" /> Resolution Center
                            </h2>
                            <div className="glass-card p-8 border border-white/5 bg-white/5 backdrop-blur-sm rounded-2xl">
                                <h4 className="text-sm font-bold mb-2">Automated Payouts</h4>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Your winnings are ready for claim as soon as the Chainlink Automation workflow resolves the market.
                                    Check the status of your positions on the left.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
