import { RosterScreen } from "@/components/host/roster-screen";

export const metadata = { title: "Attendee Roster" };

/**
 * Host roster / attendance list (Nov-event Phase 2): every registered attendee
 * with their check-in mark and best virus-game score. The live screen is the
 * RosterScreen client component; this page stays a server component so it can
 * export metadata.
 */
export default function HostRosterPage() {
  return <RosterScreen />;
}
