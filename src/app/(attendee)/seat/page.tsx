import { SeatScreen } from "@/components/navigator/seat-screen";

export const metadata = { title: "Find my seat" };

/**
 * Find-my-seat route (/seat) — the Lecture Theatre plan with the attendee's
 * seat highlighted. A thin server component; the map + directions are client-side.
 */
export default function SeatPage() {
  return <SeatScreen />;
}
