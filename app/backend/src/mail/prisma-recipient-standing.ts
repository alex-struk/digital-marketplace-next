import { PrismaService } from "../prisma/prisma.service";
import { RecipientStanding } from "./mailer";

/**
 * The accounts' standing, read from `users` as each message goes. An address is held only by
 * deactivated accounts when every account holding it is inactive, whichever way it was
 * deactivated; the same address on an active account of another kind keeps it (R-6.17).
 */
export class PrismaRecipientStanding implements RecipientStanding {
  constructor(private readonly prisma: PrismaService) {}

  async deactivatedOnly(addresses: readonly string[]): Promise<ReadonlySet<string>> {
    const wanted = [...new Set(addresses.map((address) => address.toLowerCase()))];
    if (wanted.length === 0) return new Set();
    const rows = await this.prisma.$queryRaw<{ email: string }[]>`
      SELECT LOWER(u."email") AS "email" FROM "users" u
      WHERE LOWER(u."email") = ANY(${wanted}::text[])
      GROUP BY LOWER(u."email")
      HAVING bool_and(u."status" <> 'ACTIVE')`;
    return new Set(rows.map((row) => row.email));
  }
}
