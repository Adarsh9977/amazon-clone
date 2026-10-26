"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

/** Step 1 of the two-step sign-in, like the live site: does this email have an account? */
export async function checkEmail(raw: string): Promise<{ error?: string }> {
  const parsed = email.safeParse(raw);
  if (!parsed.success) return { error: "Enter a valid email address" };
  const user = await db.user.findUnique({ where: { email: parsed.data }, select: { id: true } });
  return user ? {} : { error: "We cannot find an account with that email address" };
}

export async function login(input: { email: string; password: string; remember: boolean }): Promise<{ error?: string }> {
  try {
    await signIn("credentials", { ...input, redirect: false });
    return {};
  } catch (e) {
    if (e instanceof AuthError) return { error: "Your password is incorrect" };
    throw e;
  }
}

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name").max(80),
    email,
    password: z.string().min(8, "Minimum 8 characters required").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords must match" });

export type RegisterErrors = Partial<Record<"name" | "email" | "password" | "confirm", string>>;

export async function register(input: z.input<typeof registerSchema>): Promise<{ errors?: RegisterErrors }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const errors: RegisterErrors = {};
    for (const issue of parsed.error.issues) errors[issue.path[0] as keyof RegisterErrors] ??= issue.message;
    return { errors };
  }
  const { name, email: addr, password } = parsed.data;
  if (await db.user.findUnique({ where: { email: addr }, select: { id: true } })) {
    return { errors: { email: "There's already an account with this email. Sign in instead." } };
  }
  await db.user.create({ data: { name, email: addr, passwordHash: await bcrypt.hash(password, 10) } });
  await signIn("credentials", { email: addr, password, remember: true, redirect: false });
  return {};
}
