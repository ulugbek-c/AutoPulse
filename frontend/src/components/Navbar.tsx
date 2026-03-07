"use client";

import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { Activity } from "lucide-react";

export function Navbar() {
    return (
        <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Activity className="w-8 h-8 text-neon-blue animate-pulse" />
                        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">
                            AutoPulse
                        </span>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8">
                            <Link href="/" className="nav-item">Markets</Link>
                            <Link href="/create" className="nav-item">Create Market</Link>
                            <Link href="/portfolio" className="nav-item">My Portfolio</Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ConnectKitButton />
                    </div>
                </div>
            </div>
        </nav>
    );
}
