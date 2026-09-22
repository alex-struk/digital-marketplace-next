import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import type { Response } from "express";

/**
 * Every refusal this service answers with takes one shape: a status and a list of reasons.
 *
 * Refusals that reach a person are prose on a screen; this is what something reading the
 * service's answers directly sees (spec/contract/observables.yaml, "refusals"). Keeping one
 * shape here is what lets two refusals be compared rather than merely both be seen to
 * happen.
 */
export interface Refusal {
  readonly errors: readonly string[];
}

interface ValidationLikeError {
  status?: number;
  statusCode?: number;
  message?: string;
  errors?: ReadonlyArray<{ message?: string; path?: string }>;
}

export function refusalFor(exception: unknown): {
  status: number;
  body: Refusal;
} {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();
    if (typeof response === "string") {
      return { status, body: { errors: [response] } };
    }
    const asRecord = response as Record<string, unknown>;
    const message = asRecord.message;
    if (Array.isArray(message)) {
      return { status, body: { errors: message.map(String) } };
    }
    if (typeof message === "string") {
      return { status, body: { errors: [message] } };
    }
    return { status, body: { errors: [exception.name] } };
  }

  // The boundary validator's own refusals, given the same shape as everything else.
  const validation = exception as ValidationLikeError;
  const status = validation?.status ?? validation?.statusCode;
  if (typeof status === "number" && status >= 400 && status < 600) {
    const errors = (validation.errors ?? [])
      .map((error) =>
        [error.path, error.message].filter(Boolean).join(" ").trim(),
      )
      .filter((line) => line.length > 0);
    return {
      status,
      body: {
        errors: errors.length > 0 ? errors : [validation.message ?? "Refused."],
      },
    };
  }

  return { status: 500, body: { errors: ["The service could not answer."] } };
}

@Catch()
export class RefusalFilter implements ExceptionFilter {
  constructor(private readonly report: (line: string) => void = (line) =>
    process.stderr.write(line + "\n")) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = refusalFor(exception);
    if (status >= 500) {
      // The failure reaches the operational log; no request body, address or token does.
      this.report(
        JSON.stringify({
          level: "error",
          time: new Date().toISOString(),
          logger: "http",
          event: "service-fault",
          message:
            exception instanceof Error ? exception.message : String(exception),
        }),
      );
    }
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}
