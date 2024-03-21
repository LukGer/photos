import { Analytics } from "@vercel/analytics/react";
import { Nunito } from "next/font/google";
import "./index.css";

const nunito = Nunito({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={nunito.className + " flex h-screen flex-col"}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
