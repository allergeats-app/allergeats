import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Restaurants | AllergEats",
  description: "Your saved restaurants and past orders — quickly revisit places that are safe for your allergies.",
  robots: { index: false },
};

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
