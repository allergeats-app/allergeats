import type { Metadata } from "next";
import { LandingPage } from "./LandingPage";

export const metadata: Metadata = {
  title: "AllergEats — Eat Out Without Fear",
  description:
    "Know what's safe to order before you sit down. AllergEats scans menus for your allergies and shows you restaurants near you with color-coded safety ratings. Free, no account needed.",
};

export default function TryPage() {
  return <LandingPage />;
}
