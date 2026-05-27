import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | AllergEats",
  description: "Sign in or create an account to save your allergen profile and access AllergEats on any device.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
