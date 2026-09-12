import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AiChatBox } from "@/components/ai-chat-box";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PawMarket — Multi-vendor pet marketplace",
  description: "Food, toys, habitats, and live pets from independent shops in one checkout.",
  openGraph: {
    title: "PawMarket",
    description: "Shop pet products from independent stores in one checkout.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "PawMarket" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AiChatBox />
      </body>
    </html>
  );
}
