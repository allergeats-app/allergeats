import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AllergEats",
  description: "Terms and conditions for using the AllergEats food-allergy decision-support service.",
};

// Update this string whenever the Terms change materially.
// Bump the corresponding TERMS_VERSION in lib/legalVersions.ts at the same time.
const EFFECTIVE_DATE = "August 26, 2026";

export default function TermsPage() {
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
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>Terms of Service</span>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", paddingBottom: "max(48px, calc(32px + env(safe-area-inset-bottom)))" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--c-text)", marginBottom: 6 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 32 }}>Effective date: {EFFECTIVE_DATE}</p>

        {/* ── Prominent safety disclaimer ─────────────────────────────────── */}
        <div style={{
          background: "#fff1f0", border: "1.5px solid #fca5a5",
          borderRadius: 14, padding: "16px 18px", marginBottom: 32,
          fontSize: 14, color: "#b91c1c", lineHeight: 1.65,
        }}>
          <strong>IMPORTANT — PLEASE READ CAREFULLY.</strong> AllergEats is an informational, decision-support tool. It is NOT a medical service, healthcare provider, allergen-testing laboratory, or certification body. A &quot;Safe&quot; classification does NOT mean a food is allergen-free or safe for you to consume. Always confirm allergen information directly with restaurant staff before ordering. If you are experiencing a medical emergency or allergic reaction, call 911 or your local emergency services immediately.
        </div>

        <Section title="1. Who We Are and What AllergEats Is">
          AllergEats (&quot;AllergEats,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website and progressive web application available at allergeats.com (the &quot;Service&quot;). AllergEats is an informational, food-allergy decision-support tool that helps users identify potential allergens in restaurant menu items based on available data.
          <br /><br />
          AllergEats is <strong>NOT</strong> any of the following:
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            <li>A medical service, medical practice, or healthcare provider</li>
            <li>A source of medical advice, diagnosis, or treatment recommendations</li>
            <li>A restaurant, food manufacturer, food distributor, or food preparer</li>
            <li>An allergen-testing service or allergen-testing laboratory</li>
            <li>A certification body or certifier of allergen-free status</li>
            <li>A guarantee, warranty, or certification that any food is allergen-free or safe to consume</li>
          </ul>
        </Section>

        <Section title="2. Acceptance of Terms">
          By accessing or using the Service, you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our <Link href="/privacy" style={{ color: "var(--c-brand)" }}>Privacy Policy</Link> (including its state-specific and international privacy rights sections), which is incorporated by reference. If you do not agree, do not use the Service.
          <br /><br />
          We may update these Terms from time to time. When we make a material change, we will update the effective date and may require you to affirmatively acknowledge the updated Terms before continuing to use the Service. Your continued use after changes take effect constitutes acceptance of the updated Terms.
        </Section>

        <Section title="3. Eligibility">
          The Service is intended for users who are at least 13 years of age. By using the Service, you represent that you are at least 13 years old. If you are under 18, you represent that a parent or legal guardian has reviewed and agreed to these Terms on your behalf. We do not knowingly collect personal information from children under 13; if you believe a child under 13 has used the Service, please contact us.
        </Section>

        <Section title="4. Understanding Our Classifications — &quot;Safe,&quot; &quot;Ask,&quot; and &quot;Avoid&quot;">
          <strong>This section is critical. Please read it before relying on any classification displayed by AllergEats.</strong>
          <br /><br />
          AllergEats classifies menu items using three labels based on information available to the Service at the time of analysis. These labels have the following meanings and limitations:
          <ul style={{ paddingLeft: 20, lineHeight: 2.1, marginTop: 8 }}>
            <li>
              <strong>&quot;Safe&quot; (or &quot;Likely Safe&quot;):</strong> AllergEats did not identify your selected allergen(s) in the item based on the information available. &quot;Safe&quot; does <strong>NOT</strong> mean, represent, warrant, certify, or guarantee that the item is allergen-free or that it is safe for you or any particular person to consume. It means only that AllergEats&apos; analysis did not detect your allergen based on available data.
            </li>
            <li>
              <strong>&quot;Ask&quot; (or &quot;Ask Staff&quot;):</strong> Available information is uncertain, incomplete, or requires confirmation. You should speak directly with restaurant staff before ordering this item.
            </li>
            <li>
              <strong>&quot;Avoid&quot;:</strong> Available information suggests the item may contain or involve your selected allergen(s). This classification does not guarantee the allergen is present — it is based on available data only.
            </li>
          </ul>
          All classifications are informational only. They are not guarantees of allergen safety. You must independently verify all allergen information directly with restaurant staff before consuming any food.
        </Section>

        <Section title="5. Food Allergy Risks and Limitations of Our Service">
          Restaurant food may involve risks that are entirely outside AllergEats&apos; knowledge or control, including but not limited to:
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            <li>Cross-contact and cross-contamination from shared fryers, cooking surfaces, utensils, or equipment</li>
            <li>Ingredient substitutions made by individual locations</li>
            <li>Recipe changes, reformulations, or supplier changes</li>
            <li>Regional and location-specific differences in ingredients or preparation</li>
            <li>Seasonal or limited-time menu changes</li>
            <li>Preparation errors or employee mistakes</li>
            <li>Inaccurate or incomplete disclosures by the restaurant</li>
            <li>Outdated menus or ingredient information in our database</li>
            <li>Unlabeled or undisclosed ingredients</li>
            <li>Trace amounts of allergens from manufacturing or supplier practices</li>
          </ul>
          You remain solely responsible for communicating your allergies and dietary restrictions directly to restaurant staff and for making your own decision about whether to consume a food.
        </Section>

        <Section title="6. Automated Analysis and Artificial Intelligence">
          AllergEats may use automated systems, algorithms, artificial intelligence, database matching, natural-language processing, or similar technologies to analyze and classify menu information. These systems are designed to assist users but are not perfect. They can make mistakes, miss allergens, or produce incorrect classifications.
          <br /><br />
          Automated classifications must not be treated as guarantees of allergen safety. All results must be independently verified with restaurant staff before you rely on them.
        </Section>

        <Section title="7. Third-Party Information">
          AllergEats may obtain menu, ingredient, and allergen information from restaurant websites, restaurant menus, public databases, third-party APIs, data aggregators, user submissions, and other sources. AllergEats does not control these sources and cannot guarantee their accuracy, completeness, availability, or timeliness.
          <br /><br />
          Restaurant names, trademarks, logos, menus, and related materials are the property of their respective owners. Use of a restaurant&apos;s name or menu within AllergEats is for informational purposes only and does not imply a partnership, endorsement, affiliation, or sponsorship by that restaurant, unless a formal relationship is expressly stated.
        </Section>

        <Section title="8. No Medical Advice — Emergency Situations">
          AllergEats does not provide medical advice, diagnosis, treatment recommendations, or individualized clinical guidance of any kind. Nothing in the Service constitutes or should be construed as medical advice.
          <br /><br />
          <strong>AllergEats must not be used to diagnose or treat an allergic reaction, or to determine whether emergency medical treatment is necessary.</strong>
          <br /><br />
          If you or someone with you is experiencing symptoms of a serious allergic reaction — including but not limited to difficulty breathing, swelling of the throat or tongue, a sudden drop in blood pressure, rapid heartbeat, dizziness, or loss of consciousness — <strong>call 911 or your local emergency services immediately.</strong> Do not delay seeking emergency care to consult AllergEats or any other app or website.
          <br /><br />
          Consult your physician, allergist, or other qualified healthcare provider for individualized medical advice regarding your food allergies.
        </Section>

        <Section title="9. Assumption of Risk">
          Food allergies can result in serious illness, allergic reactions, anaphylaxis, injury, hospitalization, permanent disability, or death. By using AllergEats, you acknowledge and agree that:
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            <li>Consuming restaurant food carries inherent risks that AllergEats cannot eliminate;</li>
            <li>AllergEats&apos; information is a starting point for your own inquiry, not a substitute for it;</li>
            <li>You voluntarily assume all risks associated with consuming restaurant food based on information provided by or through the Service; and</li>
            <li>To the maximum extent permitted by applicable Florida law, you release and discharge AllergEats and its operators, owners, employees, agents, successors, and assigns from any and all claims, demands, damages, actions, or causes of action arising from ordinary negligence related to your use of the Service or your consumption of restaurant food.</li>
          </ul>
          Nothing in this section waives liability for gross negligence, willful misconduct, intentional wrongdoing, fraud, or any liability that cannot legally be waived under applicable law.
        </Section>

        <Section title="10. Disclaimer of Warranties">
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
          <br /><br />
          WE SPECIFICALLY DISCLAIM ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY, COMPLETENESS, RELIABILITY, AVAILABILITY, AND ALLERGEN SAFETY.
          <br /><br />
          WITHOUT LIMITING THE FOREGOING, WE DO NOT WARRANT THAT:
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            <li>ANY ALLERGEN INFORMATION IS ACCURATE, CURRENT, OR COMPLETE;</li>
            <li>ANY CLASSIFICATION (&quot;SAFE,&quot; &quot;ASK,&quot; OR &quot;AVOID&quot;) IS CORRECT;</li>
            <li>ANY MENU ITEM IS ALLERGEN-FREE OR SAFE TO CONSUME;</li>
            <li>RESTAURANT INFORMATION IS CURRENT OR ACCURATE;</li>
            <li>CROSS-CONTACT WILL NOT OCCUR;</li>
            <li>USE OF THE SERVICE WILL PREVENT AN ALLERGIC REACTION; OR</li>
            <li>THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.</li>
          </ul>
          Some jurisdictions do not allow the exclusion of certain warranties. To the extent those laws apply to you, some of the above exclusions may not apply.
        </Section>

        <Section title="11. Limitation of Liability">
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW:
          <br /><br />
          (a) <strong>Exclusion of consequential damages.</strong> ALLERGEATS AND ITS OPERATORS, OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, LICENSORS, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES OF ANY KIND, INCLUDING BUT NOT LIMITED TO LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF DATA, LOSS OF GOODWILL, PERSONAL INJURY, OR DEATH, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          <br /><br />
          (b) <strong>Claims covered.</strong> This limitation of liability applies to all claims arising from or related to: inaccurate, incomplete, or outdated allergen information; incorrect classifications; automated-analysis errors; restaurant errors; third-party data errors; cross-contact or cross-contamination; allergic reactions; illness; bodily injury; hospitalization; death; or any reliance on information provided through the Service.
          <br /><br />
          (c) <strong>Aggregate cap.</strong> To the extent that any liability cannot be fully excluded under applicable law, AllergEats&apos; total aggregate liability to you for all claims arising from or related to the Service shall not exceed the greater of (i) fifty U.S. dollars ($50.00) or (ii) the total fees, if any, paid by you to AllergEats in the twelve (12) months immediately preceding the event giving rise to the claim.
          <br /><br />
          (d) <strong>Exceptions.</strong> Nothing in these Terms excludes or limits liability for fraud, willful misconduct, gross negligence, or any liability that cannot legally be excluded or limited under applicable law, including applicable Florida law. Some jurisdictions limit certain liability exclusions; to the extent those laws apply to you, some of the above limitations may not apply.
        </Section>

        <Section title="12. Indemnification">
          You agree to indemnify, defend, and hold harmless AllergEats and its operators, owners, officers, directors, employees, agents, licensors, and service providers from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to: (a) your use of or inability to use the Service; (b) your violation of these Terms; (c) your violation of any applicable law or regulation; (d) any information or content you submit through the Service; or (e) your infringement of any third-party right.
          <br /><br />
          We reserve the right to assume exclusive control of any matter subject to indemnification by you, at your expense. You agree to cooperate with our defense of any such claim.
        </Section>

        <Section title="13. User Accounts">
          You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate, current, and complete information when creating your account and to keep it updated. Notify us immediately at <a href="mailto:hello.allergeats@gmail.com" style={{ color: "var(--c-brand)" }}>hello.allergeats@gmail.com</a> if you suspect unauthorized use of your account. We are not liable for losses resulting from unauthorized use of your account.
        </Section>

        <Section title="14. Acceptable Use">
          You agree not to:
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            <li>Use the Service for any unlawful purpose or in violation of these Terms;</li>
            <li>Attempt to reverse-engineer, decompile, scrape at scale, or abuse the Service or its APIs;</li>
            <li>Submit false, misleading, or harmful information through the Service;</li>
            <li>Impersonate any person or entity or misrepresent your affiliation;</li>
            <li>Interfere with or disrupt the security, integrity, or availability of the Service or its infrastructure;</li>
            <li>Use automated tools to access the Service in a manner that exceeds reasonable personal use; or</li>
            <li>Collect other users&apos; personal information without authorization.</li>
          </ul>
        </Section>

        <Section title="15. User Submissions">
          If you submit feedback, reports, corrections, or other content through the Service (&quot;Submissions&quot;), you grant AllergEats a non-exclusive, worldwide, royalty-free, perpetual license to use, reproduce, modify, and display your Submissions for the purpose of operating and improving the Service. You represent that your Submissions are accurate to the best of your knowledge and do not infringe any third-party rights. We are not obligated to use, display, or retain any Submission.
        </Section>

        <Section title="16. Intellectual Property">
          The AllergEats name, logo, and original content (including the allergen analysis engine, scoring system, and user interface) are owned by AllergEats and protected by applicable intellectual property laws. Nothing in these Terms grants you a license to use our trademarks or proprietary content except as necessary to use the Service as intended.
          <br /><br />
          Restaurant names, logos, menus, and related content remain the property of their respective owners. AllergEats references them for informational purposes only.
        </Section>

        <Section title="17. Third-Party Links and Services">
          The Service may contain links to or integrations with third-party websites and services. We do not control those third parties and are not responsible for their content, privacy practices, or availability. Links do not constitute endorsement. Your use of third-party services is governed by those parties&apos; own terms.
        </Section>

        <Section title="18. Termination and Suspension">
          We may suspend or terminate your access to the Service at any time, with or without cause or notice, if we believe you have violated these Terms or applicable law, or if required by law. You may stop using the Service at any time. Sections 4, 5, 8, 9, 10, 11, 12, 15, 19, 20, and 21 survive any termination.
        </Section>

        <Section title="19. Modifications to the Service">
          We may modify, suspend, or discontinue any part of the Service at any time without notice or liability. We are not obligated to maintain any feature, update any data, or provide any minimum level of service.
        </Section>

        <Section title="20. Governing Law and Venue">
          These Terms and any dispute arising out of or relating to the Service shall be governed by the laws of the <strong>State of Florida</strong>, without regard to its conflict-of-laws principles.
          <br /><br />
          Any legal action or proceeding arising out of or relating to these Terms or the Service shall be brought exclusively in the state or federal courts of competent jurisdiction located in the <strong>State of Florida</strong>. You and AllergEats each consent to the personal jurisdiction of those courts and waive any objection to venue in those courts.
          <br /><br />
          <em>Note: If your jurisdiction does not permit the above choice of law or forum, the mandatory laws of your jurisdiction will apply to the extent required.</em>
          <br /><br />
          <strong>Multi-state savings clause.</strong> If a court of competent jurisdiction determines that the law of a state other than Florida applies to a dispute, all substantive protections in these Terms — including the disclaimer of warranties, the limitation of liability, the assumption of risk, and the indemnification provisions — are intended to be enforced to the fullest extent permitted by whichever law the court applies. The intent is that every protective provision in these Terms operate at the maximum level permitted by applicable law in any jurisdiction, not merely Florida.
        </Section>

        <Section title="21. Additional Legal Provisions">
          <strong>Severability.</strong> If any provision of these Terms is found invalid or unenforceable, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.
          <br /><br />
          <strong>Waiver.</strong> Our failure to enforce any right or provision of these Terms is not a waiver of that right or provision.
          <br /><br />
          <strong>Assignment.</strong> You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations freely.
          <br /><br />
          <strong>Entire Agreement.</strong> These Terms and our Privacy Policy constitute the entire agreement between you and AllergEats regarding the Service and supersede all prior agreements and understandings.
          <br /><br />
          <strong>Changes to Terms.</strong> If we make a material change to these Terms, we will update the effective date and may require you to affirmatively acknowledge the updated Terms before continuing to use the Service. The version currently displayed at allergeats.com/terms is the authoritative version.
        </Section>

        <Section title="22. Contact">
          Questions about these Terms or the Service? Contact us at:{" "}
          <a href="mailto:hello.allergeats@gmail.com" style={{ color: "var(--c-brand)" }}>hello.allergeats@gmail.com</a>
        </Section>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--c-border)", display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ fontSize: 13, color: "var(--c-brand)", fontWeight: 600, textDecoration: "none" }}>Privacy Policy</Link>
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
