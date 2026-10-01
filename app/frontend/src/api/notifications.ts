import { api } from "./client";

/**
 * An administrator announcing that the service's terms and conditions have changed (R-6.23).
 * The service answers once every vendor's acceptance is withdrawn, before any message has been
 * sent (R-6.24), so "announced" says only that; nothing reports how delivery went.
 */
export async function announceUpdatedTerms(): Promise<"announced" | "failed"> {
  try {
    const { response } = await api.POST("/api/emailNotifications", { body: { tag: "updateTerms" } });
    return response.ok ? "announced" : "failed";
  } catch {
    return "failed";
  }
}
