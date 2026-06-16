import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "ThinkStep — Belajar Bersama Lumina AI",
  description: "Platform belajar berbasis AI yang memandu siswa berpikir analitis dan mandiri. Sesuai regulasi SKB 7 Menteri 2026 tentang penggunaan AI dalam pendidikan.",
  keywords: ["belajar", "AI", "Lumina AI", "pendidikan", "kurikulum merdeka", "minimalist"],
  authors: [{ name: "Tim ThinkStep" }],
  openGraph: {
    title: "ThinkStep — Lumina AI Tutor",
    description: "Bukan AI yang menjawab — tapi AI yang membuat kamu mampu menjawab.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3B82F6" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
