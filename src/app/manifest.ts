import type { MetadataRoute } from "next";
import { APP_NAME, APP_SHORT_NAME, APP_TAGLINE, EVENT_NAME } from "@/constants/app";

/**
 * PWA manifest (Nov-event Phase 5) — served at `/manifest.webmanifest`, which
 * Next auto-links from every page. Makes the Event Navigator installable to the
 * home screen (the prerequisite for Web Push on iOS, and an app-like launch on
 * Android). Icons live in `public/`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — ${EVENT_NAME}`,
    short_name: APP_SHORT_NAME,
    description: APP_TAGLINE,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef2fb",
    theme_color: "#2f6df6",
    categories: ["events", "health", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
