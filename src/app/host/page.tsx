import { HostControlPanel } from "@/components/host/host-control-panel";

export const metadata = { title: "Host Control Panel" };

/**
 * Screen 5 — Host Game Control Panel. The interactive control room lives in the
 * HostControlPanel client component; this page stays a server component so it
 * can export metadata.
 */
export default function HostPanelPage() {
  return <HostControlPanel />;
}
