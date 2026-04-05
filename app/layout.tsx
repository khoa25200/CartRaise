import type { Metadata } from "next";
import "@shopify/polaris/build/esm/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conversion Booster Lite",
  description: "Cart progress bar and auto free gift",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
