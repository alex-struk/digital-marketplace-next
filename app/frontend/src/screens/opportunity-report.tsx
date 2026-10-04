import { useEffect, useState } from "react";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { exportedInOrder, mayReadOpportunityReport, type ExportProgram } from "@rules/exports";
import { historyEntryLabel } from "@rules/opportunities";
import { SERVICE_AREAS, SWU_PHASE_NAMES } from "@rules/other-program-drafts";
import { proposalStatusLabel } from "@rules/proposals";
import { Addendum, CwuOpportunity, HistoryEntry, Person, fetchCwuOpportunity } from "../api/opportunities";
import { OtherProgramOpportunity, fetchOtherProgramOpportunity } from "../api/other-programs";
import { CwuProposal, listCwuProposals } from "../api/proposals";
import { TeamProposal, listTeamProposals } from "../api/team-proposals";
import { Loading, useLoadingShown } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { useSession } from "../auth/session";
import { readDate } from "../lib/dates";
import { FormattedText } from "../lib/formatted-text/formatted-text";
import { Fact, StatusBadge, dayLabel, deadlineLabel, publishedLabel } from "./opportunity-parts";
import { proponentName } from "./proposal-cwu-view";
import { CwuExportContent, TeamExportContent } from "./proposal-export";
import { teamProponentName } from "./proposal-team-view";

/**
 * The full report of an opportunity, at `/opportunities/<program>/:opportunityId/complete`
 * (opportunity-cwu-complete, opportunity-swu-complete, opportunity-twu-complete): the
 * opportunity, its addenda, its history and every proposal put forward to it, as one continuous
 * document (R-1.40).
 *
 * An administrator reads it and nobody else does, the opportunity's own author included: anybody
 * else is shown the missing page and nothing is asked of the service. It is drawn from the
 * opportunity and its proposals as the service already gives them to an administrator (decision
 * record 0066), so the proposals are listed once the opportunity has closed and the report says so
 * before then.
 */

const TITLES: Readonly<Record<ExportProgram, string>> = {
  "code-with-us": "Code With Us opportunity report",
  "sprint-with-us": "Sprint With Us opportunity report",
  "team-with-us": "Team With Us opportunity report",
};

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | { readonly kind: "cwu"; readonly opportunity: CwuOpportunity; readonly proposals: readonly CwuProposal[] | null }
  | { readonly kind: "team"; readonly opportunity: OtherProgramOpportunity; readonly proposals: readonly TeamProposal[] | null };

const dollars = (amount: number) => `$${Math.round(amount).toLocaleString("en-CA")}`;
const dayOf = (iso: string) => readDate(iso)?.label ?? "";
const areaName = (key: string) => {
  const name = SERVICE_AREAS.find((area) => area.key === key)?.name ?? key;
  return name.charAt(0) + name.slice(1).toLowerCase();
};

export function OpportunityReportScreen({ program, opportunityId }: { program: ExportProgram; opportunityId: string }) {
  const title = TITLES[program];
  useScreenTitle(title);
  const session = useSession();
  const loadingShown = useLoadingShown(session.status === "starting");
  if (session.status === "starting") return loadingShown ? <LoadingReport title={title} /> : null;
  if (session.status !== "signed-in" || !mayReadOpportunityReport(session.account)) return <NotFound />;
  return <ReportLoader program={program} opportunityId={opportunityId} title={title} />;
}

function LoadingReport({ title }: { title: string }) {
  return (
    <Stack gap="large">
      <Heading level={1}>{title}</Heading>
      <Loading label="Loading report…" />
    </Stack>
  );
}

function ReportLoader({ program, opportunityId, title }: { program: ExportProgram; opportunityId: string; title: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    const settle = (next: Loaded) => {
      if (current) setLoaded(next);
    };
    if (program === "code-with-us") {
      void Promise.all([fetchCwuOpportunity(opportunityId), listCwuProposals(opportunityId)]).then(([opportunity, listed]) =>
        settle(opportunity.kind === "found" ? { kind: "cwu", opportunity: opportunity.opportunity, proposals: listed.kind === "listed" ? listed.proposals : null } : { kind: "missing" }),
      );
    } else {
      void Promise.all([fetchOtherProgramOpportunity(program, opportunityId), listTeamProposals(program, opportunityId)]).then(([opportunity, listed]) =>
        settle(opportunity.kind === "found" ? { kind: "team", opportunity: opportunity.opportunity, proposals: listed.kind === "listed" ? listed.proposals : null } : { kind: "missing" }),
      );
    }
    return () => {
      current = false;
    };
  }, [program, opportunityId]);

  const loadingShown = useLoadingShown(loaded.kind === "loading");
  if (loaded.kind === "loading") return loadingShown ? <LoadingReport title={title} /> : null;
  if (loaded.kind === "missing") return <NotFound />;
  return <Report program={program} loaded={loaded} title={title} />;
}

