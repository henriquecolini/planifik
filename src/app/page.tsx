import { redirect } from "next/navigation";

// Redirect root to dashboard; the dashboard client will redirect to /login
// if the user isn't authenticated (via useSession).
export default function RootPage() {
  redirect("/dashboard");
}
