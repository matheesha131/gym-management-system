import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitPulse — Gym Management & Member Portal",
  description: "Next-generation gym access verification, counter payments, class bookings, and member self-service.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="bg-[#08090C] text-[#F3F4F6] font-sans antialiased min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 bg-emerald-500 text-black px-4 py-2 rounded-lg font-bold shadow-lg"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