function Report({ program, loaded, title }: { program: ExportProgram; loaded: Extract<Loaded, { kind: "cwu" | "team" }>; title: string }) {
  const { opportunity } = loaded;
  const createdBy: Person | null | undefined = opportunity.createdBy;
  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          {title}
        </Text>
        <Heading level={1} id="report-title">
          {opportunity.title || "Untitled opportunity"}
        </Heading>
      </Stack>
      <Stack as="article" gap="large" aria-labelledby="report-title" data-testid="opportunity-full-report">
        <Stack as="section" gap="medium" aria-labelledby="report-opportunity">
          <Heading level={2} id="report-opportunity">
            Opportunity
          </Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Fact label="Status">
              <StatusBadge status={opportunity.status} program={program} />
            </Fact>
            {loaded.kind === "cwu" ? (
              <Fact label="Reward">{dollars(loaded.opportunity.reward)}</Fact>
            ) : (
              <Fact label={loaded.opportunity.value.term}>{dollars(loaded.opportunity.value.amount)}</Fact>
            )}
            <Fact label="Proposal deadline">{deadlineLabel(opportunity.proposalDeadline)}</Fact>
            <Fact label="Published">{publishedLabel(opportunity.publishedAt)}</Fact>
            {createdBy ? <Fact label="Created by">{createdBy.name}</Fact> : null}
            <Fact label="Opportunity ID">{opportunity.id}</Fact>
          </Stack>
          {loaded.kind === "team" ? <TeamTerms opportunity={loaded.opportunity} /> : null}
          <FormattedText markup={opportunity.description} />
        </Stack>
        <AddendaSection addenda={opportunity.addenda} />
        <HistorySection history={opportunity.history ?? []} />
        <Stack as="section" gap="medium" aria-labelledby="report-proposals">
          <Heading level={2} id="report-proposals">
            Proposals
          </Heading>
          {loaded.kind === "cwu" ? <CwuProposals proposals={loaded.proposals} /> : <TeamProposals opportunity={loaded.opportunity} proposals={loaded.proposals} />}
        </Stack>
      </Stack>
    </Stack>
  );
}

/** A Sprint With Us opportunity's phases, or a Team With Us one's resources and dates, and the scoring weights. */
function TeamTerms({ opportunity }: { opportunity: OtherProgramOpportunity }) {
  const sprint = opportunity.program === "sprint-with-us";
  const weight = (key: string) => `${opportunity.weights[key] ?? 0}%`;
  return (
    <>
      {sprint ? (
        <Text elementType="p">
          {`Phases: ${
            opportunity.phases.length === 0
              ? "none entered"
              : opportunity.phases.map((phase) => `${SWU_PHASE_NAMES[phase.phase].toLowerCase()}, ${dayLabel(phase.startDate)} to ${dayLabel(phase.completionDate)}`).join("; ")
          }.`}
        </Text>
      ) : (
        <Text elementType="p">
          {`Resources: ${
            opportunity.resources.length === 0
              ? "none entered"
              : opportunity.resources.map((resource) => `${areaName(resource.serviceArea)}, ${resource.targetAllocation}% of full time`).join("; ")
          }. Contract from ${dayLabel(opportunity.startDate)} to ${dayLabel(opportunity.completionDate)}.`}
        </Text>
      )}
      <Text elementType="p">
        {sprint
          ? `Scoring weights: team questions ${weight("questions")}, code challenge ${weight("codeChallenge")}, team scenario ${weight("scenario")}, price ${weight("price")}.`
          : `Scoring weights: resource questions ${weight("questions")}, challenge ${weight("challenge")}, price ${weight("price")}.`}
      </Text>
    </>
  );
}

