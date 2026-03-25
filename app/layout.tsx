import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from "@/lib/authContext";
import { FavoritesProvider } from "@/lib/favoritesContext";
import { ThemeProvider } from "@/lib/themeContext";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
};

export const metadata: Metadata = {
  title: "AllergEats — Eat safely with food allergies",
  description: "Find restaurants and menu items safe for your food allergies.",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type":    "WebSite",
  "name":     "AllergEats",
  "url":      "https://www.allergeats.com",
  "description": "Find restaurants and menu items safe for your food allergies.",
  "potentialAction": {
    "@type":       "SearchAction",
    "target":      "https://www.allergeats.com/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var m=localStorage.getItem('alegeats_theme');var dark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark){var r=document.documentElement;r.style.setProperty('--c-bg','#0f0f0f');r.style.setProperty('--c-card','#1c1c1e');r.style.setProperty('--c-border','#2c2c2e');r.style.setProperty('--c-text','#f2f2f7');r.style.setProperty('--c-sub','#8e8e93');r.style.setProperty('--c-input','#252528');r.style.setProperty('--c-muted','#2c2c2e');r.style.setProperty('--c-hdr','rgba(15,15,15,0.95)');}}catch(e){}})()`}} />
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
                {children}
                <footer style={{
                  textAlign: "center",
                  padding: `20px max(20px, env(safe-area-inset-right)) max(28px, calc(16px + env(safe-area-inset-bottom))) max(20px, env(safe-area-inset-left))`,
                  fontSize: 13,
                  color: "var(--c-sub)",
                  lineHeight: 1.6,
                }}>
                  Always confirm with staff before ordering.<br />AllergEats is a decision-support tool, not medical advice.
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
