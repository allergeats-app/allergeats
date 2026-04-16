import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Allergens — AllergEats",
  description: "Set and manage the food allergens you need to avoid. AllergEats uses your profile to flag unsafe menu items.",
};

export default function AllergiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}