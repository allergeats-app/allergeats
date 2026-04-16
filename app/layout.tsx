import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/lib/authContext";
import { FavoritesProvider } from "@/lib/favoritesContext";
import { ThemeProvider } from "@/lib/themeContext";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { OnboardingModal } from "@/components/OnboardingModal";
import { FeedbackButton } from "@/components/FeedbackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1fbdcc",
};

export const metadata: Metadata = {
  title: "AllergEats — Eat safely with food allergies",
  description: "Find restaurants and menu items safe for your food allergies.",
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.allergeats.com"),
  openGraph: {
    title: "AllergEats — Eat safely with food allergies",
    description: "Find nearby restaurants and scan menus instantly. Know what's safe before you order.",
    url: "https://www.allergeats.com",
    siteName: "AllergEats",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AllergEats — Eat safely with food allergies" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AllergEats — Eat safely with food allergies",
    description: "Find nearby restaurants and scan menus instantly. Know what's safe before you order.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AllergEats",
    startupImage: [],
  },
  icons: {
    apple: "/logo.png",
  },
};

const websiteJsonLd = {
  "@context":   "https://schema.org",
  "@type":      "WebSite",
  "name":       "AllergEats",
  "url":        "https://www.allergeats.com",
  "description": "Find restaurants and menu items safe for your food allergies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Blocking theme script — runs before first paint to prevent light-mode flash on dark-mode devices */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var m=localStorage.getItem('alegeats_theme');var dark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark){var r=document.documentElement;r.style.setProperty('--c-bg','#0f0f0f');r.style.setProperty('--c-card','#1c1c1e');r.style.setProperty('--c-border','#2c2c2e');r.style.setProperty('--c-text','#f2f2f7');r.style.setProperty('--c-sub','#8e8e93');r.style.setProperty('--c-input','#252528');r.style.setProperty('--c-muted','#2c2c2e');r.style.setProperty('--c-hdr','rgba(15,15,15,0.95)');r.style.setProperty('--c-risk-safe','#34d399');r.style.setProperty('--c-risk-ask','#fbbf24');r.style.setProperty('--c-risk-avoid','#f87171');r.style.setProperty('--c-brand','#29d5e8');r.style.setProperty('--c-brand-fg','#ffffff');r.style.setProperty('--c-brand-bg','rgba(41,213,232,0.12)');}}catch(e){}})()`}} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <ErrorBoundary>
                <OfflineBanner />
                <OnboardingModal />
                <FeedbackButton />
                {children}
                <footer style={{
                  textAlign: "center",
                  padding: `20px max(20px, env(safe-area-inset-right)) max(28px, calc(16px + env(safe-area-inset-bottom))) max(20px, env(safe-area-inset-left))`,
                  fontSize: 13,
                  color: "var(--c-sub)",
                  lineHeight: 1.6,
                }}>
                  <span style={{
                    display: "block",
                    fontSize: 18,
                    fontWeight: 900,
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    background: "linear-gradient(135deg, #b45309 0%, #ef4444 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    marginBottom: 4,
                  }}>Always confirm with staff before ordering.</span>
                  AllergEats is a decision-support tool, not medical advice.
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 20 }}>
                    <Link href="/privacy" style={{ color: "var(--c-sub)", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>
                    <Link href="/terms" style={{ color: "var(--c-sub)", textDecoration: "none", fontWeight: 600 }}>Terms of Service</Link>
                  </div>
                </footer>
              </ErrorBoundary>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
