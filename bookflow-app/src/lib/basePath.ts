/**
 * Base path the site is served under. Empty for root hosting (Netlify,
 * Vercel); "/bookflow" when built for GitHub Pages project hosting.
 * Inlined at build time from NEXT_PUBLIC_BASE_PATH.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
