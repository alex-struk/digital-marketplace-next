import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { OpportunityStatus, isStatusOf, pacificDayOf, recordedInstantOf } from "../rules/opportunities";
import { CreationState, OtherProgramDraft, PanelMemberDraft, SWU_PHASES, SwuPhase } from "../rules/other-program-drafts";
import { Person } from "./cwu-opportunity";
import { OtherProgram, OtherProgramsStore, StoredDetails, StoredSummary } from "./other-programs";

const person = { select: { id: true, name: true } } as const;

const latestVersion = {
  orderBy: { createdAt: "desc" },
  take: 1,
  include: { users: person },
} as const;

const history = { where: { status: { not: null } }, orderBy: { createdAt: "desc" }, select: { status: true, createdAt: true } } as const;

const panelMembers = { orderBy: { order: "asc" }, include: { users: person } } as const;
const questions = { orderBy: { order: "asc" } } as const;

const swuInclude = { users: person, swuOpportunityVersions: latestVersion, swuOpportunityStatuses: history } as const;
const twuInclude = { users: person, twuOpportunityVersions: latestVersion, twuOpportunityStatuses: history } as const;

// One opportunity is read with what its program holds as well.
const swuWithDetails = {
  users: person,
  swuOpportunityStatuses: history,
  swuOpportunityVersions: {
    ...latestVersion,
    include: {
      users: person,
      swuOpportunityPhases: { orderBy: { startDate: "asc" } },
      swuTeamQuestions: questions,
      swuEvaluationPanelMembers: panelMembers,
    },
  },
} as const satisfies Prisma.swuOpportunitiesInclude;

const twuWithDetails = {
  users: person,
  twuOpportunityStatuses: history,
  twuOpportunityVersions: {
    ...latestVersion,
    include: {
      users: person,
      twuResources: { orderBy: { order: "asc" }, include: { serviceAreas: true } },
      twuResourceQuestions: questions,
      twuEvaluationPanelMembers: panelMembers,
    },
  },
} as const satisfies Prisma.twuOpportunitiesInclude;

interface Row {
  id: string;
  createdAt: Date;
  users: Person | null;
  statuses: { status: string | null; createdAt: Date }[];
  version:
    | {
        createdAt: Date;
        users: Person | null;
        title: string;
        teaser: string;
        location: string;
        remoteOk: boolean;
        remoteDesc: string;
        description: string;
        proposalDeadline: Date;
        assignmentDate: Date;
        startDate: Date | null;
        completionDate: Date | null;
        budget: number;
      }
    | undefined;
  details?: StoredDetails;
}

/**
 * Sprint With Us and Team With Us opportunities, read for the list and created from their interim
 * create screens: the opportunity, its newest version and the changes of state in its history,
 * and, for one opportunity, what its program holds — phases, questions, resources, weights and
 * panel. Changing one after it is created is slice 10's.
 */
@Injectable()
export class PrismaOtherProgramsStore implements OtherProgramsStore {
  constructor(private readonly prisma: PrismaService) {}

  async list(program: OtherProgram): Promise<StoredSummary[]> {
    const rows: Row[] =
      program === "sprint-with-us"
        ? (await this.prisma.swuOpportunities.findMany({ include: swuInclude, orderBy: { createdAt: "desc" } })).map(swuRow)
        : (await this.prisma.twuOpportunities.findMany({ include: twuInclude, orderBy: { createdAt: "desc" } })).map(twuRow);
    return rows.map((row) => asSummary(program, row)).filter((row): row is StoredSummary => row !== null);
  }

  async find(program: OtherProgram, id: string): Promise<StoredSummary | null> {
    if (program === "sprint-with-us") {
      const row = await this.prisma.swuOpportunities.findUnique({ where: { id }, include: swuWithDetails });
      return row ? asSummary(program, { ...swuRow(row), details: swuDetails(row.swuOpportunityVersions[0]) }) : null;
    }
    const row = await this.prisma.twuOpportunities.findUnique({ where: { id }, include: twuWithDetails });
    return row ? asSummary(program, { ...twuRow(row), details: twuDetails(row.twuOpportunityVersions[0]) }) : null;
  }

