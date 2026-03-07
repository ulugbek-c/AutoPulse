import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { GlowingBackground } from "@/components/GlowingBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoPulse | Automated Prediction Markets",
  description: "Next-gen prediction markets powered by Chainlink",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <GlowingBackground />
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
