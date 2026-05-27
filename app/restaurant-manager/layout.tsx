import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Restaurant Manager | AllergEats",
  description: "Add and manage restaurant data using AI-powered menu ingestion.",
  robots: { index: false, follow: false },
};

export default function RestaurantManagerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
