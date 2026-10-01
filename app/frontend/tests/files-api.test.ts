import { afterEach, describe, expect, it, vi } from "vitest";
import { useTokensFrom } from "../src/api/client";
import { downloadFile } from "../src/api/files";

/**
 * Saving a stored file to the person's device: fetched by the app with the person's bearer
 * token, so a file only they may read is still theirs to save (R-8.10).
 */
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  useTokensFrom(async () => null);
});

describe("downloading a stored file", () => {
  it("asks for its content with the person's token, and saves it under its name", async () => {
    const asked: { url: string; authorization: string | null }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (request: Request) => {
        asked.push({ url: request.url, authorization: request.headers.get("authorization") });
        return new Response("%PDF-1.4", { status: 200, headers: { "content-type": "application/pdf" } });
      }),
    );
    useTokensFrom(async () => "a-token");
    const made: string[] = [];
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn(() => {
        made.push("blob:saved");
        return "blob:saved";
      }),
      revokeObjectURL: vi.fn(),
    }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    expect(await downloadFile("5b2e0c3a-8d41-4f6e-a1c2-000000000801", "terms.pdf")).toBe(true);

    expect(asked).toEqual([
      {
        url: `${window.location.origin}/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000801?type=blob`,
        authorization: "Bearer a-token",
      },
    ]);
    expect(made).toEqual(["blob:saved"]);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("says so when the service refuses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"errors":["no"]}', { status: 401 })));
    expect(await downloadFile("5b2e0c3a-8d41-4f6e-a1c2-000000000801", "terms.pdf")).toBe(false);
  });
});
