import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scan History — AllergEats",
  description: "Your saved menu scans and past restaurant visits, with allergen results stored on this device.",
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
