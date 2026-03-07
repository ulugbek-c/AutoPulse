"use client";

import { WagmiProvider, createConfig, http, createStorage } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { ReactNode, useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

const config = createConfig(
    getDefaultConfig({
        // WalletConnect Project ID - required for WalletConnect v2
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "dd926958638363637383838383838383",
        appName: "AutoPulse Prediction Markets",
        appDescription: "Decentralized prediction markets powered by Chainlink Data Feeds",
        appUrl: typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000",
        appIcon: typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : "http://localhost:3000/icon.png",
        chains: [sepolia],
        transports: {
            [sepolia.id]: http(undefined, {
                timeout: 30_000, // 30 second timeout
                retryCount: 3,
                retryDelay: 100,
            }),
        },
        storage: createStorage({
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        }),
    })
);

function ErrorBoundaryWrapper() {
    useEffect(() => {
        // Handle wallet connection errors
        const handleError = (error: ErrorEvent) => {
            const message = error.message?.toLowerCase() || '';

            if (message.includes('eip1193') || message.includes('timeout') || message.includes('connection')) {
                // Silently ignore wallet connection errors as they're expected during wallet switching
                error.preventDefault();
            } else if (message.includes('family accounts') || message.includes('familyaccounts')) {
                // Ignore Aave specific errors
                error.preventDefault();
            }
        };

        window.addEventListener('error', handleError as EventListener);
        return () => window.removeEventListener('error', handleError as EventListener);
    }, []);

    return null;
}

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 3,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                staleTime: 5000,
            },
        },
    }));

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider mode="dark">
                    <ErrorBoundaryWrapper />
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            style: {
                                background: '#0a0a0c',
                                color: '#fff',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                            },
                        }}
                    />
                    {children}
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
