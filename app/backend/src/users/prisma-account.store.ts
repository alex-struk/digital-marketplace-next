import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AccountKind, AccountStatus } from "../rules/users";
import {
  Account,
  AccountChange,
  AccountStore,
  DuplicateAccount,
  NewAccount,
} from "./account";

interface StoredUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: string;
  status: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
  avatarImageFile: string | null;
  notificationsOn: Date | null;
  acceptedTermsAt: Date | null;
  lastAcceptedTermsAt: Date | null;
  idpUsername: string;
  idpId: string;
  deactivatedOn: Date | null;
  deactivatedBy: string | null;
  capabilities: string[];
}

const instant = (value: Date | null) => (value ? value.toISOString() : null);

export function asAccount(row: StoredUser): Account {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    type: row.type as AccountKind,
    status: row.status as AccountStatus,
    name: row.name,
    email: row.email,
    jobTitle: row.jobTitle,
    avatarImageFile: row.avatarImageFile,
    notificationsOn: instant(row.notificationsOn),
    acceptedTermsAt: instant(row.acceptedTermsAt),
    lastAcceptedTermsAt: instant(row.lastAcceptedTermsAt),
    idpUsername: row.idpUsername,
    deactivatedOn: instant(row.deactivatedOn),
    deactivatedBy: row.deactivatedBy,
    capabilities: row.capabilities,
  };
}

/** A unique constraint said no: one of (type, idpId), (type, idpUsername) or (type, email). */
function isDuplicate(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

/**
 * Accounts as the kept schema holds them. A person is found by the username they sign in
 * with, which the schema stores as both `idpUsername` and `idpId`; the pair is unique within
 * each kind of account (R-4.6), as is the email address.
 */
@Injectable()
export class PrismaAccountStore implements AccountStore {
  constructor(private readonly prisma: PrismaService) {}

  async findBySignIn(
    username: string,
    kinds: readonly AccountKind[],
  ): Promise<Account | null> {
    const row = await this.prisma.users.findFirst({
      where: { idpId: username, type: { in: [...kinds] } },
      orderBy: { createdAt: "asc" },
    });
    return row ? asAccount(row) : null;
  }

  async findById(id: string): Promise<Account | null> {
    const row = await this.prisma.users.findUnique({ where: { id } });
    return row ? asAccount(row) : null;
  }

  async create(account: NewAccount): Promise<Account> {
    const now = new Date();
    try {
      const row = await this.prisma.users.create({
        data: {
          id: randomUUID(),
          createdAt: now,
          updatedAt: now,
          type: account.type,
          status: "ACTIVE",
          name: account.name,
          email: account.email,
          // Made with no job title and no picture (R-4.1), and with new-opportunity notices
          // off until the person asks for them (R-6.20).
          jobTitle: null,
          avatarImageFile: null,
          notificationsOn: null,
          acceptedTermsAt: null,
          lastAcceptedTermsAt: null,
          idpUsername: account.idpUsername,
          idpId: account.idpUsername,
          capabilities: [],
        },
      });
      return asAccount(row);
    } catch (error) {
      if (isDuplicate(error)) throw new DuplicateAccount();
      throw error;
    }
  }

  async update(id: string, change: AccountChange): Promise<Account> {
    try {
      const row = await this.prisma.users.update({
        where: { id },
        data: { ...change, updatedAt: new Date() },
      });
      return asAccount(row);
    } catch (error) {
      if (isDuplicate(error)) throw new DuplicateAccount();
      throw error;
    }
  }
}
