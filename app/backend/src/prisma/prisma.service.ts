import {
  Inject,
  Injectable,
  Logger,
  Optional,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/** Where a caller may hand the client its settings instead of the environment. */
export const PRISMA_OPTIONS = Symbol("PrismaOptions");

export type PrismaOptions = ConstructorParameters<typeof PrismaClient>[0];

/**
 * The one connection to the kept database. Prisma reads and writes it; it never migrates it
 * (decision record 0001).
 *
 * A database that is not there yet does not stop the service from starting. `/status` reports
 * that the service is up, which is a different question from whether its database is, and the
 * first query after the database comes back opens the connection.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Optional() @Inject(PRISMA_OPTIONS) options?: PrismaOptions) {
    super(options);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
    } catch {
      this.logger.warn("the database is not answering yet");
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
