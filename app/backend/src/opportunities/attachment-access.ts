import { OpportunityViewer } from "../rules/opportunities";

/** Whether a person may read a stored file, for an opportunity or a note that would carry it (R-8.22). */
export interface AttachmentAccess {
  mayRead(fileId: string, reader: OpportunityViewer | null): Promise<boolean>;
}

export const ATTACHMENT_ACCESS = Symbol("AttachmentAccess");
