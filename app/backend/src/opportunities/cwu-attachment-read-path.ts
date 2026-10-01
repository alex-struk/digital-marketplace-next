import { Injectable } from "@nestjs/common";
import { FileReadPath } from "../files/file";
import { PrismaService } from "../prisma/prisma.service";
import { FileReader } from "../rules/files";
import { isStatusOf, mayReadOpportunity } from "../rules/opportunities";

/**
 * A file attached to a Code With Us opportunity is readable by whoever may read the opportunity:
 * anyone once it is published, and before then its creator and administrators (R-8.20, R-8.25).
 * Only the opportunity's current version counts, so a file taken off it stops being readable
 * through it. Nothing is recorded against the file itself (R-8.19): the opportunity is asked every
 * time, so the file becomes readable exactly when the opportunity does.
 */
@Injectable()
export class CwuAttachmentReadPath implements FileReadPath {
  constructor(private readonly prisma: PrismaService) {}

  async mayRead(fileId: string, reader: FileReader | null): Promise<boolean> {
    const attached = await this.prisma.cwuOpportunityAttachments.findMany({
      where: { file: fileId },
      select: {
        opportunityVersion: true,
        cwuOpportunityVersions: {
          select: {
            cwuOpportunities: {
              select: {
                createdBy: true,
                cwuOpportunityVersions: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } },
                cwuOpportunityStatuses: {
                  where: { status: { not: null } },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  select: { status: true },
                },
              },
            },
          },
        },
      },
    });
    return attached.some(({ opportunityVersion, cwuOpportunityVersions: { cwuOpportunities: opportunity } }) => {
      const current = opportunity.cwuOpportunityVersions[0]?.id;
      const status = opportunity.cwuOpportunityStatuses[0]?.status;
      if (current !== opportunityVersion || !isStatusOf("code-with-us", status)) return false;
      return mayReadOpportunity(reader, { status, createdBy: opportunity.createdBy });
    });
  }
}
