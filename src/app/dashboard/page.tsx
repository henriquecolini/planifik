// The DashboardClient handles its own auth check via useSession,
// redirecting to /login if the user is not authenticated.
import { DashboardClient } from "@/components/DashboardClient";

export default function DashboardPage() {
  return <DashboardClient />;
}
