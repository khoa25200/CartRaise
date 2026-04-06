import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>CartRaise</h1>
      <p>Private embedded app — open from Shopify admin after install, or go to the dashboard.</p>
      <p>
        <Link href="/dashboard">Dashboard</Link>
      </p>
    </main>
  );
}
