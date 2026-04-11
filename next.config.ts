import type { NextConfig } from "next";
// Note: withSentryConfig (source map upload) is wired separately via Sentry CLI.
// The Sentry SDK in sentry.client/server/edge.config.ts still captures runtime errors.

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
      "script-src 'self' 'unsafe-inline' https://va.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      // *.supabase.co still needed for server-side routes and image cache; /_supabase proxy is same-origin ('self')
      "connect-src 'self' https://*.supabase.co https://va.vercel-insights.com https://nominatim.openstreetmap.org https://overpass-api.de https://overpass.kumi.systems https://overpass.openstreetmap.fr https://*.sentry.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const SUPABASE_URL = "https://hdggopyudrjjnfamzlst.supabase.co";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return [
      // Proxy all Supabase auth traffic through our own domain.
      // Users see allergeats.app/... in the address bar instead of supabase.co during OAuth.
      {
        source: "/_supabase/:path*",
        destination: `${SUPABASE_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;