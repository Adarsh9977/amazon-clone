"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { checkEmail, login } from "@/actions/auth";
import { FieldError, PrimaryButton, TextField } from "./fields";

/** F7: Amazon-style two-step sign-in. Email first, then password, all without a page reload. */
export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "password") passwordRef.current?.focus();
  }, [step]);

  return (
    <div className="rounded-lg border border-amz-border px-[26px] pb-5 pt-5">
      <h1 className="mb-3 text-[28px] font-normal leading-[1.2]">Sign in</h1>

      {step === "email" ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await checkEmail(email);
              setError(res.error);
              if (!res.error) setStep("password");
            });
          }}
        >
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(undefined);
            }}
            error={error}
          />
          <div className="mt-4">
            <PrimaryButton pending={pending}>Continue</PrimaryButton>
          </div>
        </form>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await login({ email, password, remember });
              if (res.error) return setError(res.error);
              // Full navigation so the session cookie is picked up everywhere and the
              // guest cart merges into the account cart on the next page (F8).
              window.location.assign(callbackUrl);
            });
          }}
        >
          <p className="mb-3 text-[13px]">
            {email}{" "}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setPassword("");
                setError(undefined);
              }}
              className="text-amz-link hover:text-amz-link-hover hover:underline"
            >
              Change
            </button>
          </p>
          <TextField
            ref={passwordRef}
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(undefined);
            }}
          />
          <FieldError>{error}</FieldError>
          <div className="mt-4">
            <PrimaryButton pending={pending}>Sign in</PrimaryButton>
          </div>
          <label className="mt-3 flex items-center gap-1.5 text-[13px]">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-3.5 w-3.5" />
            Keep me signed in
          </label>
        </form>
      )}

      <p className="mt-5 text-xs leading-[18px]">
        This is a demo store. Try <span className="font-bold">demo@example.com</span> / <span className="font-bold">password123</span>.
      </p>

      <div className="mt-6 flex items-center gap-2 text-xs text-amz-muted">
        <span className="h-px flex-1 bg-[#e7e7e7]" />
        New to Amazon.clone?
        <span className="h-px flex-1 bg-[#e7e7e7]" />
      </div>
      <Link
        href={`/register${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
        className="mt-3 flex h-[31px] items-center justify-center rounded-full border border-amz-border text-[13px] shadow-sm hover:bg-[#f7fafa]"
      >
        Create your Amazon.clone account
      </Link>
    </div>
  );
}
