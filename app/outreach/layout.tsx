import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PR Manager | AllergEats",
  description: "AI-powered PR & outreach manager for AllergEats.",
  robots: { index: false, follow: false },
};

export default function OutreachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
