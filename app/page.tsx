import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Conversion Booster Lite</h1>
      <p>Open your store admin to install, or go to the dashboard after install.</p>
      <p>
        <Link href="/dashboard">Dashboard</Link>
      </p>
    </main>
  );
}
