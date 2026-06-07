import { NavigatorHome } from "@/components/navigator/navigator-home";

/**
 * Screen 1 route — Attendee Navigator Home (/). A thin server component; the live
 * orchestrator (host-driven phase + onboarded persona) is the client component.
 */
export default function NavigatorHomePage() {
  return <NavigatorHome />;
}
