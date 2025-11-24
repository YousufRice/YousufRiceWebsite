import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MetaPixel } from "@/components/meta-pixel";
import FloatingChatbox from "@/components/floating-chatbox";
import { PWAInstall } from "@/components/PWAInstall";
import "./globals.css";
import AnnocementBar from "@/components/annoucement-bar";
import { Suspense } from "react";
// Transition components removed

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Support multiple domains - uses primary domain for metadata
const primaryDomain =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || "https://yourdomain.com";

// Validate URL format - if invalid, use fallback
let metadataBaseUrl: URL;
try {
  metadataBaseUrl = new URL(primaryDomain);
} catch {
  console.warn(
    `Invalid NEXT_PUBLIC_PRIMARY_DOMAIN: "${primaryDomain}". Using fallback.`
  );
  metadataBaseUrl = new URL("https://yourdomain.com");
}

export const metadata: Metadata = {
  metadataBase: new URL("https://yousufrice.com"),
  alternates: {
    canonical: "/",
  },
  title: {
    default:
      "Yousuf Rice - Premium Quality Rice With Free Delivery | Best Prices in Pakistan",
    template: "%s | Yousuf Rice",
  },
  description:
    "Order premium quality basmati and sella rice online with discounts, free delivery, and cash on delivery. Every Grain XXXL, Steam Rice, Sella Rice, and Bachat varieties available.",
  keywords: [
    "rice delivery",
    "basmati rice",
    "sella rice",
    "steam rice",
    "premium rice Pakistan",
    "buy rice online",
    "rice home delivery",
    "Yousuf Rice",
    "Every Grain rice",
    "bulk rice order",
    "cash on delivery rice",
  ],
  authors: [{ name: "Yousuf Rice" }],
  creator: "Yousuf Rice",
  publisher: "Yousuf Rice",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: primaryDomain,
    siteName: "Yousuf Rice",
    title: "Yousuf Rice - Premium Quality Rice Delivery",
    description:
      "Order premium quality rice online with With Discounts, free delivery, and cash on delivery. Best prices in Pakistan.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Yousuf Rice - Premium Quality Rice Delivery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yousuf Rice - Premium Quality Rice Delivery",
    description:
      "Order premium quality rice online with tier-based pricing and free delivery",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <MetaPixel />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Transitions removed */}

        {/* Wrap dynamic components in Suspense for PPR */}
        <Suspense fallback={null}>
          <AnnocementBar />
        </Suspense>
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="min-h-screen bg-white">
          {/* Children already have their own Suspense boundaries */}
          {children}
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
        <Suspense fallback={null}>
          <Toaster position="top-right" />
        </Suspense>
        <Suspense fallback={null}>
          <FloatingChatbox />
        </Suspense>
        <Suspense fallback={null}>
          <PWAInstall />
        </Suspense>
      </body>
    </html>
  );
}
