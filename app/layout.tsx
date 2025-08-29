import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskForge AI - Forge Smarter Tasks with AI",
  description: "AI-powered task management app with intelligent enhancement, multi-platform integration (Telegram, WhatsApp), and seamless automation workflows.",
  keywords: "task management, AI, productivity, automation, n8n, telegram, whatsapp, todo app",
  authors: [{ name: "TaskForge Team" }],
  openGraph: {
    title: "TaskForge AI - Forge Smarter Tasks",
    description: "Transform your productivity with AI-enhanced task management",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskForge AI - Forge Smarter Tasks",
    description: "AI-powered task management with multi-platform integration",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
