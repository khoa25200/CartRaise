import { Suspense } from "react";
import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, fontFamily: "system-ui" }}>Loading…</div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
