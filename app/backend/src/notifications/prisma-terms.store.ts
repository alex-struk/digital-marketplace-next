import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TermsStore, VendorToTell } from "./terms-announcement";

/**
 * Vendors' acceptances as the kept `users` table holds them: `acceptedTermsAt` is the
 * acceptance that stands, and `lastAcceptedTermsAt`, which a withdrawal leaves alone, is when
 * terms were last accepted at all (R-4.16).
 */
@Injectable()
export class PrismaTermsStore implements TermsStore {
  constructor(private readonly prisma: PrismaService) {}

  async withdrawVendorAcceptances(): Promise<number> {
    const { count } = await this.prisma.users.updateMany({
      where: { type: "VENDOR", acceptedTermsAt: { not: null } },
      data: { acceptedTermsAt: null, updatedAt: new Date() },
    });
    return count;
  }

  async activeVendors(): Promise<VendorToTell[]> {
    return this.prisma.users.findMany({
      where: { type: "VENDOR", status: "ACTIVE" },
      select: { id: true, email: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }
}
