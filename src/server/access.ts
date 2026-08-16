import {
  DEV_ADMIN_EMAILS_ENV,
  DEV_ADMIN_EMAILS_SEPARATOR,
} from "@/constants/access";
import { normalizeEmail } from "@/utils/registration";
import { countAttendees, isOnAttendanceList } from "@/server/db/attendees";
import type { Db } from "@/server/db";

/**
 * Server-only guest-list check (see `src/constants/access.ts` for the policy).
 * Never import from client code or the barrels — it reads process env.
 */

let adminEmails: Set<string> | null = null;

/** The always-allowed developer/admin addresses, parsed once per process. */
export function getAdminEmails(): ReadonlySet<string> {
  if (adminEmails) return adminEmails;
  adminEmails = new Set(
    (process.env[DEV_ADMIN_EMAILS_ENV] ?? "")
      .split(DEV_ADMIN_EMAILS_SEPARATOR)
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean),
  );
  return adminEmails;
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().has(normalizeEmail(email));
}

/**
 * May this email register? Admins always may. Otherwise the email has to be on
 * the attendance list — unless the list is still empty, in which case
 * registration stays open so a fresh deploy isn't locked out before the host
 * has had a chance to import anything.
 */
export async function isEmailAllowed(db: Db, email: string): Promise<boolean> {
  if (isAdminEmail(email)) return true;
  if (await isOnAttendanceList(db, normalizeEmail(email))) return true;
  return (await countAttendees(db)) === 0;
}
