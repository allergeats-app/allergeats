import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu Scan | AllergEats",
  description: "Upload a menu photo or paste a URL to instantly analyze any restaurant's menu for your allergens.",
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
