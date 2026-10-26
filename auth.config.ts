import type { NextAuthConfig } from "next-auth";

// Edge-safe half of the Auth.js config: no Prisma or bcrypt, so middleware can import it.

const PROTECTED = ["/checkout", "/orders"];
const DAY = 24 * 60 * 60;

export const authConfig = {
  pages: { signIn: "/signin" },
  session: { strategy: "jwt", maxAge: 30 * DAY },
  providers: [],
  callbacks: {
    // Middleware: unauthenticated visits to protected paths go to /signin?callbackUrl=...
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      return PROTECTED.some((p) => path === p || path.startsWith(`${p}/`)) ? !!auth?.user : true;
    },
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.name = user.name;
        // "Keep me signed in" unchecked: the session lapses after a day instead of 30.
        token.shortUntil = (user as { remember?: boolean }).remember ? null : Math.floor(Date.now() / 1000) + DAY;
      }
      if (typeof token.shortUntil === "number" && Date.now() / 1000 > token.shortUntil) return null;
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
