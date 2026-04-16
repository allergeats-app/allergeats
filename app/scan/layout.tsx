import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan a Menu — AllergEats",
  description: "Point your camera at any restaurant menu for instant allergen detection across all major food allergies.",
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
