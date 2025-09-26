import { Manrope, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./styles/main.css";

const description =
  "Full-stack performance studio that blends AI, automation, and award-winning creative to scale paid media without burning cash.";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-manrope",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "300 Kings — Quantum Growth Campaigns",
  description,
  openGraph: {
    title: "300 Kings — Quantum Growth Campaigns",
    description,
    url: "https://kevinc93.netlify.app/",
    siteName: "300 Kings",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "300 Kings — Quantum Growth Campaigns",
    description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`no-js ${manrope.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