function AddendaSection({ addenda }: { addenda: readonly Addendum[] }) {
  return (
    <Stack as="section" gap="medium" aria-labelledby="report-addenda">
      <Heading level={2} id="report-addenda">
        Addenda
      </Heading>
      {addenda.length === 0 ? (
        <Text elementType="p">No addenda were added.</Text>
      ) : (
        addenda.map((addendum) => (
          <Text elementType="p" key={addendum.id}>
            {`${dayOf(addendum.createdAt)}: ${addendum.description}`}
          </Text>
        ))
      )}
    </Stack>
  );
}

/** "December 4, 2026: Awarded, by Test Administrator", with any note after it. */
export function reportHistoryLine(entry: HistoryEntry): string {
  const by = entry.createdBy ? `, by ${entry.createdBy.name}` : "";
  const note = entry.note && entry.note.trim() !== "" ? ` ${entry.note.trim()}` : "";
  return `${dayOf(entry.createdAt)}: ${historyEntryLabel(entry)}${by}.${note}`;
}

function HistorySection({ history }: { history: readonly HistoryEntry[] }) {
  return (
    <Stack as="section" gap="medium" aria-labelledby="report-history">
      <Heading level={2} id="report-history">
        History
      </Heading>
      {history.length === 0 ? (
        <Text elementType="p">Nothing has been recorded.</Text>
      ) : (
        <ul>
          {history.map((entry, index) => (
            <li key={`${entry.createdAt}-${index}`}>{reportHistoryLine(entry)}</li>
          ))}
        </ul>
      )}
    </Stack>
  );
}

const NOT_YET_LISTED = "The proposals are listed here once the opportunity has closed.";

function CwuProposals({ proposals }: { proposals: readonly CwuProposal[] | null }) {
  if (proposals === null) return <Text elementType="p">{NOT_YET_LISTED}</Text>;
  const shown = exportedInOrder(proposals);
  if (shown.length === 0) return <Text elementType="p">No proposals were submitted.</Text>;
  return (
    <>
      {shown.map((proposal, index) => {
        const id = `report-p${index + 1}`;
        return (
          <Stack as="article" gap="small" key={proposal.id} aria-labelledby={id} data-testid="report-proposal">
            <Heading level={3} id={id}>
              {proponentName(proposal)}
            </Heading>
            <Text elementType="p">{`Status: ${proposalStatusLabel(proposal.status)}. Score: ${typeof proposal.score === "number" ? `${proposal.score}%` : "not scored"}.`}</Text>
            <CwuExportContent proposal={proposal} level={4} anonymous={false} idPrefix={id} />
          </Stack>
        );
      })}
    </>
  );
}

function TeamProposals({ opportunity, proposals }: { opportunity: OtherProgramOpportunity; proposals: readonly TeamProposal[] | null }) {
  if (proposals === null) return <Text elementType="p">{NOT_YET_LISTED}</Text>;
  const shown = exportedInOrder(proposals);
  if (shown.length === 0) return <Text elementType="p">No proposals were submitted.</Text>;
  const percent = (value: number | null | undefined) => (typeof value === "number" ? `${value}%` : "not scored");
  return (
    <>
      {shown.map((proposal, index) => {
        const id = `report-p${index + 1}`;
        const sheet = proposal.scoresheet;
        const sprint = proposal.program === "sprint-with-us";
        const stages = sheet
          ? [
              `${sprint ? "team questions" : "resource questions"} ${percent(sheet.questions)}`,
              `${sprint ? "code challenge" : "challenge"} ${percent(sheet.challenge)}`,
              ...(sprint ? [`team scenario ${percent(sheet.scenario)}`] : []),
              `price ${percent(sheet.price)}`,
            ].join(", ")
          : null;
        return (
          <Stack as="article" gap="small" key={proposal.id} aria-labelledby={id} data-testid="report-proposal">
            <Heading level={3} id={id}>
              {teamProponentName(proposal)}
            </Heading>
            <Text elementType="p">
              {`Status: ${proposalStatusLabel(proposal.status)}. Total score: ${percent(sheet?.total)}.${
                proposal.anonymousProponentName ? ` Evaluated as ${proposal.anonymousProponentName}.` : ""
              }`}
            </Text>
            {stages ? <Text elementType="p">{`Scores: ${stages}.`}</Text> : null}
            <TeamExportContent proposal={proposal} questions={opportunity.questions} level={4} idPrefix={id} />
          </Stack>
        );
      })}
    </>
  );
}
