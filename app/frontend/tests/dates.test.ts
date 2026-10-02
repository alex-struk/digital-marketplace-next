import { describe, expect, it } from "vitest";
import { readDate, readDay, readMoment } from "../src/lib/dates";

/** How a screen writes a date (R-1.14, R-1.23; decision record 0037). */
describe("dates as a screen shows them", () => {
  it("shows the day a moment fell on in Pacific time, not in UTC", () => {
    // 7:26 p.m. Pacific on October 1 is already October 2 in UTC.
    expect(readDate("2026-10-02T02:26:00.000Z")).toEqual({ dateTime: "2026-10-01", label: "October 1, 2026" });
    expect(readDate("2026-10-01T17:00:00.000Z")).toEqual({ dateTime: "2026-10-01", label: "October 1, 2026" });
    expect(readDate("2026-09-02T06:59:00.000Z")?.label).toBe("September 1, 2026");
    expect(readDate("2026-09-02T07:00:00.000Z")?.label).toBe("September 2, 2026");
  });

  it("reads nothing from something that is not a moment", () => {
    expect(readDate("not a date")).toBeNull();
    expect(readMoment("")).toBeNull();
  });

  it("reads a calendar day as written", () => {
    expect(readDay("2026-10-02")).toEqual({ dateTime: "2026-10-02", label: "October 2, 2026" });
    expect(readDay("2026-13-02")).toBeNull();
  });

  it("shows a moment to the minute", () => {
    expect(readMoment("2026-09-30T17:00:00.000Z")).toEqual({
      dateTime: "2026-09-30T17:00:00.000Z",
      label: "September 30, 2026 at 5:00 p.m.",
    });
  });
});
