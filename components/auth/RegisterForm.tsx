"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { register, type RegisterErrors } from "@/actions/auth";
import { PrimaryButton, TextField } from "./fields";

/** F7: name, email, password (8+), re-enter. Server validates with the same Zod rules. */
export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [pending, start] = useTransition();

  const field = (key: keyof typeof form) => ({
    name: key,
    value: form[key],
    error: errors[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((x) => ({ ...x, [key]: undefined }));
    },
  });

  return (
    <div className="rounded-lg border border-amz-border px-[26px] pb-5 pt-5">
      <h1 className="mb-3 text-[28px] font-normal leading-[1.2]">Create account</h1>
      <form
        noValidate
        className="space-y-3.5"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await register(form);
            if (res.errors) return setErrors(res.errors);
            window.location.assign(callbackUrl); // full load: session + cart merge (F8)
          });
        }}
      >
        <TextField label="Your name" autoComplete="name" placeholder="First and last name" autoFocus {...field("name")} />
        <TextField label="Email" type="email" autoComplete="email" {...field("email")} />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Passwords must be at least 8 characters."
          {...field("password")}
        />
        <TextField label="Re-enter password" type="password" autoComplete="new-password" {...field("confirm")} />
        <PrimaryButton pending={pending}>Create your Amazon.clone account</PrimaryButton>
      </form>
      <p className="mt-6 border-t border-[#e7e7e7] pt-4 text-[13px]">
        Already have an account?{" "}
        <Link
          href={`/signin${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="text-amz-link hover:text-amz-link-hover hover:underline"
        >
          Sign in ›
        </Link>
      </p>
    </div>
  );
}
