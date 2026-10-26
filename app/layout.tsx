import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rounded geometric display face to match the sprite's soft silhouette.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const TITLE = "Aayush Kumar · Full Stack AI Engineer";
const DESCRIPTION =
  "Full-stack AI engineer at LoglineAI. I build and own FilmOS, a film-production platform with 500 daily users, and the 14-agent pipeline behind LoglineOS.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  metadataBase: new URL("https://aayush-portfolio-flax.vercel.app"),
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
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
      // Dusk-garden dark theme, locked site-wide: the sprite glows best on moss.
      className={`dark ${geistSans.variable} ${geistMono.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-moss-950 text-moss-100">
        <TooltipProvider>{children}</TooltipProvider>
        <div aria-hidden className="grain" />
        <Analytics />
      </body>
    </html>
  );
}
