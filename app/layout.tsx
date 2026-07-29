import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { FavoritesProvider } from "@/lib/favoritesContext";
import { ThemeProvider } from "@/lib/themeContext";
import { Analytics } from "@vercel/analytics/next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AppFooter } from "@/components/AppFooter";

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
  title: {
    default: "AllergEats — Food Allergy Restaurant Finder & Menu Scanner",
    template: "%s | AllergEats",
  },
  description:
    "AllergEats scans restaurant menus for peanut, tree nut, gluten, dairy, egg, shellfish, soy, fish, and sesame allergies. Find allergy-safe restaurants near you and know what's safe before you order — free.",
  keywords: [
    "food allergy restaurant app",
    "allergy friendly restaurants near me",
    "restaurant menu allergen checker",
    "gluten free restaurants near me",
    "peanut allergy restaurants",
    "dairy free restaurants near me",
    "celiac restaurant finder",
    "food allergy menu scanner",
    "nut allergy eating out",
    "egg allergy restaurants",
    "shellfish allergy restaurant guide",
    "soy free restaurants",
    "sesame allergy restaurant",
    "top 9 allergens restaurant",
    "eating out with food allergies",
    "allergy mom restaurant app",
    "kids food allergy restaurant",
    "IBS FODMAP restaurant guide",
    "food sensitivity eating out",
    "anaphylaxis safe restaurant",
    "lactose intolerance restaurant",
    "wheat allergy restaurant",
    "restaurant cross contamination checker",
    "allergen filter restaurant",
    "safe food for multiple allergies",
  ],
  manifest: "/manifest.json",
  metadataBase: new URL("https://www.allergeats.com"),
  alternates: {
    canonical: "https://www.allergeats.com",
  },
  openGraph: {
    title: "AllergEats — Food Allergy Restaurant Finder & Menu Scanner",
    description:
      "Find nearby restaurants safe for your food allergies. Scan menus for peanut, gluten, dairy, egg, shellfish, soy, and more — instantly. Free.",
    url: "https://www.allergeats.com",
    siteName: "AllergEats",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AllergEats — Food Allergy Restaurant Finder & Menu Scanner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AllergEats — Food Allergy Restaurant Finder & Menu Scanner",
    description:
      "Find nearby restaurants safe for your food allergies. Scan menus for peanut, gluten, dairy, egg, shellfish, soy, and more — instantly. Free.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AllergEats",
    startupImage: [],
  },
  icons: {
    apple: "/icon-180.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

const safeJsonLd = (data: unknown) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AllergEats",
  "url": "https://www.allergeats.com",
  "description": "AllergEats is a free food allergy restaurant finder and menu scanner. Find restaurants safe for peanut, gluten, dairy, egg, shellfish, soy, tree nut, fish, and sesame allergies.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "@type": "EntryPoint", "urlTemplate": "https://www.allergeats.com/?q={search_term_string}" },
    "query-input": "required name=search_term_string",
  },
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AllergEats",
  "url": "https://www.allergeats.com",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android",
  "description": "Free food allergy restaurant finder and menu scanner. Set your allergen profile — peanut, gluten, dairy, egg, shellfish, soy, tree nuts, fish, sesame — and instantly see which nearby restaurants and menu items are safe for you.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "screenshot": "https://www.allergeats.com/og-image.png",
  "featureList": [
    "Restaurant discovery near your location",
    "Menu allergen scanning and scoring",
    "9 major FDA allergen support",
    "Cross-contamination detection",
    "Allergy profile management",
    "Safe, Ask Staff, and Avoid ratings per menu item",
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is AllergEats?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AllergEats is a free web app that helps people with food allergies find safe restaurants and scan menus for their specific allergens — including peanuts, tree nuts, gluten/wheat, dairy/milk, eggs, shellfish, fish, soy, and sesame (all 9 FDA major allergens).",
      },
    },
    {
      "@type": "Question",
      "name": "How does AllergEats detect allergens in restaurant menus?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AllergEats uses a multi-layer detection engine that scans menu item names and descriptions for direct allergen terms, ingredient synonyms (like 'casein' for dairy), dish patterns (Alfredo contains dairy, Caesar dressing contains egg), cooking methods, and cross-contamination warnings such as shared fryers or preparation surfaces. Every menu item is scored as Safe, Ask Staff, or Avoid based on your personal allergen profile.",
      },
    },
    {
      "@type": "Question",
      "name": "Is AllergEats free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, AllergEats is completely free to use. Set your allergen profile, find nearby restaurants, and see which menu items are safe for you — no subscription, no credit card required.",
      },
    },
    {
      "@type": "Question",
      "name": "Which food allergies does AllergEats support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AllergEats supports all 9 major FDA-recognized allergens: peanuts, tree nuts (almond, cashew, walnut, pecan, pistachio, etc.), milk and dairy, eggs, wheat and gluten, soy, fish, shellfish (shrimp, crab, lobster, etc.), and sesame. You can select any combination of allergens in your profile.",
      },
    },
    {
      "@type": "Question",
      "name": "Can parents use AllergEats to find safe restaurants for children with food allergies?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. AllergEats is designed for the whole family. Set your child's allergen profile and instantly see which local restaurants and menu items are safe for them. It works for kids with single allergies, multiple food allergies, and severe anaphylactic reactions — and flags cross-contamination risks that parents most need to know about.",
      },
    },
    {
      "@type": "Question",
      "name": "Does AllergEats work for celiac disease and gluten intolerance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. AllergEats detects wheat and gluten in menu items, including hidden sources like soy sauce, malt vinegar, barley, and spelt, and flags cross-contamination warnings from shared fryers or preparation surfaces. It works for both celiac disease and non-celiac gluten sensitivity (NCGS).",
      },
    },
    {
      "@type": "Question",
      "name": "What restaurants does AllergEats cover?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AllergEats finds restaurants near your current location and includes major chains such as McDonald's, Chipotle, Subway, Chick-fil-A, Wendy's, Burger King, and Taco Bell. You can also paste or upload any restaurant's menu text for instant allergen scanning.",
      },
    },
    {
      "@type": "Question",
      "name": "Does AllergEats help people with lactose intolerance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Select 'dairy' in your allergen profile and AllergEats will flag milk, cheese, butter, cream, yogurt, whey, casein, and other dairy derivatives across all menu items — helpful for both dairy allergies and lactose intolerance.",
      },
    },
    {
      "@type": "Question",
      "name": "Is there an AllergEats app for iPhone or Android?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AllergEats is a Progressive Web App (PWA) that works on any device including iPhone and Android. Visit allergeats.com in your mobile browser and add it to your home screen for an app-like experience — no download from the App Store required.",
      },
    },
  ],
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AllergEats",
  "url": "https://www.allergeats.com",
  "description": "AllergEats makes eating out with food allergies safer and easier for everyone — from peanut allergy parents to celiac adults to people with multiple food sensitivities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Service worker registration */}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});})}` }} />
        {/* Blocking theme script — runs before first paint to prevent light-mode flash on dark-mode devices */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var m=localStorage.getItem('alegeats_theme');var dark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark){var r=document.documentElement;r.style.setProperty('--c-bg','#0f0f0f');r.style.setProperty('--c-card','#1c1c1e');r.style.setProperty('--c-border','#2c2c2e');r.style.setProperty('--c-text','#f2f2f7');r.style.setProperty('--c-sub','#8e8e93');r.style.setProperty('--c-input','#252528');r.style.setProperty('--c-muted','#2c2c2e');r.style.setProperty('--c-hdr','rgba(15,15,15,0.95)');r.style.setProperty('--c-risk-safe','#34d399');r.style.setProperty('--c-risk-ask','#fbbf24');r.style.setProperty('--c-risk-avoid','#f87171');r.style.setProperty('--c-brand','#29d5e8');r.style.setProperty('--c-brand-fg','#ffffff');r.style.setProperty('--c-brand-bg','rgba(41,213,232,0.12)');r.style.setProperty('--bn-circle-bg','#000000');r.style.setProperty('--bn-icon','#e5e7eb');r.style.setProperty('--bn-pill-bg','#000000');r.style.setProperty('--bn-pill-text','#6b7280');r.style.setProperty('--bn-bar-bg','transparent');r.style.setProperty('--bn-fade-start','rgba(0,0,0,0)');r.style.setProperty('--bn-fade-s1','rgba(0,0,0,0.03)');r.style.setProperty('--bn-fade-s2','rgba(0,0,0,0.09)');r.style.setProperty('--bn-fade-s3','rgba(0,0,0,0.20)');r.style.setProperty('--bn-fade-s4','rgba(0,0,0,0.38)');r.style.setProperty('--bn-fade-s5','rgba(0,0,0,0.60)');r.style.setProperty('--bn-fade-s6','rgba(0,0,0,0.80)');r.style.setProperty('--bn-fade-s7','rgba(0,0,0,0.93)');r.style.setProperty('--bn-fade-end','rgba(0,0,0,1)');}}catch(e){}})()`}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(appJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <ErrorBoundary>
                <OfflineBanner />
                {children}
                <AppFooter />
              </ErrorBoundary>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
