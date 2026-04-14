import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AllergEats",
  description: "Terms and conditions for using the AllergEats service.",
};

const EFFECTIVE_DATE = "April 7, 2026";

export default function TermsPage() {
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
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>Terms of Service</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", paddingBottom: "max(48px, calc(32px + env(safe-area-inset-bottom)))" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--c-text)", marginBottom: 6 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 32 }}>Effective date: {EFFECTIVE_DATE}</p>

        {/* Medical disclaimer — prominent */}
        <div style={{
          background: "#fff1f0", border: "1.5px solid #fca5a5",
          borderRadius: 14, padding: "16px 18px", marginBottom: 32,
          fontSize: 14, color: "#b91c1c", lineHeight: 1.65,
        }}>
          <strong>Important health notice:</strong> AllergEats is a decision-support tool, not a medical service. Allergen information is provided for reference only and may be incomplete or out of date. Always confirm allergen information directly with restaurant staff before ordering. AllergEats is not a substitute for professional medical advice.
        </div>

        <Section title="1. Acceptance of Terms">
          By accessing or using AllergEats (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We may update these terms from time to time; continued use after changes constitutes acceptance.
        </Section>

        <Section title="2. Description of Service">
          AllergEats is a web application that helps users with food allergies identify potentially safe menu items at restaurants. The Service provides allergen information sourced from publicly available restaurant data, user-contributed data, and automated analysis. This information is provided for general informational purposes only.
        </Section>

        <Section title="3. No Medical Advice">
          <strong>AllergEats is not a medical service.</strong> The Service does not provide medical advice, diagnosis, or treatment recommendations. The allergen information displayed:
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            <li>May be incomplete, inaccurate, or out of date</li>
            <li>Does not account for cross-contamination risks</li>
            <li>Does not account for ingredient substitutions or regional variations</li>
            <li>Should not be used as the sole basis for any dining decision</li>
          </ul>
          Always consult your physician or allergist for medical guidance. Always verify allergen information directly with restaurant staff before ordering.
        </Section>

        <Section title="4. Limitation of Liability">
          To the fullest extent permitted by applicable law, AllergEats and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to allergic reactions, injury, or illness resulting from reliance on information provided by the Service. Your use of the Service is at your own risk.
        </Section>

        <Section title="5. User Accounts">
          You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate information when creating your account and to notify us promptly of any unauthorized use.
        </Section>

        <Section title="6. Acceptable Use">
          You agree not to:
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, scrape, or abuse the Service or its APIs</li>
            <li>Submit false or misleading information</li>
            <li>Interfere with the security or integrity of the Service</li>
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          The AllergEats name, logo, and original content are owned by AllergEats and protected by applicable intellectual property laws. Restaurant names, logos, and menu data are the property of their respective owners and are referenced for informational purposes under fair use.
        </Section>

        <Section title="8. Third-Party Content">
          The Service may display information sourced from third parties (restaurant websites, public databases). We do not warrant the accuracy, completeness, or timeliness of third-party content. Links to third-party sites are provided for convenience and do not constitute endorsement.
        </Section>

        <Section title="9. Disclaimer of Warranties">
          The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
        </Section>

        <Section title="10. Governing Law">
          These Terms shall be governed by the laws of the United States, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the Service shall be resolved in accordance with applicable law.
        </Section>

        <Section title="11. Contact">
          Questions about these Terms? Contact us at:{" "}
          <a href="mailto:legal@allergeats.com" style={{ color: "#1fbdcc" }}>legal@allergeats.com</a>
        </Section>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--c-border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ fontSize: 13, color: "#1fbdcc", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</Link>
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