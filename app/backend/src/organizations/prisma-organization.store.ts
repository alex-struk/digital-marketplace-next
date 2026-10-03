import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AffiliationEventKind, MembershipStatus, MembershipType } from "../rules/organizations";
import { AccountKind, AccountStatus } from "../rules/users";
import {
  MembershipChange,
  NewOrganization,
  OrganizationChange,
  OrganizationStore,
  Person,
  StoredOrganization,
} from "./organization";

const including = {
  affiliations: {
    select: {
      id: true,
      createdAt: true,
      membershipType: true,
      membershipStatus: true,
      users: { select: { id: true, name: true, email: true, type: true, capabilities: true } },
      affiliationEvents: {
        select: {
          id: true,
          event: true,
          createdAt: true,
          users: { select: { id: true, name: true } },
        },
      },
    },
  },
  twuOrganizationServiceAreas: { select: { serviceAreas: { select: { serviceArea: true } } } },
} as const;

interface Row {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  legalName: string;
  logoImageFile: string | null;
  websiteUrl: string | null;
  streetAddress1: string;
  streetAddress2: string | null;
  city: string;
  region: string;
  mailCode: string;
  country: string;
  contactName: string;
  contactTitle: string | null;
  contactEmail: string;
  contactPhone: string | null;
  active: boolean;
  deactivatedOn: Date | null;
  deactivatedBy: string | null;
  acceptedSWUTerms: Date | null;
  acceptedTWUTerms: Date | null;
  affiliations: {
    id: string;
    createdAt: Date;
    membershipType: string;
    membershipStatus: string;
    users: { id: string; name: string; email: string | null; type: string; capabilities: string[] };
    affiliationEvents: { id: string; event: string; createdAt: Date; users: { id: string; name: string } | null }[];
  }[];
  twuOrganizationServiceAreas: { serviceAreas: { serviceArea: string } }[];
}

const instant = (value: Date | null) => (value ? value.toISOString() : null);

function asOrganization(row: Row): StoredOrganization {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    legalName: row.legalName,
    logoImageFile: row.logoImageFile,
    websiteUrl: row.websiteUrl,
    streetAddress1: row.streetAddress1,
    streetAddress2: row.streetAddress2,
    city: row.city,
    region: row.region,
    mailCode: row.mailCode,
    country: row.country,
    contactName: row.contactName,
    contactTitle: row.contactTitle,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    active: row.active,
    deactivatedOn: instant(row.deactivatedOn),
    deactivatedBy: row.deactivatedBy,
    acceptedSWUTerms: instant(row.acceptedSWUTerms),
    acceptedTWUTerms: instant(row.acceptedTWUTerms),
    members: row.affiliations.map((affiliation) => ({
      affiliationId: affiliation.id,
      userId: affiliation.users.id,
      name: affiliation.users.name,
      email: affiliation.users.email,
      type: affiliation.users.type as AccountKind,
      capabilities: affiliation.users.capabilities,
      membershipType: affiliation.membershipType as MembershipType,
      membershipStatus: affiliation.membershipStatus as MembershipStatus,
      createdAt: affiliation.createdAt.toISOString(),
    })),
    serviceAreas: row.twuOrganizationServiceAreas.map((area) => area.serviceAreas.serviceArea).sort(),
    events: row.affiliations.flatMap((affiliation) =>
      affiliation.affiliationEvents.map((event) => ({
        id: event.id,
        affiliationId: affiliation.id,
        event: event.event as AffiliationEventKind,
        createdAt: event.createdAt.toISOString(),
        createdBy: event.users ? { id: event.users.id, name: event.users.name } : null,
      })),
    ),
  };
}

/** The kept `organizations`, `affiliations` and `twuOrganizationServiceAreas` tables. */
@Injectable()
export class PrismaOrganizationStore implements OrganizationStore {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<StoredOrganization[]> {
    const rows = await this.prisma.organizations.findMany({ where: { active: true }, include: including });
    return rows.map(asOrganization);
  }

  async find(id: string): Promise<StoredOrganization | null> {
    const row = await this.prisma.organizations.findUnique({ where: { id }, include: including });
    return row ? asOrganization(row) : null;
  }

