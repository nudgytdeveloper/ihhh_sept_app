import { RecapsScreen } from "@/components/navigator/recaps-screen";

export const metadata = { title: "Session Recaps" };

/**
 * Attendee AI session recaps (Nov-event Phase 4). Thin server component; the
 * live screen is the RecapsScreen client component.
 */
export default function RecapsPage() {
  return <RecapsScreen />;
}
