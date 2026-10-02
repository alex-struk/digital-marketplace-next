import { Injectable } from "@nestjs/common";
import { FileReadPath } from "../files/file";
import { PrismaService } from "../prisma/prisma.service";
import { FileReader } from "../rules/files";
import { isStatusOf, mayManageOpportunity } from "../rules/opportunities";

/**
 * A file carried by a private note on a Code With Us or Sprint With Us opportunity's history is
 * readable by whoever may read that history: the opportunity's author and administrators, and
 * nobody else, whatever state it is in (R-1.33). As with an opportunity's own attachments,
 * nothing is recorded against the file itself; the opportunity is asked every time.
 */
@Injectable()
export class NoteAttachmentReadPath implements FileReadPath {
  constructor(private readonly prisma: PrismaService) {}

  async mayRead(fileId: string, reader: FileReader | null): Promise<boolean> {
    if (!reader) return false;
    const latest = { where: { status: { not: null } }, orderBy: { createdAt: "desc" }, take: 1, select: { status: true } } as const;
    const [codeWithUs, sprintWithUs] = await Promise.all([
      this.prisma.cwuOpportunityNoteAttachments.findMany({
        where: { file: fileId },
        select: {
          cwuOpportunityStatuses: {
            select: { cwuOpportunities: { select: { createdBy: true, cwuOpportunityStatuses: latest } } },
          },
        },
      }),
      this.prisma.swuOpportunityNoteAttachments.findMany({
        where: { file: fileId },
        select: {
          swuOpportunityStatuses: {
            select: { swuOpportunities: { select: { createdBy: true, swuOpportunityStatuses: latest } } },
          },
        },
      }),
    ]);
    const opportunities = [
      ...codeWithUs.map(({ cwuOpportunityStatuses: { cwuOpportunities: o } }) => ({
        program: "code-with-us" as const,
        createdBy: o.createdBy,
        status: o.cwuOpportunityStatuses[0]?.status,
      })),
      ...sprintWithUs.map(({ swuOpportunityStatuses: { swuOpportunities: o } }) => ({
        program: "sprint-with-us" as const,
        createdBy: o.createdBy,
        status: o.swuOpportunityStatuses[0]?.status,
      })),
    ];
    return opportunities.some(
      ({ program, createdBy, status }) => isStatusOf(program, status) && mayManageOpportunity(reader, { status, createdBy }),
    );
  }
}
