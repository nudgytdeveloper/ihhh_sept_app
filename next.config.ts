import type { NextConfig } from "next";

/**
 * Security headers (Phase 6 hardening), applied to every route.
 *
 * The CSP is tuned to what the app actually loads: self-hosted Next assets +
 * fonts (via next/font), inline styles/scripts (Tailwind + Next's hydration
 * bootstrap — hence 'unsafe-inline'; nonce-based CSP would force every page
 * dynamic, which isn't worth it here), same-origin SSE/fetch (`connect-src`),
 * data:/blob: images + audio (icons, fetched voice clips), and the push service
 * worker (`worker-src`). In dev, Next's HMR needs 'unsafe-eval' + a ws: socket.
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob: data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down powerful features to what the app uses (host STT needs the mic;
  // Navi voice autoplays audio). Everything else is denied.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self), autoplay=(self)" },
  // HSTS only in production (HTTPS on Render); browsers ignore it on localhost.
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
