import type { Metadata, Viewport } from "next";
import { ClientShell } from "@/components/ClientShell";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Amazon.clone: Online Shopping", template: "%s : Amazon.clone" },
  description: "A working rebuild of the Amazon.com shopping experience: search, product pages, cart, checkout and orders.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = { themeColor: "#131921" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body id="top" className="flex min-h-dvh flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ClientShell />
      </body>
    </html>
  );
}
