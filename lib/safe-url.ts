/**
 * Only same-site destinations, so ?callbackUrl= can't redirect off-site. Auth.js middleware
 * sends an absolute URL; it's accepted when its host matches and reduced to path + query.
 */
export function safeCallback(url: unknown, host?: string | null): string {
  if (typeof url !== "string") return "/";
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) return url;
  try {
    const u = new URL(url);
    if (host && u.host === host) return `${u.pathname}${u.search}` || "/";
  } catch {
    /* not a URL */
  }
  return "/";
}
