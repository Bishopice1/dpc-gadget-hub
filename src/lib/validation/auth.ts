import { z } from "zod";

/** Internal redirect target — must be a site-relative path, never external. */
export const internalPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((v) => v.startsWith("/") && !v.startsWith("//") && !v.includes(":"), {
    message: "Must be a site-relative path starting with /",
  });

export function parseNextPath(raw: string | null | undefined): string {
  const parsed = internalPathSchema.safeParse(raw ?? "");
  return parsed.success ? parsed.data : "/";
}

/** Admin allow-list from the ADMIN_EMAILS env var (comma-separated). */
export function adminEmailsFromEnv(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmailsFromEnv().includes(email.toLowerCase());
}