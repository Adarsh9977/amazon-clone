import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { db } from "./db";

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
  remember: z.preprocess((v) => v === true || v === "true" || v === "on", z.boolean()).default(true),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = credentials.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, email: user.email, remember: parsed.data.remember };
      },
    }),
  ],
});

/** The signed-in user's id, or null. For server components, actions and route handlers. */
export async function currentUserId(): Promise<string | null> {
  return (await auth())?.user?.id ?? null;
}
