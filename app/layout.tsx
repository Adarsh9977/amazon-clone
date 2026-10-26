import type { Metadata, Viewport } from "next";
import { ClientShell } from "@/components/ClientShell";
import { Providers } from "@/components/Providers";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Amazon.clone: Online Shopping", template: "%s : Amazon.clone" },
  description: "A working rebuild of the Amazon.com shopping experience: search, product pages, cart, checkout and orders.",
  metadataBase: new URL(siteUrl()),
};

export const viewport: Viewport = { themeColor: "#131921" };

// Storefront chrome lives in app/(shop)/layout.tsx; sign-in pages in app/(auth) have none, like the live site.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body id="top" className="flex min-h-dvh flex-col antialiased">
        <Providers>
          {children}
          <ClientShell />
        </Providers>
      </body>
    </html>
  );
}
