import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — AllergEats",
  description: "Manage your AllergEats account, allergen profile, and app preferences.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
