import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { auth } from "@/lib/auth";
import { safeCallback } from "@/lib/safe-url";

export const metadata: Metadata = { title: "Sign-In" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = safeCallback((await searchParams).callbackUrl, (await headers()).get("host"));
  if ((await auth())?.user) redirect(callbackUrl);
  return <SignInForm callbackUrl={callbackUrl} />;
}
