import { motion } from "framer-motion";
import { Terminal, Activity, BrainCircuit, ShieldCheck, Cpu } from "lucide-react";
import { useEffect, useState } from "react";

interface LogEntry {
    id: string;
    timestamp: string;
    message: string;
    type: "info" | "success" | "warn" | "ai" | "node";
}

const SIMULATED_WORKFLOW = [
    { message: "Initializing Chainlink CRE Runtime...", type: "info", delay: 1000 },
    { message: "Connecting to Ethereum Sepolia RPC node...", type: "node", delay: 2500 },
    { message: "[AUTOPULSE] System healthy. Connected to Network.", type: "success", delay: 4000 },
    { message: "[AUTOPULSE] Executing CRON trigger (*/5 * * * * *)", type: "info", delay: 8000 },
    { message: "Calling checkUpkeep() on Market Contract...", type: "node", delay: 9000 },
    { message: "⚠️ No markets require resolution. Idle.", type: "warn", delay: 11000 },
    { message: "Waiting for next epoch...", type: "info", delay: 13000 },
    { message: "[AUTOPULSE] Executing CRON trigger (*/5 * * * * *)", type: "info", delay: 20000 },
    { message: "Calling checkUpkeep() on Market Contract...", type: "node", delay: 21000 },
    { message: "🎯 Market #1 Expiration Detected. Upkeep Needed.", type: "success", delay: 22000 },
    { message: "Fetching On-Chain Market Parameters...", type: "node", delay: 23000 },
    { message: "[DATA] Querying external API (CoinGecko) for ETH metrics...", type: "info", delay: 24500 },
    { message: "Found: $2,845.20 | Vol: $12B | 24h: +3.2%", type: "success", delay: 26000 },
    { message: "[AI] Assembling context prompt for Gemini LLM...", type: "ai", delay: 27000 },
    { message: "[AI] Contacting Sentiment Engine...", type: "ai", delay: 28000 },
    { message: "[AI] ✓ Sentiment: 72% | Strong bullish momentum detected...", type: "success", delay: 31000 },
    { message: "Assembling performUpkeep Payload...", type: "node", delay: 31500 },
    { message: "[ORACLE] Broadcasting resolution transaction to Sepolia...", type: "info", delay: 32500 },
    { message: "[SUCCESS] ✅ AI resolution recorded. TX Confirmed.", type: "success", delay: 36000 }
];

export function TerminalFeed() {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const timeoutIds: NodeJS.Timeout[] = [];

        // Simulate the incoming logs over time
        SIMULATED_WORKFLOW.forEach((step, index) => {
            const timeoutId = setTimeout(() => {
                setLogs(prev => {
                    const newLogs = [...prev, {
                        id: `log-${index}`,
                        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        message: step.message,
                        type: step.type as "info" | "success" | "warn" | "ai" | "node"
                    }];

                    // Keep only newest 10 logs
                    if (newLogs.length > 10) return newLogs.slice(newLogs.length - 10);
                    return newLogs;
                });
            }, step.delay);
            timeoutIds.push(timeoutId);
        });

        return () => timeoutIds.forEach(clearTimeout);
    }, []);

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'success': return <ShieldCheck className="w-3 h-3 text-neon-cyan mt-1 flex-shrink-0" />;
            case 'warn': return <Activity className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />;
            case 'ai': return <BrainCircuit className="w-3 h-3 text-neon-purple mt-1 flex-shrink-0" />;
            case 'node': return <Cpu className="w-3 h-3 text-white/50 mt-1 flex-shrink-0" />;
            default: return <span className="text-neon-blue mt-0.5">›</span>;
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-neon-cyan';
            case 'warn': return 'text-yellow-500';
            case 'ai': return 'text-neon-purple font-semibold';
            case 'node': return 'text-white/60';
            default: return 'text-white/80';
        }
    };

    return (
        <div className="glass-card border-white/10 flex flex-col h-[400px] overflow-hidden ml-4 sticky top-24">
            {/* Terminal Header */}
            <div className="bg-black/40 border-b border-white/10 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-neon-blue" />
                    <span className="text-xs font-mono font-bold tracking-wider text-white/80">CRE.WORKFLOW_MONITOR</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 bg-black/60 font-mono text-[11px] sm:text-xs overflow-y-auto flex flex-col justify-end">
                <div className="space-y-2">
                    {logs.map((log) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-3 leading-relaxed"
                        >
                            <span className="text-white/30 flex-shrink-0">[{log.timestamp}]</span>
                            {getLogIcon(log.type)}
                            <span className={`${getLogColor(log.type)} flex-1`}>
                                {log.message}
                            </span>
                        </motion.div>
                    ))}

                    {/* Active cursor blinking */}
                    <motion.div
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="flex gap-3 mt-2"
                    >
                        <span className="text-white/30">[{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                        <span className="w-2 h-4 bg-neon-blue mt-0.5 inline-block shadow-neon-blue" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