  async affiliatedWith(userId: string): Promise<StoredOrganization[]> {
    const rows = await this.prisma.organizations.findMany({
      where: { affiliations: { some: { user: userId } } },
      include: including,
    });
    return rows.map(asOrganization);
  }

  async create(organization: NewOrganization): Promise<StoredOrganization> {
    const now = new Date();
    const id = randomUUID();
    const { ownerId, ...fields } = organization;
    await this.prisma.$transaction([
      this.prisma.organizations.create({
        data: { ...fields, id, createdAt: now, updatedAt: now, active: true },
      }),
      this.prisma.affiliations.create({
        data: {
          id: randomUUID(),
          user: ownerId,
          organization: id,
          createdAt: now,
          updatedAt: now,
          membershipType: "OWNER",
          membershipStatus: "ACTIVE",
        },
      }),
    ]);
    return (await this.find(id)) as StoredOrganization;
  }

  async update(id: string, change: OrganizationChange): Promise<StoredOrganization> {
    const row = await this.prisma.organizations.update({
      where: { id },
      data: { ...change, updatedAt: new Date() },
      include: including,
    });
    return asOrganization(row);
  }

  async findByMembership(affiliationId: string): Promise<StoredOrganization | null> {
    const affiliation = await this.prisma.affiliations.findUnique({
      where: { id: affiliationId },
      select: { organization: true },
    });
    return affiliation ? this.find(affiliation.organization) : null;
  }

  async peopleByEmail(email: string): Promise<Person[]> {
    const rows = await this.prisma.users.findMany({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, name: true, email: true, type: true, status: true },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      type: row.type as AccountKind,
      status: row.status as AccountStatus,
    }));
  }

  async invite(organizationId: string, userId: string, membershipType: MembershipType): Promise<StoredOrganization> {
    const now = new Date();
    await this.prisma.affiliations.create({
      data: {
        id: randomUUID(),
        user: userId,
        organization: organizationId,
        createdAt: now,
        updatedAt: now,
        membershipType,
        membershipStatus: "PENDING",
      },
    });
    return (await this.find(organizationId)) as StoredOrganization;
  }

  async changeMembership(affiliationId: string, change: MembershipChange): Promise<StoredOrganization> {
    const now = new Date();
    const { event, ...fields } = change;
    const [affiliation] = await this.prisma.$transaction([
      this.prisma.affiliations.update({
        where: { id: affiliationId },
        data: { ...fields, updatedAt: now },
        select: { organization: true },
      }),
      ...(event
        ? [
            this.prisma.affiliationEvents.create({
              data: { id: randomUUID(), affiliation: affiliationId, event: event.kind, createdAt: now, createdBy: event.by },
            }),
          ]
        : []),
    ]);
    return (await this.find((affiliation as { organization: string }).organization)) as StoredOrganization;
  }

  async transferOwnership(organizationId: string, toAffiliationId: string, by: string): Promise<StoredOrganization> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.affiliations.updateMany({
        where: { organization: organizationId, membershipType: "OWNER", id: { not: toAffiliationId } },
        data: { membershipType: "MEMBER", updatedAt: now },
      }),
      this.prisma.affiliations.update({
        where: { id: toAffiliationId },
        data: { membershipType: "OWNER", updatedAt: now },
      }),
      this.prisma.affiliationEvents.create({
        data: { id: randomUUID(), affiliation: toAffiliationId, event: "OWNER_STATUS_GRANTED", createdAt: now, createdBy: by },
      }),
    ]);
    return (await this.find(organizationId)) as StoredOrganization;
  }

  async approveServiceAreas(organizationId: string, serviceAreas: readonly string[]): Promise<StoredOrganization> {
    const areas = await this.prisma.serviceAreas.findMany({
      where: { serviceArea: { in: [...serviceAreas] } },
      select: { id: true },
    });
    await this.prisma.$transaction([
      this.prisma.twuOrganizationServiceAreas.deleteMany({ where: { organization: organizationId } }),
      this.prisma.twuOrganizationServiceAreas.createMany({
        data: areas.map((area) => ({ organization: organizationId, serviceArea: area.id })),
      }),
      this.prisma.organizations.update({ where: { id: organizationId }, data: { updatedAt: new Date() } }),
    ]);
    return (await this.find(organizationId)) as StoredOrganization;
  }
}
