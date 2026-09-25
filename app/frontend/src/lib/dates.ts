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
 * A date as a screen shows it, and as a `<time datetime>` carries it.
 *
 * Dates are read in UTC so that the same record reads the same way wherever it is looked at,
 * which is also what makes them assertable.
 */
export function readDate(iso: string): { dateTime: string; label: string } | null {
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return null;
  const year = moment.getUTCFullYear();
  const month = moment.getUTCMonth();
  const day = moment.getUTCDate();
  const dateTime = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { dateTime, label: `${MONTHS[month]} ${day}, ${year}` };
}
