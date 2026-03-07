"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { useEffect, useState } from "react";

// Generate realistic looking simulated data based on target
const generateData = (seed: number, isBullish: boolean) => {
    let currentPos = seed;
    return Array.from({ length: 20 }).map((_, i) => {
        // Random walk with drift
        const drift = isBullish ? 2 : -2;
        const volatility = 5;
        currentPos = currentPos + drift + (Math.random() - 0.5) * volatility;
        return { value: currentPos, index: i };
    });
};

interface TrendChartProps {
    color?: string;
    isBullish?: boolean;
}

export function TrendChart({ color = "#00f3ff", isBullish = true }: TrendChartProps) {
    const [data, setData] = useState<{ value: number, index: number }[]>([]);

    useEffect(() => {
        // Generate static but random-looking data based on time so it doesn't flicker wildly but looks alive
        setData(generateData(100, isBullish));
    }, [isBullish]);

    return (
        <div className="h-[60px] w-full mt-2 -mb-2 opacity-60">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        animationDuration={2000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
