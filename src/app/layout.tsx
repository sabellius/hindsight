import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getActiveAccountId } from "@/lib/auth";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hindsight — Trading Journal",
  description:
    "Personal day trading journal for analyzing trades and building a repeatable edge",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const allAccounts = await db.select().from(accounts);
  const activeAccountId = await getActiveAccountId();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <AppShell accounts={allAccounts} activeAccountId={activeAccountId}>{children}</AppShell>
      </body>
    </html>
  );
}
