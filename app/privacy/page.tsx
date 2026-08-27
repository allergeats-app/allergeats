import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AllergEats",
  description: "How AllergEats collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "August 26, 2026";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--c-hdr)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)",
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
          The allergens you select are stored locally on your device and, if you are signed in, synced to our secure database so your profile is available across devices. We treat allergen profile data as sensitive health-related information and do not use it for advertising, sell it, or share it with third parties except as necessary to operate the Service (e.g., syncing across your devices via Supabase).

          <SubHead>Terms and safety acceptance records</SubHead>
          When a signed-in user acknowledges our Terms of Service and safety notice, we store a record containing your user ID, the date and time of acceptance, the version of the Terms and safety notice you accepted, and your browser user-agent string. This record is used solely for legal compliance and is never shared with third parties.

          <SubHead>Saved scans and orders</SubHead>
          Menu scans you save and orders you save are stored locally on your device and, if you are signed in, associated with your account.

          <SubHead>Feedback and reports</SubHead>
          When you submit feedback or report incorrect allergen data, we store your message and your IP address. Your IP address is used solely for abuse prevention and is not shared with third parties or used for tracking.

          <SubHead>Menu scans</SubHead>
          When you use the AI-powered menu scan feature, menu text or photos are sent to Anthropic (Claude) for analysis. We do not attach your account identity or personal information to these requests.

          <SubHead>Payments</SubHead>
          If you subscribe to a paid tier, payment information (card number, billing details) is collected and processed directly by Stripe, Inc. AllergEats does not receive or store your full payment card number. We receive only a Stripe customer token and subscription status.

          <SubHead>Usage data</SubHead>
          We use Vercel Analytics to collect anonymized, aggregated data about page views and navigation. No personal identifiers are included.

          <SubHead>Location</SubHead>
          If you grant location permission, we use your device&apos;s GPS coordinates solely to show nearby restaurants. We do not store your precise location on our servers.
        </Section>

        <Section title="3. How We Use Your Information">
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>To provide and personalize the AllergEats service</li>
            <li>To sync your allergen profile and saved data across devices</li>
            <li>To maintain legally required records of your acceptance of our Terms and safety notice</li>
            <li>To process subscription payments through Stripe</li>
            <li>To send transactional emails (account confirmation, password reset, subscription receipts)</li>
            <li>To improve the service through aggregated, anonymized analytics</li>
            <li>To prevent fraud and abuse</li>
          </ul>
          We do <strong>not</strong> sell your personal information. We do not use your allergen data for advertising, profiling, or sale.
        </Section>

        <Section title="4. Data Storage and Security">
          User accounts and synced data are stored using Supabase, which is hosted on AWS infrastructure with encryption at rest and in transit. Payment processing is handled by Stripe. We use industry-standard security practices, but no system is completely secure — please use a strong, unique password.
        </Section>

        <Section title="5. Third-Party Services">
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><strong>Supabase</strong> — authentication and database</li>
            <li><strong>Google OAuth</strong> — optional sign-in</li>
            <li><strong>Stripe, Inc.</strong> — payment processing for paid subscriptions. Stripe receives payment card data directly; we receive only a token and subscription status. See <a href="https://stripe.com/privacy" style={{ color: "var(--c-brand)" }} target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.</li>
            <li><strong>Anthropic (Claude)</strong> — AI-powered menu scanning. Menu text/photos are processed by Claude. No personal account data is included in these requests.</li>
            <li><strong>Vercel Analytics</strong> — anonymized usage analytics</li>
            <li><strong>OpenStreetMap / Overpass API</strong> — restaurant location data</li>
            <li><strong>Google Places API</strong> — nearby restaurant discovery</li>
          </ul>
          Each third party has its own privacy policy. We encourage you to review them.
        </Section>

        <Section title="6. Data Retention">
          We retain your account data for as long as your account is active. You may delete your account at any time by contacting us (see Section 10). Upon deletion, your personal data is removed within 30 days, except where retention is required by law (e.g., financial records required by law to be retained longer). Acceptance records for our Terms and safety notice are retained as long as required for legal compliance purposes.
        </Section>

        <Section title="7. Children's Privacy">
          AllergEats is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, please contact us and we will delete it promptly.
        </Section>

        <Section title="8. Your Privacy Rights — General">
          Depending on your location, you may have rights regarding your personal data, including the right to access, correct, delete, or port your data, and the right to object to or restrict certain processing. To exercise any of these rights, contact us at <a href="mailto:hello-allergeats@gmail.com" style={{ color: "var(--c-brand)" }}>hello-allergeats@gmail.com</a>. We will respond within the timeframe required by applicable law (generally 30–45 days). See Sections 9, 10, and 11 for state- and region-specific rights.
        </Section>

        <Section title="9. California Residents — CCPA / CPRA Rights">
          If you are a California resident, the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA) gives you specific rights regarding your personal information.
          <br /><br />
          <SubHead>Categories of personal information we collect</SubHead>
          We collect the following categories of personal information, as defined by the CCPA: identifiers (name, email address, IP address); internet or other network activity (anonymized analytics, browser user-agent); geolocation data (approximate location, when you grant permission; not stored server-side); sensitive personal information (allergen/dietary profile, which relates to health); and inferences drawn from the above (your allergen risk profile).
          <br /><br />
          <SubHead>We do not sell or share your personal information</SubHead>
          AllergEats does not sell your personal information or share it for cross-context behavioral advertising as defined by the CCPA/CPRA.
          <br /><br />
          <SubHead>Your rights</SubHead>
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            <li><strong>Right to know.</strong> You may request that we disclose what personal information we have collected about you, the categories of sources, our business or commercial purpose for collecting it, the categories of third parties with whom we share it, and the specific pieces of personal information we hold.</li>
            <li><strong>Right to delete.</strong> You may request that we delete personal information we have collected from you, subject to certain exceptions (e.g., information necessary to complete a transaction or comply with a legal obligation).</li>
            <li><strong>Right to correct.</strong> You may request that we correct inaccurate personal information we maintain about you.</li>
            <li><strong>Right to limit use of sensitive personal information.</strong> You may direct us to limit our use of your sensitive personal information (your allergen profile) to what is necessary to provide the Service. We do not use it for any other purpose.</li>
            <li><strong>Right to non-discrimination.</strong> We will not discriminate against you for exercising any CCPA/CPRA rights.</li>
          </ul>
          <br />
          <SubHead>How to submit a request</SubHead>
          Email <a href="mailto:hello-allergeats@gmail.com" style={{ color: "var(--c-brand)" }}>hello-allergeats@gmail.com</a> with the subject line &quot;California Privacy Request.&quot; We will verify your identity before processing the request and respond within 45 days (extendable by an additional 45 days when reasonably necessary, with notice).
          <br /><br />
          <SubHead>Authorized agents</SubHead>
          You may designate an authorized agent to submit a request on your behalf. We will require written proof of authorization and may verify your identity directly.
        </Section>

        <Section title="10. Other U.S. State Privacy Rights">
          Residents of Virginia (CDPA), Colorado (CPA), Connecticut (CTDPA), Texas (TDPSA), and other states with applicable privacy laws may have rights similar to those described in Section 9, including rights to access, correct, delete, and port their personal data, and to opt out of the sale of personal data (we do not sell data) and targeted advertising (we do not engage in targeted advertising).
          <br /><br />
          To exercise these rights, email <a href="mailto:hello-allergeats@gmail.com" style={{ color: "var(--c-brand)" }}>hello-allergeats@gmail.com</a>. If you believe we have not responded appropriately to your request, you may have the right to appeal — contact us at the same address and we will review your request within the timeframe required by your state&apos;s law.
        </Section>

        <Section title="11. International Users">
          AllergEats is operated from the United States and is intended for users in the United States. If you access the Service from outside the United States — including from the European Economic Area (EEA), United Kingdom, or Switzerland — please be aware that your information may be transferred to, processed in, and stored in the United States, which may not provide the same level of data protection as your home country.
          <br /><br />
          If you are located in the EEA or UK, you may have rights under the General Data Protection Regulation (GDPR) or UK GDPR, including the right to access, rectify, erase, restrict, or object to processing of your personal data, and the right to data portability. Our legal bases for processing include contract performance (to provide the Service), legal obligation, and legitimate interests (security, abuse prevention, service improvement). To exercise your GDPR rights or lodge a complaint, contact us at <a href="mailto:hello-allergeats@gmail.com" style={{ color: "var(--c-brand)" }}>hello-allergeats@gmail.com</a>. You also have the right to lodge a complaint with your local data protection authority.
        </Section>

        <Section title="12. Contact Us">
          If you have questions about this Privacy Policy or your data:
          <br /><br />
          <strong>AllergEats</strong><br />
          Email: <a href="mailto:hello-allergeats@gmail.com" style={{ color: "var(--c-brand)" }}>hello-allergeats@gmail.com</a>
        </Section>

        <Section title="13. Changes to This Policy">
          We may update this policy from time to time. When we do, we will update the effective date at the top of this page. For material changes, we may notify you through the Service or by email. Continued use of AllergEats after changes constitutes acceptance of the updated policy.
        </Section>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--c-border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/terms" style={{ fontSize: 13, color: "var(--c-brand)", fontWeight: 600, textDecoration: "none" }}>Terms of Service</Link>
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
