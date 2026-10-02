import { ReactNode } from "react";
import { OpportunityStatus, STATUS_LABELS, pacificDayOf } from "@rules/opportunities";
import { badge, term } from "../app/layout";
import { Stack } from "../app/page-layout";
import { readDate, readDay } from "../lib/dates";

/**
 * Pieces every opportunity screen shares (design/DESIGN.md, opportunities, "This project's own
 * components"): the status badge and the key facts, and the way dates and money read.
 */

/** The state in words, never colour alone (`opportunity-status`). */
export function StatusBadge({ status }: { status: OpportunityStatus }) {
  return (
    <span style={badge} data-testid="opportunity-status">
      {STATUS_LABELS[status]}
    </span>
  );
}

/** One key fact: a term and what it is, in a key facts list (`<Stack as="dl" direction="row">`). */
export function Fact({ label, children, testId }: { label: string; children: ReactNode; testId?: string }) {
  return (
    <Stack gap="small">
      <dt style={term}>{label}</dt>
      <dd data-testid={testId}>{children}</dd>
    </Stack>
  );
}

/** "October 2, 2026 at 4:00 p.m. Pacific time": when proposals close (R-1.14). */
export function deadlineLabel(day: string): string {
  const read = readDay(day);
  return read ? `${read.label} at 4:00 p.m. Pacific time` : "Not entered";
}

/** A calendar day in words, or "Not entered". */
export function dayLabel(day: string | null): string {
  return (day && readDay(day)?.label) || "Not entered";
}

/** The day of the first publication, or that there has been none (R-1.23). */
export function publishedLabel(publishedAt: string | null): string {
  return (publishedAt && readDate(publishedAt)?.label) || "Not yet published";
}

/** "$45,000", or "Not entered" for a draft with no reward. */
export function rewardLabel(reward: number): string {
  return reward > 0 ? `$${reward.toLocaleString("en-CA")}` : "Not entered";
}

/** Today, as opportunity dates count days: in Pacific time (R-1.14). */
export function todayInPacific(): string {
  return pacificDayOf(new Date());
}

/** "Saved", for the history: a moment to the minute, as the users domain shows moments. */
export function momentLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