  async create(program: OtherProgram, content: OtherProgramDraft, status: CreationState, by: string): Promise<string> {
    const id = randomUUID();
    const version = randomUUID();
    const now = new Date();
    const common = {
      id: version,
      createdAt: now,
      createdBy: by,
      opportunity: id,
      title: content.title,
      teaser: content.teaser,
      remoteOk: content.remoteOk,
      remoteDesc: content.remoteDesc,
      location: content.location,
      description: content.description,
      proposalDeadline: recordedInstantOf(content.proposalDeadline),
      assignmentDate: recordedInstantOf(content.assignmentDate),
      questionsWeight: content.weights.questions,
      priceWeight: content.weights.price,
    };
    const questionRows = content.questions.map((question, order) => ({
      opportunityVersion: version,
      question: question.question,
      guideline: question.guideline,
      score: question.score,
      minimumScore: question.minimumScore,
      wordLimit: question.wordLimit,
      order,
      createdAt: now,
      createdBy: by,
    }));
    const statusRow = { id: randomUUID(), createdAt: now, createdBy: by, opportunity: id, status, event: null, note: null };
    await this.prisma.$transaction(async (tx) => {
      const panel = (await panelOf(tx, content.panel, by)).map((member, order) => ({ opportunityVersion: version, ...member, order }));
      if (program === "sprint-with-us") {
        await tx.swuOpportunities.create({ data: { id, createdAt: now, createdBy: by } });
        await tx.swuOpportunityVersions.create({
          data: {
            ...common,
            totalMaxBudget: content.budget,
            mandatorySkills: [...content.skills],
            codeChallengeWeight: content.weights.codeChallenge,
            scenarioWeight: content.weights.scenario,
          },
        });
        for (const phase of content.phases) {
          await tx.swuOpportunityPhases.create({
            data: {
              id: randomUUID(),
              opportunityVersion: version,
              phase: phase.phase,
              startDate: recordedInstantOf(phase.startDate),
              completionDate: recordedInstantOf(phase.completionDate),
              maxBudget: phase.maxBudget,
              createdAt: now,
              createdBy: by,
            },
          });
        }
        if (questionRows.length > 0) await tx.swuTeamQuestions.createMany({ data: questionRows });
        if (panel.length > 0) await tx.swuEvaluationPanelMembers.createMany({ data: panel });
        await tx.swuOpportunityStatuses.create({ data: statusRow });
      } else {
        await tx.twuOpportunities.create({ data: { id, createdAt: now, createdBy: by } });
        await tx.twuOpportunityVersions.create({
          data: {
            ...common,
            maxBudget: content.budget,
            startDate: recordedInstantOf(content.startDate ?? content.assignmentDate),
            completionDate: content.completionDate ? recordedInstantOf(content.completionDate) : null,
            challengeWeight: content.weights.challenge,
          },
        });
        const areas = await tx.serviceAreas.findMany({ select: { id: true, serviceArea: true } });
        const resources = content.resources.flatMap((resource) => {
          const area = areas.find((entry) => entry.serviceArea === resource.serviceArea);
          return area ? [{ serviceArea: area.id, targetAllocation: resource.targetAllocation }] : [];
        });
        if (resources.length > 0) {
          await tx.twuResources.createMany({
            data: resources.map((resource, order) => ({ id: randomUUID(), opportunityVersion: version, ...resource, order })),
          });
        }
        if (questionRows.length > 0) await tx.twuResourceQuestions.createMany({ data: questionRows });
        if (panel.length > 0) await tx.twuEvaluationPanelMembers.createMany({ data: panel });
        await tx.twuOpportunityStatuses.create({ data: statusRow });
      }
    });
    return id;
  }
}

/**
 * The panel as it is kept: only active public sector staff and administrators may sit on it, each
 * once, and a panel that names nobody is the author alone, as chair and evaluator.
 */
async function panelOf(tx: Prisma.TransactionClient, named: readonly PanelMemberDraft[], by: string): Promise<PanelMemberDraft[]> {
  if (named.length === 0) return [{ user: by, evaluator: true, chair: true }];
  const staff = await tx.users.findMany({
    where: { id: { in: named.map((member) => member.user) }, type: { in: ["GOV", "ADMIN"] }, status: "ACTIVE" },
    select: { id: true },
  });
  const allowed = new Set(staff.map((user) => user.id));
  const kept = named.filter((member) => allowed.has(member.user));
  return kept.length > 0 ? kept : [{ user: by, evaluator: true, chair: true }];
}

type SwuRecord = {
  id: string;
  createdAt: Date;
  users: Person | null;
  swuOpportunityStatuses: { status: string | null; createdAt: Date }[];
  swuOpportunityVersions: (Omit<NonNullable<Row["version"]>, "budget" | "startDate" | "completionDate"> & { totalMaxBudget: number })[];
};

