import { SessionsScreen } from "@/components/host/sessions-screen";

export const metadata = { title: "Speaker Sessions" };

/**
 * Host speaker sessions / transcripts (Nov-event Phase 3). The live screen is
 * the SessionsScreen client component; this page stays a server component so it
 * can export metadata.
 */
export default function HostSessionsPage() {
  return <SessionsScreen />;
}
