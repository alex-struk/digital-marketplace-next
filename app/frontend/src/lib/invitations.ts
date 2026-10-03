import { isEmailAddress } from "@rules/users";

/**
 * What the team tab's invite dialog needs beyond the screen itself: reading the addresses typed
 * into its fields, and keeping what the last invitations came back with across a reload of the
 * tab, so the warning naming an unregistered address (R-3.30) and the refusals stay in view until
 * the inviter's next action rather than until the page is next drawn.
 */

/** What the last invitations came back with, shown above the team until the next action. */
export interface InvitationOutcome {
  readonly refused: readonly { readonly email: string; readonly reason: string }[];
  readonly unregistered: readonly string[];
  readonly invalidType: boolean;
}

/**
 * The addresses one field holds. A field normally holds one, but several pasted into it at once,
 * separated by commas, semicolons or spaces, are each invited.
 */
export function addressesIn(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((address) => address.trim())
    .filter((address) => address !== "");
}

/** Why a field's addresses cannot be sent, or "" when they can. */
export function fieldProblem(text: string, onlyField: boolean): string {
  const addresses = addressesIn(text);
  if (addresses.length === 0) return onlyField ? "Enter an email address" : "";
  return addresses.every(isEmailAddress) ? "" : "Enter an email address in a valid format, like name@example.com";
}

/** Every address the fields hold, each once, in the order given. */
export function addressesToInvite(fields: readonly string[]): string[] {
  return [...new Set(fields.flatMap(addressesIn))];
}

// An outcome older than this is not shown again: it belongs to an earlier visit.
const KEPT_FOR_MS = 10 * 60 * 1000;
const keyFor = (organizationId: string) => `invitation-outcome:${organizationId}`;

/** Keeps the outcome for this tab of the browser; storage that cannot be used is passed over. */
export function keepOutcome(organizationId: string, outcome: InvitationOutcome, now = Date.now()): void {
  try {
    window.sessionStorage.setItem(keyFor(organizationId), JSON.stringify({ at: now, outcome }));
  } catch {
    // Without storage the outcome is still shown until the page is next drawn.
  }
}

/** The outcome kept for this organization, if it is recent. */
export function keptOutcome(organizationId: string, now = Date.now()): InvitationOutcome | null {
  try {
    const raw = window.sessionStorage.getItem(keyFor(organizationId));
    if (!raw) return null;
    const kept: unknown = JSON.parse(raw);
    if (!isKept(kept) || now - kept.at > KEPT_FOR_MS) return null;
    return kept.outcome;
  } catch {
    return null;
  }
}

/** Forgets the kept outcome, once the inviter has moved on to another action. */
export function forgetOutcome(organizationId: string): void {
  try {
    window.sessionStorage.removeItem(keyFor(organizationId));
  } catch {
    // Nothing kept, or nothing to forget.
  }
}

function isKept(value: unknown): value is { at: number; outcome: InvitationOutcome } {
  if (typeof value !== "object" || value === null) return false;
  const { at, outcome } = value as { at?: unknown; outcome?: unknown };
  if (typeof at !== "number" || typeof outcome !== "object" || outcome === null) return false;
  const { refused, unregistered, invalidType } = outcome as Record<string, unknown>;
  return (
    Array.isArray(refused) &&
    refused.every(
      (entry: unknown) =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { email?: unknown }).email === "string" &&
        typeof (entry as { reason?: unknown }).reason === "string",
    ) &&
    Array.isArray(unregistered) &&
    unregistered.every((email: unknown) => typeof email === "string") &&
    typeof invalidType === "boolean"
  );
}
