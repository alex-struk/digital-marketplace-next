import { Program } from "@rules/opportunities";
import { counterName } from "@rules/opportunity-list";
import { api } from "./client";

/**
 * Watching an opportunity, counting a view of its public page, and the figures for what has been
 * awarded (decision record 0034).
 */

/** Starts or ends watching; true when the service did as asked (R-1.5). */
export async function setWatching(program: Program, opportunityId: string, watching: boolean): Promise<boolean> {
  try {
    if (watching) {
      const body = { opportunity: opportunityId };
      const { response } =
        program === "code-with-us"
          ? await api.POST("/api/subscribers/code-with-us", { body })
          : program === "sprint-with-us"
            ? await api.POST("/api/subscribers/sprint-with-us", { body })
            : await api.POST("/api/subscribers/team-with-us", { body });
      return response.ok;
    }
    const params = { path: { id: opportunityId } };
    const { response } =
      program === "code-with-us"
        ? await api.DELETE("/api/subscribers/code-with-us/{id}", { params })
        : program === "sprint-with-us"
          ? await api.DELETE("/api/subscribers/sprint-with-us/{id}", { params })
          : await api.DELETE("/api/subscribers/team-with-us/{id}", { params });
    return response.ok;
  } catch {
    return false;
  }
}

/** Counts one view of an opportunity's public page (R-1.6). Nothing the reader sees depends on it. */
export async function countView(program: Program, opportunityId: string): Promise<void> {
  try {
    await api.PUT("/api/counters/{id}", { params: { path: { id: counterName(program, opportunityId, "views") } } });
  } catch {
    // A view that could not be counted changes nothing for the reader.
  }
}

export interface AwardedFigures {
  readonly count: number;
  readonly value: number;
}

/** What has been awarded through the service, or null when it could not be read. */
export async function fetchAwardedFigures(): Promise<AwardedFigures | null> {
  try {
    const { data, response } = await api.GET("/api/metrics");
    const first = Array.isArray(data) ? (data[0] as Record<string, unknown> | undefined) : undefined;
    if (!response.ok || !first || typeof first.totalCount !== "number" || typeof first.totalAwarded !== "number") return null;
    return { count: first.totalCount, value: first.totalAwarded };
  } catch {
    return null;
  }
}
