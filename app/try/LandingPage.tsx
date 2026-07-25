"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import s from "./styles.module.css";

const TRY_URL = "/";

const FAQS = [
  {
    q: "Is AllergEats free?",
    a: "Yes, completely free. No subscription, no hidden fees, no account needed. Just open it and go.",
  },
  {
    q: "Which allergies does it cover?",
    a: "All major allergens — peanuts, tree nuts, dairy, eggs, wheat/gluten, soy, shellfish, fish, and more. You can select as many as you need.",
  },
  {
    q: "How does it know what's in the food?",
    a: "AllergEats analyzes menu items and ingredient descriptions using smart pattern recognition. For major chains, it uses published ingredient data. Always confirm with staff before ordering — no app replaces a conversation with your server.",
  },
  {
    q: "Does it share my allergy information?",
    a: "No. Your allergy profile is stored only on your device. We don't collect or sell your personal health information. Ever.",
  },
  {
    q: "What if my favorite restaurant isn't listed?",
    a: "You can paste in a menu URL and AllergEats will scan it for you on the spot. We're adding new restaurants all the time.",
  },
  {
    q: "Do I need to make an account?",
    a: "No account, no email, no password. Open AllergEats, set your allergies, and start checking restaurants. It's that simple.",
  },
];

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>(`.${s.fadeUp}`);
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(s.fadeUpVisible);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className={s.page} ref={pageRef}>

      {/* ── Nav ── */}
      <nav className={s.nav}>
        <div className={s.navLogo}>Allerg<span>Eats</span></div>
        <a href={TRY_URL} className={s.navCta}>Try Free</a>
      </nav>

      {/* ── Hero ── */}
      <header className={s.hero}>
        <div className={s.container}>
          <div className={s.heroEyebrow}>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <circle cx="5" cy="5" r="5" fill="#14b8a6" />
            </svg>
            Free · No account needed · Works anywhere
          </div>

          <h1 className={s.heroH1}>
            Eat Out. <em>Stay Safe.</em><br />No Stress.
          </h1>

          <p className={s.heroSub}>
            AllergEats scans restaurant menus for your food allergies — and shows you exactly what&rsquo;s safe to order before you even sit down.
          </p>

          <div className={s.heroCtaGroup}>
            <a href={TRY_URL} className={s.btnPrimary}>
              Check My Nearest Restaurants →
            </a>
            <a href="#how" className={s.btnSecondary}>See How It Works</a>
          </div>

          {/* Phone mockup */}
          <div className={s.phoneWrap}>
            <div className={s.phone}>
              <div className={s.phoneNotch} />
              <div className={s.phoneScreen}>
                <div className={s.phoneBar}>
                  <div className={s.phoneBarTitle}>Nearby Restaurants</div>
                  <div className={s.phoneBarLoc}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" aria-hidden="true">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    Near you
                  </div>
                </div>

                <div className={s.phoneCards}>
                  {[
                    { emoji: "🍔", bg: "rgba(255,100,50,0.08)", name: "Five Guys", dist: "0.3 mi", safe: 32, ask: 8, avoid: 5, badge: s.badgeGreat, badgeText: ["Great", "Match"] },
                    { emoji: "🌮", bg: "rgba(20,184,166,0.08)",  name: "Chipotle",  dist: "0.5 mi", safe: 18, ask: 14, avoid: 11, badge: s.badgeCaution, badgeText: ["Use", "Caution"] },
                    { emoji: "🍕", bg: "rgba(239,68,68,0.08)",   name: "Pizza Hut", dist: "0.8 mi", safe: 4,  ask: 6,  avoid: 23, badge: s.badgeAvoid, badgeText: ["High", "Risk"] },
                  ].map((r) => (
                    <div key={r.name} className={s.pCard}>
                      <div className={s.pCardImg} style={{ background: r.bg }}>{r.emoji}</div>
                      <div className={s.pCardBody}>
                        <div className={s.pCardName}>{r.name}</div>
                        <div className={s.pCardDist}>{r.dist} away</div>
                        <div className={s.pCardDots}>
                          <div className={`${s.dot} ${s.dotGreen}`}>{r.safe}</div>
                          <div className={`${s.dot} ${s.dotAmber}`}>{r.ask}</div>
                          <div className={`${s.dot} ${s.dotRed}`}>{r.avoid}</div>
                        </div>
                      </div>
                      <div className={`${s.pCardBadge} ${r.badge}`}>
                        {r.badgeText[0]}<br />{r.badgeText[1]}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={s.phoneLegend}>
                  <div className={s.legendItem}><div className={s.legendDot} style={{ background: "#22c55e" }} />Safe</div>
                  <div className={s.legendItem}><div className={s.legendDot} style={{ background: "#f59e0b" }} />Ask Staff</div>
                  <div className={s.legendItem}><div className={s.legendDot} style={{ background: "#ef4444" }} />Avoid</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={s.trustBar}>
          {[
            ["🔒", "Your data stays on your device"],
            ["🌎", "Works at thousands of restaurants"],
            ["⚡️", "Results in seconds"],
            ["💸", "Completely free"],
          ].map(([icon, label]) => (
            <div key={label} className={s.trustItem}>
              <span style={{ fontSize: 16 }}>{icon}</span> {label}
            </div>
          ))}
        </div>
      </header>

      {/* ── Pain ── */}
      <section className={`${s.section} ${s.painSection}`}>
        <div className={s.container}>
          <div className={s.fadeUp}>
            <div className={s.sectionEyebrow}>Sound Familiar?</div>
            <h2 className={s.sectionH2}>Eating out with allergies is exhausting.</h2>
            <p className={s.sectionSub}>Every meal is a guessing game. You&rsquo;ve been there.</p>
          </div>
          <div className={s.painGrid}>
            {[
              { icon: "😰", title: '"Is this safe for me?"', body: "You ask the server. They check with the kitchen. You wait, hoping. You've been burned before." },
              { icon: "📱", title: "Googling ingredients at the table", body: "Ten tabs open. The food is getting cold. Everyone's waiting on you. Again." },
              { icon: "😔", title: "Just skipping it entirely", body: 'You say "I\'m not hungry" so nobody has to deal with your allergy situation. You\'re always hungry.' },
            ].map((p) => (
              <div key={p.title} className={`${s.painCard} ${s.fadeUp}`}>
                <div className={s.painIcon}>{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className={`${s.section} ${s.howSection}`} id="how">
        <div className={s.container}>
          <div className={s.fadeUp}>
            <div className={s.sectionEyebrow}>How AllergEats Works</div>
            <h2 className={s.sectionH2}>Three steps. Then you just eat.</h2>
            <p className={s.sectionSub}>No account. No setup. No nonsense.</p>
          </div>
          <div className={s.steps}>
            {[
              { n: "1", title: "Tell us your allergies", body: "Pick from a list — dairy, peanuts, gluten, eggs, shellfish, and more. Takes 20 seconds. Your choices stay private on your phone." },
              { n: "2", title: "See restaurants near you", body: "AllergEats finds real restaurants close by and automatically scans their menus for your allergens." },
              { n: "3", title: "Know what's safe before you go", body: "Every item gets a color-coded safety rating. Green means go. You pick where to eat feeling confident — not scared." },
            ].map((step) => (
              <div key={step.n} className={`${s.step} ${s.fadeUp}`}>
                <div className={s.stepNum}>{step.n}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>

          <div className={s.legendBlock}>
            {[
              { card: s.legendCardGreen, circle: s.legendCircleGreen, symbol: "✓", title: "Safe",      color: "#22c55e", body: "This item has no detected allergens from your list. Eat with confidence." },
              { card: s.legendCardAmber, circle: s.legendCircleAmber, symbol: "?", title: "Ask Staff", color: "#f59e0b", body: "Possible cross-contamination or unclear ingredients. One quick question to the server." },
              { card: s.legendCardRed,   circle: s.legendCircleRed,   symbol: "✕", title: "Avoid",     color: "#ef4444", body: "Your allergen is in this dish. Skip it — there are better options on the menu." },
            ].map((l) => (
              <div key={l.title} className={`${s.legendCard} ${l.card} ${s.fadeUp}`}>
                <div className={`${s.legendCircle} ${l.circle}`} style={{ color: l.color, fontWeight: 900 }}>{l.symbol}</div>
                <div>
                  <h4>{l.title}</h4>
                  <p>{l.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className={`${s.section} ${s.whoSection}`}>
        <div className={s.containerWide} style={{ position: "relative" }}>
          <div className={s.fadeUp} style={{ maxWidth: 600 }}>
            <div className={s.sectionEyebrow} style={{ color: "#14b8a6" }}>Who It&rsquo;s For</div>
            <h2 className={s.sectionH2} style={{ color: "#fff" }}>If eating out makes you anxious, AllergEats is for you.</h2>
          </div>
          <div className={s.whoGrid}>
            {[
              { emoji: "👩‍👧", title: "Parents of kids with allergies",    body: "Find places everyone can eat — without calling ahead to three different restaurants first." },
              { emoji: "🎓", title: "College students",                    body: "Eating on a budget is hard enough. Now you don't have to guess which $6 lunch is safe." },
              { emoji: "✈️", title: "Travelers & visitors",                body: "Unfamiliar restaurants in a new city? No problem. AllergEats works anywhere." },
              { emoji: "👴", title: "Older adults with sensitivities",     body: "Simple to use — just tap your allergens and see what's safe nearby. That's it." },
              { emoji: "💪", title: "Fitness & diet-focused folks",        body: "Track what you're actually eating. AllergEats helps you spot hidden ingredients." },
              { emoji: "🍽️", title: "Anyone who just wants to enjoy a meal", body: "Life is too short to eat scared. You deserve to go out and actually enjoy it." },
            ].map((w) => (
              <div key={w.title} className={`${s.whoCard} ${s.fadeUp}`}>
                <span style={{ fontSize: 30, flexShrink: 0 }}>{w.emoji}</span>
                <div>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className={s.section} style={{ background: "var(--c-bg)" }}>
        <div className={s.containerWide}>
          <div className={s.fadeUp} style={{ textAlign: "center" }}>
            <div className={s.sectionEyebrow}>Real Stories</div>
            <h2 className={s.sectionH2}>People are eating out again.</h2>
            <p className={s.sectionSub} style={{ margin: "0 auto" }}>And they&rsquo;re not scared anymore.</p>
          </div>
          <div className={s.testiGrid}>
            {[
              { initial: "S", name: "Sandra M.", label: "Mom of a child with severe allergies", text: '"My daughter is severely allergic to peanuts and dairy. This app changed how we go out to eat. I check it before we even get in the car."' },
              { initial: "D", name: "Derek R.",  label: "Celiac disease, diagnosed 2018",        text: '"I\'ve been gluten-free for six years and this is the first app that actually shows me safe options nearby instead of just listing ingredients I have to decode."' },
              { initial: "L", name: "Lauren K.", label: "Multiple food allergies, frequent traveler", text: '"I traveled to three cities last month and used this every single day. Didn\'t have one bad reaction. That\'s the first time I can say that in years."' },
            ].map((t) => (
              <div key={t.name} className={`${s.testiCard} ${s.fadeUp}`}>
                <div className={s.testiStars}>★★★★★</div>
                <p className={s.testiText}>{t.text}</p>
                <div className={s.testiAuthor}>
                  <div className={s.testiAvatar}>{t.initial}</div>
                  <div>
                    <div className={s.testiName}>{t.name}</div>
                    <div className={s.testiLabel}>{t.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mid CTA ── */}
      <section className={s.midCta}>
        <div className={s.container}>
          <h2>Ready to eat out without fear?</h2>
          <p>It takes 20 seconds to set up. No account required.</p>
          <a href={TRY_URL} className={s.btnWhite}>Check What&rsquo;s Safe Near Me →</a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={`${s.section} ${s.faqSection}`}>
        <div className={s.container}>
          <div className={s.fadeUp}>
            <div className={s.sectionEyebrow}>Questions</div>
            <h2 className={s.sectionH2}>We&rsquo;ve got answers.</h2>
          </div>
          <div className={`${s.faqList} ${s.fadeUp}`}>
            {FAQS.map((faq, i) => (
              <div key={i} className={s.faqItem}>
                <button
                  className={s.faqQ}
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <svg
                    className={`${s.faqChevron} ${openFaq === i ? s.faqChevronOpen : ""}`}
                    width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div className={`${s.faqA} ${openFaq === i ? s.faqAOpen : ""}`}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className={s.finalCta} id="final">
        <div className={s.container}>
          <h2 className={s.finalH2}>You deserve to enjoy <em>every meal.</em></h2>
          <p className={s.finalSub}>Stop guessing. Start eating out with confidence — for free, right now.</p>
          <a href={TRY_URL} className={s.btnPrimaryLg}>Open AllergEats Free →</a>
          <p className={s.ctaSubline}>No download. Works in your browser. Free forever.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={s.footer}>
        <div className={s.footerLogo}>Allerg<span>Eats</span></div>
        <p className={s.footerDisclaimer}>
          Always confirm allergen information with restaurant staff before ordering. Menu data may not reflect recent changes or local variations. AllergEats is not a substitute for medical advice.
        </p>
        <div className={s.footerCopy}>© 2026 AllergEats</div>
      </footer>

    </div>
  );
}
