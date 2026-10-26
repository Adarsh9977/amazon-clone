"use client";

import { SessionProvider } from "next-auth/react";

// The session is read on the client so storefront pages stay static/ISR instead of
// becoming dynamic just to print "Hello, Name" in the header.
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
