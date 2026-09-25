import { LoggerService } from "@nestjs/common";

/**
 * One JSON object per line, and no personal data in any field (the stack profile,
 * constitution P3). Nothing here logs a request body, an address or a token.
 */
export class JsonLogger implements LoggerService {
  constructor(private readonly write: (line: string) => void = (line) =>
    process.stdout.write(line + "\n")) {}

  private emit(level: string, message: unknown, context?: unknown): void {
    this.write(
      JSON.stringify({
        level,
        time: new Date().toISOString(),
        logger: typeof context === "string" ? context : "app",
        message: typeof message === "string" ? message : String(message),
      }),
    );
  }

  log(message: unknown, context?: unknown): void {
    this.emit("info", message, context);
  }

  error(message: unknown, stackOrContext?: unknown, context?: unknown): void {
    this.emit("error", message, context ?? stackOrContext);
  }

  warn(message: unknown, context?: unknown): void {
    this.emit("warn", message, context);
  }

  debug(message: unknown, context?: unknown): void {
    this.emit("debug", message, context);
  }

  verbose(message: unknown, context?: unknown): void {
    this.emit("debug", message, context);
  }
}
