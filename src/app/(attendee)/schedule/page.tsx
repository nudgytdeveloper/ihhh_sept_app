import { ScheduleScreen } from "@/components/schedule/schedule-screen";

export const metadata = { title: "Schedule" };

/**
 * Screen 2 route — Event Schedule / Phase Timeline (/schedule). A thin server
 * component; the live orchestrator (host-driven phase) is the client component.
 */
export default function SchedulePage() {
  return <ScheduleScreen />;
}
