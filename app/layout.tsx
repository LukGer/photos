import { Analytics } from "@vercel/analytics/react";
import { Geist_Mono } from "next/font/google";
import "./index.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} flex h-screen flex-col`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
