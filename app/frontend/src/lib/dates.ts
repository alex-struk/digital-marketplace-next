import { pacificClockOf } from "@rules/opportunities";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/**
 * The day a moment fell on, as a screen shows it, and as a `<time datetime>` carries it.
 *
 * The day is the one it was in Pacific time, as every date and deadline in the service is
 * (R-1.14, R-1.23; decision record 0037): something published at 7:26 p.m. Pacific on October 1
 * was published on October 1, though it was already October 2 in UTC. The same record reads the
 * same way wherever the browser looking at it is.
 */
export function readDate(iso: string): { dateTime: string; label: string } | null {
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return null;
  const { year, month, day } = pacificClockOf(moment);
  return dayLabelled(year, month, day);
}

function dayLabelled(year: number, month: number, day: number): { dateTime: string; label: string } {
  const dateTime = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { dateTime, label: `${MONTHS[month - 1]} ${day}, ${year}` };
}

/**
 * A calendar day, written YYYY-MM-DD, as a screen shows it: "October 2, 2026". An opportunity's
 * dates are days, not moments, so they are read as written and not converted (R-1.14).
 */
export function readDay(day: string): { dateTime: string; label: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return null;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return null;
  return { dateTime: day, label: `${month} ${Number(match[3])}, ${Number(match[1])}` };
}

/**
 * A moment as a screen shows it, to the minute: "September 1, 2026 at 10:30 a.m.". Read in UTC,
 * day and time alike, as it has been since the managing screens first showed one (decision
 * record 0037 says why it was left so).
 */
export function readMoment(iso: string): { dateTime: string; label: string } | null {
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return null;
  const date = dayLabelled(moment.getUTCFullYear(), moment.getUTCMonth() + 1, moment.getUTCDate());
  const hours = moment.getUTCHours();
  const minutes = String(moment.getUTCMinutes()).padStart(2, "0");
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return {
    dateTime: moment.toISOString(),
    label: `${date.label} at ${hour}:${minutes} ${hours < 12 ? "a.m." : "p.m."}`,
  };
}
