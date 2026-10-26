import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// F7: /checkout and /orders require a session; see authConfig.callbacks.authorized.
export default NextAuth(authConfig).auth;

export const config = { matcher: ["/checkout/:path*", "/orders/:path*"] };
