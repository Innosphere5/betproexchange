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

// 🔥 SEO OPTIMIZED METADATA
export const metadata = {
  title: "Live Cricket Score & Betting Exchange | IPL, PSL, International Matches",
  description:
    "Get real-time cricket live scores, IPL live matches, Pakistan cricket updates, and betting exchange odds. Fast updates every 20 seconds with accurate match data.",

  keywords: [
    "live cricket score",
    "IPL live score",
    "Pakistan cricket match live",
    "cricket betting exchange",
    "real time cricket score",
    "cricket odds live",
    "betting cricket app",
  ],

  metadataBase: new URL("https://betproexchange.site"),

  openGraph: {
    title: "Live Cricket Score & Betting Exchange",
    description:
      "Track IPL, PSL, and international cricket matches with real-time live scores and betting odds.",
    url: "https://betproexchange.site",
    siteName: "BetProExchange",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Live Cricket Score & Betting Exchange",
    description:
      "Live IPL, PSL, and international cricket scores with real-time betting odds.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}