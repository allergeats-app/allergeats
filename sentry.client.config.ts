import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,

  // Capture 100% of errors
  // (default — no need to set replaysSessionSampleRate unless you enable Session Replay)

  // Surface the Sentry release for source maps
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
});