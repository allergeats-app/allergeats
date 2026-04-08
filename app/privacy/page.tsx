import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AllergEats",
  description: "How AllergEats collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "April 7, 2026";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--c-hdr)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--c-border)",
        paddingTop: "max(12px, calc(12px + env(safe-area-inset-top)))",
        paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none", flexShrink: 0 }}>← Home</Link>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>Privacy Policy</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", paddingBottom: "max(48px, calc(32px + env(safe-area-inset-bottom)))" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--c-text)", marginBottom: 6 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 32 }}>Effective date: {EFFECTIVE_DATE}</p>

        <Section title="1. Overview">
          AllergEats (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates allergeats.com. This Privacy Policy explains what information we collect, how we use it, and the choices you have. AllergEats is a decision-support tool — not a medical service. Always confirm allergen information with restaurant staff before ordering.
        </Section>

        <Section title="2. Information We Collect">
          <SubHead>Account information</SubHead>
          When you create an account, we collect your email address and, optionally, your first and last name. If you sign in with Google, we receive your name and email from Google.

          <SubHead>Allergen profile</SubHead>
          The allergens you select are stored locally on your device and, if you are signed in, synced to our secure database so your profile is available across devices.

          <SubHead>Saved scans and orders</SubHead>
          Menu scans you save and orders you save are stored locally on your device and, if you are signed in, associated with your account.

          <SubHead>Usage data</SubHead>
          We use Vercel Analytics to collect anonymized, aggregated data about page views and navigation. No personal identifiers are included.

          <SubHead>Location</SubHead>
          If you grant location permission, we use your device&apos;s GPS coordinates solely to show nearby restaurants. We do not store your precise location on our servers.
        </Section>

        <Section title="3. How We Use Your Information">
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>To provide and personalize the AllergEats service</li>
            <li>To sync your allergen profile and saved data across devices</li>
            <li>To send transactional emails (account confirmation, password reset)</li>
            <li>To improve the service through aggregated, anonymized analytics</li>
          </ul>
          We do not sell your personal information to third parties. We do not use your allergen data for advertising.
        </Section>

        <Section title="4. Data Storage and Security">
          User accounts and synced data are stored using Supabase, which is hosted on AWS infrastructure with encryption at rest and in transit. We use industry-standard security practices, but no system is completely secure — please use a strong, unique password.
        </Section>

        <Section title="5. Third-Party Services">
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><strong>Supabase</strong> — authentication and database</li>
            <li><strong>Google OAuth</strong> — optional sign-in</li>
            <li><strong>Vercel Analytics</strong> — anonymized usage analytics</li>
            <li><strong>OpenStreetMap / Overpass API</strong> — restaurant location data</li>
          </ul>
          Each third party has its own privacy policy. We encourage you to review them.
        </Section>

        <Section title="6. Data Retention">
          We retain your account data for as long as your account is active. You may delete your account at any time by contacting us (see Section 9). Upon deletion, your personal data is removed within 30 days, except where retention is required by law.
        </Section>

        <Section title="7. Children's Privacy">
          AllergEats is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, please contact us and we will delete it promptly.
        </Section>

        <Section title="8. Your Rights">
          Depending on your location, you may have the right to access, correct, or delete your personal data, or to object to or restrict certain processing. To exercise these rights, contact us at the address below. We will respond within 30 days.
        </Section>

        <Section title="9. Contact Us">
          If you have questions about this Privacy Policy or your data:
          <br /><br />
          <strong>AllergEats</strong><br />
          Email: <a href="mailto:privacy@allergeats.com" style={{ color: "#eb1700" }}>privacy@allergeats.com</a>
        </Section>

        <Section title="10. Changes to This Policy">
          We may update this policy from time to time. When we do, we will update the effective date at the top of this page. Continued use of AllergEats after changes constitutes acceptance of the updated policy.
        </Section>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--c-border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/terms" style={{ fontSize: 13, color: "#eb1700", fontWeight: 600, textDecoration: "none" }}>Terms of Service</Link>
          <Link href="/" style={{ fontSize: 13, color: "var(--c-sub)", fontWeight: 600, textDecoration: "none" }}>← Back to AllergEats</Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 10 }}>{title}</h2>
      <div style={{ fontSize: 14, color: "var(--c-sub)", lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 700, color: "var(--c-text)", marginTop: 14, marginBottom: 4 }}>{children}</div>;
}