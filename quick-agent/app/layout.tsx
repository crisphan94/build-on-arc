import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Agent Builder | Arc Network",
  description:
    "Build and deploy AI Agents on Arc Network testnet. Frontend-first approach with minimal smart contracts.",
  keywords: ["AI Agent", "Arc Network", "Web3", "Blockchain", "USDC"],
  authors: [{ name: "crisphan94" }],
  openGraph: {
    title: "AI Agent Builder | Arc Network",
    description: "Build and deploy AI Agents on Arc Network testnet",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-50 font-inter">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
