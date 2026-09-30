import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AccountKind, AccountStatus } from "../rules/users";
import {
  DuplicateAccountError,
  NewAccount,
  ProfileChange,
  User,
  UserStore,
} from "./user";

interface StoredUser {
  readonly id: string;
  readonly type: string;
  readonly status: string;
  readonly name: string;
  readonly email: string | null;
  readonly jobTitle: string | null;
  readonly avatarImageFile: string | null;
  readonly notificationsOn: Date | null;
  readonly acceptedTermsAt: Date | null;
  readonly lastAcceptedTermsAt: Date | null;
  readonly idpUsername: string;
  readonly deactivatedOn: Date | null;
  readonly deactivatedBy: string | null;
  readonly capabilities: readonly string[];
}

/** Accounts as the kept `users` table holds them. */
@Injectable()
export class PrismaUserStore implements UserStore {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return asUser(await this.prisma.users.findUnique({ where: { id } }));
  }

  async findByIdentity(
    idpId: string,
    kinds: readonly AccountKind[],
  ): Promise<User | null> {
    const row = await this.prisma.users.findFirst({
      where: { idpId, type: { in: [...kinds] } },
      orderBy: { createdAt: "asc" },
    });
    return asUser(row);
  }

  async create(account: NewAccount, at: Date): Promise<User> {
    if (await this.addressHeld(account.type, account.email, null)) {
      throw new DuplicateAccountError("An account of this kind already holds that address.");
    }
    return this.guarded(() =>
      this.prisma.users.create({
        data: {
          id: randomUUID(),
          createdAt: at,
          updatedAt: at,
          type: account.type,
          status: "ACTIVE",
          name: account.name,
          email: account.email,
          // Created with no job title and no picture (R-4.1), and with no request for
          // new-opportunity notices and no agreement to the terms (R-6.20, R-4.3).
          jobTitle: "",
          avatarImageFile: null,
          notificationsOn: null,
          acceptedTermsAt: null,
          lastAcceptedTermsAt: null,
          idpUsername: account.idpUsername,
          idpId: account.idpId,
          capabilities: [],
        },
      }),
    );
  }

  async updateProfile(id: string, change: ProfileChange, at: Date): Promise<User> {
    const current = await this.prisma.users.findUnique({
      where: { id },
      select: { type: true },
    });
    if (current && (await this.addressHeld(current.type, change.email, id))) {
      throw new DuplicateAccountError("An account of this kind already holds that address.");
    }
    return this.guarded(() =>
      this.prisma.users.update({
        where: { id },
        data: {
          name: change.name,
          email: change.email,
          jobTitle: change.jobTitle,
          updatedAt: at,
        },
      }),
    );
  }

  async acceptTerms(id: string, at: Date): Promise<User> {
    const row = await this.prisma.users.update({
      where: { id },
      data: { acceptedTermsAt: at, lastAcceptedTermsAt: at, updatedAt: at },
    });
    return asUser(row) as User;
  }

  async setNotifications(id: string, since: Date | null, at: Date): Promise<User> {
    const row = await this.prisma.users.update({
      where: { id },
      data: { notificationsOn: since, updatedAt: at },
    });
    return asUser(row) as User;
  }

  /**
   * Whether another account of the kind already holds the address (R-4.6). Asked before
   * writing so the ordinary case is a plain answer; the table's own constraint still refuses
   * the write if two arrive at once. Accounts with no address never collide.
   */
  private async addressHeld(
    type: string,
    email: string | null,
    exceptId: string | null,
  ): Promise<boolean> {
    if (!email) return false;
    const holder = await this.prisma.users.findFirst({
      where: { type, email, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    });
    return holder !== null;
  }

  /** A write that would break one of the three uniqueness rules is reported as such (R-4.6). */
  private async guarded(write: () => Promise<StoredUser>): Promise<User> {
    try {
      return asUser(await write()) as User;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new DuplicateAccountError("An account of this kind already holds that identity or address.");
      }
      throw error;
    }
  }
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function asUser(row: StoredUser | null): User | null {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type as AccountKind,
    status: row.status as AccountStatus,
    name: row.name,
    email: row.email,
    jobTitle: row.jobTitle,
    avatarImageFile: row.avatarImageFile,
    notificationsOn: iso(row.notificationsOn),
    acceptedTermsAt: iso(row.acceptedTermsAt),
    lastAcceptedTermsAt: iso(row.lastAcceptedTermsAt),
    idpUsername: row.idpUsername,
    deactivatedOn: iso(row.deactivatedOn),
    deactivatedBy: row.deactivatedBy,
    capabilities: [...row.capabilities],
  };
}
