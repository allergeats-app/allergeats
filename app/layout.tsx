import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { FavoritesProvider } from "@/lib/favoritesContext";
import { ThemeProvider } from "@/lib/themeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AllergEats — Eat safely with food allergies",
  description: "Find restaurants and menu items safe for your food allergies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
            {children}
            <footer style={{
              textAlign: "center",
              padding: "16px 20px 24px",
              fontSize: 11,
              color: "var(--c-sub)",
              lineHeight: 1.6,
            }}>
              Always confirm with staff before ordering. AllergEats is a decision-support tool, not medical advice.
            </footer>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
