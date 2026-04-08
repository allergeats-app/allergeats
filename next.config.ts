import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevent the page from being embedded in an iframe (clickjacking)
  { key: "X-Frame-Options",           value: "DENY" },
  // Stop browsers from guessing content types (MIME-sniffing attacks)
  { key: "X-Content-Type-Options",    value: "nosniff" },
  // Enable browser XSS auditor (legacy browsers)
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  // Only send the origin as referrer, never the full URL
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  // Enforce HTTPS for 2 years
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Restrict browser features this app doesn't need
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://va.vercel-insights.com https://nominatim.openstreetmap.org https://overpass-api.de https://overpass.kumi.systems https://overpass.openstreetmap.fr https://*.sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry org + project (fill in after creating project at sentry.io)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for source map uploads (set SENTRY_AUTH_TOKEN in Vercel env vars)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Silences Sentry's build-time output
  silent: true,

  // Automatically tree-shake Sentry logger statements in production
  disableLogger: true,

  // Upload source maps so stack traces show original code
  widenClientFileUpload: true,
});