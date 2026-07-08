import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { BusyBanner } from "@/components/BusyBanner";
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
  title: "Job Search Assistant",
  description: "Local control panel for the ai-job-search Claude Code workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
        <BusyBanner />
        <header className="border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
          <nav className="mx-auto flex max-w-4xl items-center gap-6 text-sm">
            <Link href="/" className="font-semibold">
              Job Search Assistant
            </Link>
            <Link href="/applications" className="text-neutral-500 hover:underline">
              Applications
            </Link>
            <Link href="/profile" className="text-neutral-500 hover:underline">
              Profile
            </Link>
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
