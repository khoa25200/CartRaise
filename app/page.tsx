import Link from "next/link";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toQueryString(
  sp: Record<string, string | string[] | undefined>
): string {
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (typeof val === "string") q.set(key, val);
    else for (const v of val) if (v) q.append(key, v);
  }
  return q.toString();
}

export default async function HomePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const shop =
    typeof sp.shop === "string" ? sp.shop : Array.isArray(sp.shop) ? sp.shop[0] : "";
  const host =
    typeof sp.host === "string" ? sp.host : Array.isArray(sp.host) ? sp.host[0] : "";

  // Admin iframe loads application_url with ?shop=&host= — forward to dashboard
  if (shop.trim() || host.trim()) {
    const qs = toQueryString(sp);
    redirect(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>CartRaise</h1>
      <p>
        Private embedded app — open from Shopify admin (Apps → CartRaise), or go
        to the dashboard with <code>?shop=your-store.myshopify.com</code>.
      </p>
      <p>
        <Link href="/dashboard">Dashboard</Link>
      </p>
    </main>
  );
}
