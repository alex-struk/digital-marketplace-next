import { createServer, Server, Socket } from "node:net";

/**
 * The smallest mail server that will take delivery, for tests: it speaks just enough SMTP for
 * a client to hand a message over, and keeps what it was handed. It can also be told to
 * refuse, the way the sandbox's mail catcher refuses while its fault is in force.
 */
export interface CaughtMail {
  readonly from: string;
  readonly recipients: string[];
  readonly data: string;
}

export class SmtpCatcher {
  readonly caught: CaughtMail[] = [];
  refusing = false;
  private server: Server | null = null;
  port = 0;

  async start(): Promise<void> {
    this.server = createServer((socket) => this.converse(socket));
    await new Promise<void>((resolve) => this.server?.listen(0, "127.0.0.1", resolve));
    const address = this.server.address();
    this.port = typeof address === "object" && address ? address.port : 0;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => (this.server ? this.server.close(() => resolve()) : resolve()));
  }

  private converse(socket: Socket): void {
    let buffer = "";
    let inData = false;
    let current: { from: string; recipients: string[]; data: string } = { from: "", recipients: [], data: "" };
    const say = (line: string) => socket.write(`${line}\r\n`);
    say("220 catcher ready");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      for (;;) {
        if (inData) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end === -1) return;
          current.data = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          inData = false;
          this.caught.push(current);
          current = { from: "", recipients: [], data: "" };
          say("250 accepted");
          continue;
        }
        const end = buffer.indexOf("\r\n");
        if (end === -1) return;
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const verb = line.slice(0, 4).toUpperCase();
        if (verb === "EHLO" || verb === "HELO") say("250 catcher");
        else if (verb === "MAIL") {
          if (this.refusing) say("451 refusing for now");
          else {
            current.from = line;
            say("250 ok");
          }
        } else if (verb === "RCPT") {
          current.recipients.push(line.replace(/^RCPT TO:\s*/i, "").replace(/[<>]/g, ""));
          say("250 ok");
        } else if (verb === "DATA") {
          inData = true;
          say("354 go ahead");
        } else if (verb === "QUIT") {
          say("221 bye");
          socket.end();
        } else say("250 ok");
      }
    });
  }
}
