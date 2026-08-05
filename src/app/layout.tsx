import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothTransitionInitializer } from "@/components/SmoothTransitionInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VGADream - GPU & PC Case Clearance Compatibility Calculator",
  description: "Kalkulator presisi kecocokan ukuran GPU/VGA dan PC Case untuk PC Builders. Cek clearance panjang mm, tinggi, slot thickness, dan tekukan kabel 16-pin (12VHPWR) secara real-time.",
  keywords: ["GPU Clearance", "PC Case Compatibility", "ITX SFF GPU Fit", "16-pin 12VHPWR Cable Clearance", "PC Building Tools", "RTX 4090 Size Check"],
  icons: {
    icon: [
      { url: '/vga-card.png', type: 'image/png' },
    ],
    shortcut: '/vga-card.png',
    apple: '/vga-card.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
        <SmoothTransitionInitializer />
        {children}
      </body>
    </html>
  );
}
