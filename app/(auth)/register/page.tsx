import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { auth } from "@/lib/auth";
import { safeCallback } from "@/lib/safe-url";

export const metadata: Metadata = { title: "Registration" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const callbackUrl = safeCallback((await searchParams).callbackUrl, (await headers()).get("host"));
  if ((await auth())?.user) redirect(callbackUrl);
  return <RegisterForm callbackUrl={callbackUrl} />;
}