type TwuRecord = {
  id: string;
  createdAt: Date;
  users: Person | null;
  twuOpportunityStatuses: { status: string | null; createdAt: Date }[];
  twuOpportunityVersions: (Omit<NonNullable<Row["version"]>, "budget"> & { maxBudget: number })[];
};

function swuRow(row: SwuRecord): Row {
  const version = row.swuOpportunityVersions[0];
  return {
    id: row.id,
    createdAt: row.createdAt,
    users: row.users,
    statuses: row.swuOpportunityStatuses,
    version: version && { ...version, budget: version.totalMaxBudget, startDate: null, completionDate: null },
  };
}

function twuRow(row: TwuRecord): Row {
  const version = row.twuOpportunityVersions[0];
  return {
    id: row.id,
    createdAt: row.createdAt,
    users: row.users,
    statuses: row.twuOpportunityStatuses,
    version: version && { ...version, budget: version.maxBudget },
  };
}

type SwuDetailed = Prisma.swuOpportunitiesGetPayload<{ include: typeof swuWithDetails }>["swuOpportunityVersions"][number];
type TwuDetailed = Prisma.twuOpportunitiesGetPayload<{ include: typeof twuWithDetails }>["twuOpportunityVersions"][number];

const isPhase = (value: string): value is SwuPhase => (SWU_PHASES as readonly string[]).includes(value);

function questionOf(row: { question: string; guideline: string; score: number; minimumScore: number | null; wordLimit: number }) {
  return { question: row.question, guideline: row.guideline, score: row.score, minimumScore: row.minimumScore, wordLimit: row.wordLimit };
}

function panelMemberOf(row: { users: Person; evaluator: boolean; chair: boolean }) {
  return { user: { id: row.users.id, name: row.users.name }, evaluator: row.evaluator, chair: row.chair };
}

function swuDetails(version: SwuDetailed | undefined): StoredDetails | undefined {
  if (!version) return undefined;
  return {
    skills: version.mandatorySkills,
    phases: version.swuOpportunityPhases.flatMap((phase) =>
      isPhase(phase.phase)
        ? [
            {
              phase: phase.phase,
              startDate: pacificDayOf(phase.startDate),
              completionDate: pacificDayOf(phase.completionDate),
              maxBudget: phase.maxBudget,
            },
          ]
        : [],
    ),
    questions: version.swuTeamQuestions.map(questionOf),
    resources: [],
    weights: {
      questions: version.questionsWeight,
      codeChallenge: version.codeChallengeWeight,
      scenario: version.scenarioWeight,
      challenge: 0,
      price: version.priceWeight,
    },
    panel: version.swuEvaluationPanelMembers.map(panelMemberOf),
  };
}

function twuDetails(version: TwuDetailed | undefined): StoredDetails | undefined {
  if (!version) return undefined;
  return {
    skills: [],
    phases: [],
    questions: version.twuResourceQuestions.map(questionOf),
    resources: version.twuResources.map((resource) => ({
      serviceArea: resource.serviceAreas.serviceArea,
      targetAllocation: resource.targetAllocation,
    })),
    weights: { questions: version.questionsWeight, codeChallenge: 0, scenario: 0, challenge: version.challengeWeight, price: version.priceWeight },
    panel: version.twuEvaluationPanelMembers.map(panelMemberOf),
  };
}

function asSummary(program: OtherProgram, row: Row): StoredSummary | null {
  const current = row.statuses[0];
  const { version } = row;
  if (!version || !current || !isStatusOf(program, current.status)) return null;
  const firstPublished = [...row.statuses].reverse().find((entry) => entry.status === "PUBLISHED");
  return {
    id: row.id,
    program,
    createdAt: row.createdAt,
    createdBy: row.users ? { id: row.users.id, name: row.users.name } : null,
    updatedAt: version.createdAt,
    updatedBy: version.users ? { id: version.users.id, name: version.users.name } : null,
    status: current.status as OpportunityStatus,
    publishedAt: firstPublished?.createdAt ?? null,
    title: version.title,
    teaser: version.teaser,
    location: version.location,
    remoteOk: version.remoteOk,
    remoteDesc: version.remoteDesc,
    description: version.description,
    proposalDeadline: pacificDayOf(version.proposalDeadline),
    assignmentDate: pacificDayOf(version.assignmentDate),
    startDate: version.startDate ? pacificDayOf(version.startDate) : null,
    completionDate: version.completionDate ? pacificDayOf(version.completionDate) : null,
    budget: version.budget,
    ...(row.details ? { details: row.details } : {}),
  };
}
