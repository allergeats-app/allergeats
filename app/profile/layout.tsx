import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account | AllergEats",
  description: "Manage your allergen profile, account settings, and appearance preferences.",
  robots: { index: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
