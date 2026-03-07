"use client";

import { Navbar } from "@/components/Navbar";
import { MarketCard } from "@/components/MarketCard";
import { TerminalFeed } from "@/components/TerminalFeed";
import { usePredictionMarket } from "@/hooks/usePredictionMarket";
import { Zap, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";

type FilterTab = "all" | "active" | "pending" | "resolved" | "myBets";

export default function Home() {
  const { marketCount } = usePredictionMarket();
  const { address } = useAccount();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const markets = Array.from({ length: Number(marketCount || 0) }, (_, i) => BigInt(i));

  return (
    <main className="flex-1 overflow-y-auto pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 transition-transform hover:scale-105"
          >
            <Zap className="w-4 h-4 text-neon-blue" />
            <span className="text-xs font-semibold tracking-wider uppercase text-white/70">
              AutoPulse Mainnet Beta
            </span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            The Future of <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-neon-purple to-neon-cyan animate-gradient-x">
              Precision Betting
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            Predict asset prices with crystal-clear accuracy. Powered by Chainlink Data Feeds and fully automated market resolution.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 flex justify-center gap-4"
          >
            <Link href="/create" className="btn-primary flex items-center gap-2 no-underline">
              <PlusCircle className="w-5 h-5" /> Create New Market
            </Link>
          </motion.div>
        </motion.section>

        {/* Markets Feed */}
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold">Markets</h2>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === "all"
                  ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/50"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                  }`}
              >
                ALL
              </button>
              <button
                onClick={() => setActiveFilter("active")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === "active"
                  ? "bg-green-500/20 text-green-400 border border-green-500/50"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                  }`}
              >
                ACTIVE
              </button>
              <button
                onClick={() => setActiveFilter("pending")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === "pending"
                  ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                  }`}
              >
                PENDING
              </button>
              <button
                onClick={() => setActiveFilter("resolved")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === "resolved"
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                  }`}
              >
                RESOLVED
              </button>
              {address && (
                <button
                  onClick={() => setActiveFilter("myBets")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeFilter === "myBets"
                    ? "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                    }`}
                >
                  MY BETS
                </button>
              )}
            </div>
          </div>

          {markets.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed border-2 border-white/10">
              <p className="text-white/40 mb-4">No markets found. Be the first to create one!</p>
              <Link href="/create" className="text-neon-blue hover:underline font-bold transition-all">
                Initialize Market #0 →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {markets.map((id) => (
                  <motion.div
                    key={id.toString()}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 }
                    }}
                  >
                    <MarketCard
                      marketId={id}
                      filterMode={activeFilter}
                      userAddress={address}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Terminal Feed Sidebar */}
              <div className="hidden lg:block w-[400px]">
                <TerminalFeed />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
