// A thin client over Mailpit's HTTP API (the mail catcher `spec/contract/observables.yaml`
// names for the `email` observable). Constructed with `SDLC_MAIL_API` unread — see
// index.ts — so a test that never touches `mail` is never forced to depend on a mail
// catcher being up; the missing-URL error only fires on first actual use.
export class Mail {
  constructor(private readonly apiUrl: string | undefined) {}

  private base(): string {
    if (!this.apiUrl) {
      throw new Error("SDLC_MAIL_API is not set; a test that uses the `mail` fixture needs a mail catcher target");
    }
    return this.apiUrl;
  }

  // Mailpit's search endpoint: https://mailpit.axllent.org/docs/api-v1/ (`GET
  // /api/v1/search?query=to:<address>`). Only the fields a test actually reads are typed.
  async messagesTo(address: string): Promise<Array<{ Subject: string; Snippet: string; To: unknown; ID: string }>> {
    const res = await fetch(`${this.base()}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`);
    const body = (await res.json()) as { messages?: Array<{ Subject: string; Snippet: string; To: unknown; ID: string }> };
    return body.messages ?? [];
  }

  async latestTo(address: string) {
    const messages = await this.messagesTo(address);
    return messages[0] ?? null;
  }

  async clear(): Promise<void> {
    await fetch(`${this.base()}/api/v1/messages`, { method: "DELETE" });
  }
}
