import { ReactNode, useEffect, useState } from "react";
import { Button, Checkbox, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { anonymousNameAt, asksForAnonymous, copyIsAnonymous, exportedInOrder, mayExportAllProposals, type ExportProgram } from "@rules/exports";
import { SERVICE_AREAS, SWU_PHASES, SWU_PHASE_NAMES } from "@rules/other-program-drafts";
import type { TeamProgram } from "@rules/team-proposals";
import type { Account } from "../api/accounts";
import { fetchCwuOpportunity } from "../api/opportunities";
import { OtherProgramOpportunity, StoredQuestion, fetchOtherProgramOpportunity } from "../api/other-programs";
import { CwuProposal, fetchCwuProposal, listCwuProposals } from "../api/proposals";
import { TeamProposal, fetchTeamProposal, listTeamProposals } from "../api/team-proposals";
import { card } from "../app/layout";
import { Loading, useLoadingShown } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { useSession } from "../auth/session";
import { Fact, momentLabel } from "./opportunity-parts";
import { proponentName } from "./proposal-cwu-view";
import { teamProponentName } from "./proposal-team-view";
import { proposalStatusLabel } from "@rules/proposals";
import { readDate } from "../lib/dates";

/**
 * Taking proposals away (decision record 0066): the printable copy of one proposal at
 * `/opportunities/<program>/:opportunityId/proposals/:proposalId/export`, for anyone the service
 * lets read it (R-2.37), and every proposal of an opportunity in one document at
 * `/opportunities/<program>/:opportunityId/proposals/export`, for public sector staff and
 * administrators, who choose whether it names the proponents (R-2.38). Each is one continuous
 * document with nothing to expand, so it reads and prints whole.
 *
 * Neither asks anything new of the service: the copy is the proposal the service already gives its
 * reader, and the document is the list it gives the opportunity's author and administrators once
 * the opportunity has closed. Anybody the service does not answer is shown the missing page.
 */

const PROGRAM_NAMES: Readonly<Record<ExportProgram, string>> = {
  "code-with-us": "Code With Us",
  "sprint-with-us": "Sprint With Us",
  "team-with-us": "Team With Us",
};

/** Where a Sprint With Us or Team With Us proposal stops being anonymous to staff. */
const CHALLENGE_NAMES: Readonly<Record<TeamProgram, string>> = {
  "sprint-with-us": "code challenge",
  "team-with-us": "challenge",
};

type Level = 2 | 3 | 4;
const below = (level: Level) => (level + 1) as 3 | 4 | 5;

const dollars = (amount: number) => `$${Math.round(amount).toLocaleString("en-CA")}`;
const notEntered = (value: string) => (value.trim() === "" ? "Not entered" : value);
const areaName = (key: string | null) => {
  const name = SERVICE_AREAS.find((area) => area.key === key)?.name ?? key ?? "Unknown service area";
  return name.charAt(0) + name.slice(1).toLowerCase();
};

/** "October 10, 2026": the day a proposal was put forward, as the all-proposals document says it. */
function submittedDay(iso: string | null): string {
  return (iso && readDate(iso)?.label) || "Not submitted";
}

// ------------------------------------------------------------------------ the proposal's content

function Section({ id, title, level, children }: { id: string; title: string; level: Level; children: ReactNode }) {
  return (
    <Stack as="section" gap="medium" aria-labelledby={id}>
      <Heading level={level} id={id}>
        {title}
      </Heading>
      {children}
    </Stack>
  );
}

function Attachments({ id, level, attachments }: { id: string; level: Level; attachments: readonly { readonly id: string; readonly name: string }[] }) {
  return (
    <Section id={id} title="Attachments" level={level}>
      {attachments.length === 0 ? (
        <Text elementType="p">No attachments were added.</Text>
      ) : (
        <ul>
          {attachments.map((attachment) => (
            <li key={attachment.id}>{attachment.name}</li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/**
 * A Code With Us proposal's content, under headings at `level`: who proposed, unless the document
 * withholds them, the proposal text, the comments and the attachments' names.
 */
export function CwuExportContent({ proposal, level, anonymous, idPrefix }: { proposal: CwuProposal; level: Level; anonymous: boolean; idPrefix: string }) {
  const { proponent } = proposal;
  return (
    <>
      {anonymous ? (
        <Text elementType="p">The proponent's name and contact details are withheld in this document.</Text>
      ) : (
        <Section id={`${idPrefix}-proponent`} title="Proponent" level={level}>
          {proponent.tag === "organization" ? (
            <Stack as="dl" direction="row" gap="medium">
              <Fact label="Proponent type">Organization</Fact>
              <Fact label="Organization">{notEntered(proponent.value.legalName)}</Fact>
              {proponent.value.contact ? <Fact label="Contact">{[proponent.value.contact.name, proponent.value.contact.email, proponent.value.contact.phone].filter(Boolean).join(", ")}</Fact> : null}
            </Stack>
          ) : (
            <Stack as="dl" direction="row" gap="medium">
              <Fact label="Proponent type">Individual</Fact>
              <Fact label="Email address">{notEntered(proponent.value.email)}</Fact>
              {proponent.value.phone ? <Fact label="Phone number">{proponent.value.phone}</Fact> : null}
              <Fact label="Address">
                {notEntered(
                  [proponent.value.street1, proponent.value.street2, proponent.value.city, `${proponent.value.region} ${proponent.value.mailCode}`.trim(), proponent.value.country]
                    .map((line) => line.trim())
                    .filter((line) => line !== "")
                    .join(", "),
                )}
              </Fact>
            </Stack>
          )}
        </Section>
      )}
      <Section id={`${idPrefix}-text`} title="Proposal text" level={level}>
        <Text elementType="p">{notEntered(proposal.proposalText)}</Text>
      </Section>
      <Section id={`${idPrefix}-comments`} title="Additional comments" level={level}>
        <Text elementType="p">{notEntered(proposal.additionalComments)}</Text>
      </Section>
      <Attachments id={`${idPrefix}-attachments`} level={level} attachments={proposal.attachments} />
    </>
  );
}

/**
 * A Sprint With Us or Team With Us proposal's content, under headings at `level`: its team and
 * costs, its answers beside the opportunity's questions, its references and its attachments' names.
 * Nothing here names the organization, so the same content serves an anonymous document.
 */
export function TeamExportContent({
  proposal,
  questions,
  level,
  idPrefix,
}: {
  proposal: TeamProposal;
  questions: readonly StoredQuestion[];
  level: Level;
  idPrefix: string;
}) {
  const sprint = proposal.program === "sprint-with-us";
  const sub = below(level);
  return (
    <>
      <Section id={`${idPrefix}-team`} title="Team" level={level}>
        {sprint ? (
          <>
            {SWU_PHASES.filter((phase) => proposal.phases[phase]).map((phase) => {
              const team = proposal.phases[phase]!;
              return (
                <Stack gap="small" key={phase}>
                  <Heading level={sub}>{`${SWU_PHASE_NAMES[phase]} phase`}</Heading>
                  {team.members.length === 0 ? (
                    <Text elementType="p">Nobody was named.</Text>
                  ) : (
                    <ul>
                      {team.members.map((member) => (
                        <li key={member.member.id}>{`${member.member.name}${member.scrumMaster ? ", scrum master" : ""}`}</li>
                      ))}
                    </ul>
                  )}
                  <Text elementType="p">{`Proposed cost: ${dollars(team.proposedCost)}`}</Text>
                </Stack>
              );
            })}
            <Text elementType="p">{`Total proposed cost: ${dollars(proposal.totalProposedCost ?? 0)} of the ${dollars(proposal.opportunity.budget)} maximum budget.`}</Text>
          </>
        ) : (
          <>
            {proposal.team.length === 0 ? (
              <Text elementType="p">Nobody was named.</Text>
            ) : (
              <ul>
                {proposal.team.map((member) => (
                  <li key={`${member.resource.id}-${member.member.id}`}>
                    {`${areaName(member.resource.serviceArea)}${member.resource.targetAllocation !== null ? `, ${member.resource.targetAllocation}% of full time` : ""}: ${member.member.name}, $${member.hourlyRate.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} an hour`}
                  </li>
                ))}
              </ul>
            )}
            {proposal.totalProposedCost !== null ? (
              <Text elementType="p">{`Estimated cost over the contract: ${dollars(proposal.totalProposedCost)} of the ${dollars(proposal.opportunity.budget)} maximum budget.`}</Text>
            ) : null}
          </>
        )}
      </Section>
      <Section id={`${idPrefix}-questions`} title={sprint ? "Team questions" : "Resource questions"} level={level}>
        {questions.length === 0 ? (
          <Text elementType="p">This opportunity asks no questions.</Text>
        ) : (
          questions.map((question, order) => {
            const response = proposal.responses.find((entry) => entry.order === order)?.response ?? "";
            return (
              <Stack gap="small" key={order}>
                <Heading level={sub}>{`Question ${order + 1}`}</Heading>
                <Text elementType="p">{question.question}</Text>
                <Text elementType="p">{response.trim() === "" ? "Not answered." : response}</Text>
              </Stack>
            );
          })
        )}
      </Section>
      {sprint ? (
        <Section id={`${idPrefix}-references`} title="References" level={level}>
          {proposal.references.length === 0 ? (
            <Text elementType="p">No references were added.</Text>
          ) : (
            proposal.references.map((reference, index) => (
              <Text elementType="p" key={index}>
                {[reference.name, reference.company, reference.email, reference.phone].filter((part) => part.trim() !== "").join(", ")}
              </Text>
            ))
          )}
        </Section>
      ) : null}
      <Attachments id={`${idPrefix}-attachments`} level={level} attachments={proposal.attachments} />
    </>
  );
}

// ------------------------------------------------------------------------ who is asking

/**
 * The screen once it is known who is asking. A visitor who has not signed in may read no proposal,
 * so they are shown the missing page; nothing is drawn until the session is known, unless that takes
 * long enough to say so (decision record 0039).
 */
function SignedIn({ title, loadingLabel, children }: { title: string; loadingLabel: string; children: (account: Account) => ReactNode }) {
  const session = useSession();
  const loadingShown = useLoadingShown(session.status === "starting");
  if (session.status === "starting") return loadingShown ? <LoadingScreen title={title} label={loadingLabel} /> : null;
  if (session.status !== "signed-in") return <NotFound />;
  return <>{children(session.account)}</>;
}

function LoadingScreen({ title, label }: { title: string; label: string }) {
  return (
    <Stack gap="large">
      <Heading level={1}>{title}</Heading>
      <Loading label={label} />
    </Stack>
  );
}

function PrintButton() {
  return (
    <Button variant="secondary" onPress={() => window.print()}>
      Print
    </Button>
  );
}

// ------------------------------------------------------------------------ one proposal

type OneLoaded =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | { readonly kind: "cwu"; readonly proposal: CwuProposal }
  | { readonly kind: "team"; readonly proposal: TeamProposal; readonly opportunity: OtherProgramOpportunity };

export function ProposalExportOneScreen({ program, opportunityId, proposalId }: { program: ExportProgram; opportunityId: string; proposalId: string }) {
  const title = `Export a ${PROGRAM_NAMES[program]} proposal`;
  useScreenTitle(title);
  return (
    <SignedIn title={title} loadingLabel="Loading proposal…">
      {(account) => <OneLoader program={program} account={account} opportunityId={opportunityId} proposalId={proposalId} title={title} />}
    </SignedIn>
  );
}

function OneLoader({ program, account, opportunityId, proposalId, title }: { program: ExportProgram; account: Account; opportunityId: string; proposalId: string; title: string }) {
  const [loaded, setLoaded] = useState<OneLoaded>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    const settle = (next: OneLoaded) => {
      if (current) setLoaded(next);
    };
    if (program === "code-with-us") {
      void fetchCwuProposal(proposalId).then((answer) => settle(answer.kind === "found" ? { kind: "cwu", proposal: answer.proposal } : { kind: "missing" }));
    } else {
      void Promise.all([fetchTeamProposal(program, proposalId), fetchOtherProgramOpportunity(program, opportunityId)]).then(([answer, opportunity]) =>
        settle(answer.kind === "found" && opportunity.kind === "found" ? { kind: "team", proposal: answer.proposal, opportunity: opportunity.opportunity } : { kind: "missing" }),
      );
    }
    return () => {
      current = false;
    };
  }, [program, proposalId, opportunityId]);

  const loadingShown = useLoadingShown(loaded.kind === "loading");
  if (loaded.kind === "loading") return loadingShown ? <LoadingScreen title={title} label="Loading proposal…" /> : null;
  if (loaded.kind === "missing") return <NotFound />;
  // A proposal reached through another opportunity's address, and a draft to staff, are not there (R-2.25).
  if (loaded.proposal.opportunity.id !== opportunityId.toLowerCase()) return <NotFound />;
  if (account.type !== "VENDOR" && (loaded.proposal.status === "DRAFT" || loaded.proposal.status === "WITHDRAWN")) return <NotFound />;
  return loaded.kind === "cwu" ? (
    <ExportedOne program={program} account={account} proposal={loaded.proposal} />
  ) : (
    <ExportedOne program={program} account={account} proposal={loaded.proposal} opportunity={loaded.opportunity} />
  );
}

function ExportedOne({
  program,
  account,
  proposal,
  opportunity,
}: {
  program: ExportProgram;
  account: Account;
  proposal: CwuProposal | TeamProposal;
  opportunity?: OtherProgramOpportunity;
}) {
  const base = `/opportunities/${program}/${proposal.opportunity.id}/proposals/${proposal.id}`;
  const vendor = account.type === "VENDOR";
  const team = "program" in proposal ? proposal : null;
  const anonymous = copyIsAnonymous(account, program, proposal.status);
  const name = team ? (anonymous ? anonymousNameAt(team.anonymousProponentName, 0) : teamProponentName(team)) : proponentName(proposal as CwuProposal);
  return (
    <Stack gap="large">
      <Stack direction="row" align="center" gap="medium">
        {/* The vendor manages their proposal on its own page; staff read it on the proposal's page. */}
        <Link href={vendor ? `${base}/edit` : base}>Back to the proposal</Link>
        <PrintButton />
      </Stack>
      <Stack as="article" gap="medium" aria-labelledby="export-title" data-testid="proposal-export-document">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">
            {`${PROGRAM_NAMES[program]} proposal`}
          </Text>
          <Heading level={1} id="export-title">
            {proposal.opportunity.title || "Untitled opportunity"}
          </Heading>
        </Stack>
        <Stack as="dl" direction="row" gap="medium">
          <Fact label="Proponent" testId="proposal-proponent-name">
            {name}
          </Fact>
          <Fact label="Status">{proposalStatusLabel(proposal.status)}</Fact>
          {proposal.submittedAt && proposal.status !== "DRAFT" ? <Fact label="Submitted">{momentLabel(proposal.submittedAt)}</Fact> : null}
          <Fact label="Proposal ID">{proposal.id}</Fact>
        </Stack>
        {team && anonymous ? (
          <Text elementType="p">{`The proponent's name is withheld from evaluators until the proposal reaches the ${CHALLENGE_NAMES[team.program]}.`}</Text>
        ) : null}
        {team ? (
          <TeamExportContent proposal={team} questions={opportunity?.questions ?? []} level={2} idPrefix="export" />
        ) : (
          <CwuExportContent proposal={proposal as CwuProposal} level={2} anonymous={false} idPrefix="export" />
        )}
      </Stack>
    </Stack>
  );
}

// ------------------------------------------------------------------------ every proposal

type AllLoaded =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | { readonly kind: "cwu"; readonly title: string; readonly proposals: readonly CwuProposal[] }
  | { readonly kind: "team"; readonly opportunity: OtherProgramOpportunity; readonly proposals: readonly TeamProposal[] };

export function ProposalExportAllScreen({ program, opportunityId }: { program: ExportProgram; opportunityId: string }) {
  const title = `Export all ${PROGRAM_NAMES[program]} proposals`;
  useScreenTitle(title);
  return (
    <SignedIn title={title} loadingLabel="Loading proposals…">
      {(account) =>
        // A vendor is refused without anything being asked of the service (R-2.38).
        mayExportAllProposals(account) ? <AllLoader program={program} opportunityId={opportunityId} title={title} /> : <NotFound />
      }
    </SignedIn>
  );
}

function AllLoader({ program, opportunityId, title }: { program: ExportProgram; opportunityId: string; title: string }) {
  const [loaded, setLoaded] = useState<AllLoaded>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    const settle = (next: AllLoaded) => {
      if (current) setLoaded(next);
    };
    if (program === "code-with-us") {
      void Promise.all([fetchCwuOpportunity(opportunityId), listCwuProposals(opportunityId)]).then(([opportunity, listed]) =>
        settle(opportunity.kind === "found" && listed.kind === "listed" ? { kind: "cwu", title: opportunity.opportunity.title, proposals: listed.proposals } : { kind: "missing" }),
      );
    } else {
      void Promise.all([fetchOtherProgramOpportunity(program, opportunityId), listTeamProposals(program, opportunityId)]).then(([opportunity, listed]) =>
        settle(opportunity.kind === "found" && listed.kind === "listed" ? { kind: "team", opportunity: opportunity.opportunity, proposals: listed.proposals } : { kind: "missing" }),
      );
    }
    return () => {
      current = false;
    };
  }, [program, opportunityId]);

  const loadingShown = useLoadingShown(loaded.kind === "loading");
  if (loaded.kind === "loading") return loadingShown ? <LoadingScreen title={title} label="Loading proposals…" /> : null;
  // Staff the service does not answer — not the opportunity's author, or before it has closed — are shown the missing page.
  if (loaded.kind === "missing") return <NotFound />;
  return <ExportedAll program={program} loaded={loaded} title={title} />;
}

function ExportedAll({ program, loaded, title }: { program: ExportProgram; loaded: Extract<AllLoaded, { kind: "cwu" | "team" }>; title: string }) {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const anonymous = asksForAnonymous(search);
  const opportunityTitle = loaded.kind === "cwu" ? loaded.title : loaded.opportunity.title;
  const proposals: readonly (CwuProposal | TeamProposal)[] = exportedInOrder<CwuProposal | TeamProposal>(
    loaded.kind === "cwu" ? loaded.proposals.map((proposal) => ({ ...proposal, anonymousProponentName: "" })) : loaded.proposals,
  );

  function choose(withheld: boolean) {
    // The choice is kept in the address, so the document asked for can be reopened or shared as it is.
    void navigate({ to: ".", search: (withheld ? { anonymous: "true" } : {}) as never, replace: true });
  }

  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          {title}
        </Text>
        <Heading level={1}>{opportunityTitle || "Untitled opportunity"}</Heading>
      </Stack>
      <Text elementType="p">Every submitted proposal you are entitled to see, in one document. Drafts are never included.</Text>
      <Stack direction="row" align="center" gap="medium">
        <Checkbox isSelected={anonymous} onChange={choose} data-testid="proposal-export-anonymous-toggle">
          Name proponents anonymously
        </Checkbox>
        <PrintButton />
      </Stack>
      <Stack gap="medium" data-testid="proposal-export-document">
        {proposals.length === 0 ? <Text elementType="p">No proposals have been submitted to this opportunity.</Text> : null}
        {proposals.map((proposal, index) => {
          const id = `export-item-${index + 1}`;
          const team = "program" in proposal ? proposal : null;
          const name = anonymous ? anonymousNameAt(team?.anonymousProponentName ?? "", index) : team ? teamProponentName(team) : proponentName(proposal as CwuProposal);
          return (
            <article key={proposal.id} aria-labelledby={id} style={card} data-testid="proposal-export-item">
              <Stack gap="medium">
                <Heading level={2} id={id}>
                  <span data-testid="proposal-proponent-name">{name}</span>
                </Heading>
                <Stack as="dl" direction="row" gap="medium">
                  <Fact label="Status">{proposalStatusLabel(proposal.status)}</Fact>
                  <Fact label="Submitted">{submittedDay(proposal.submittedAt)}</Fact>
                  {team && team.totalProposedCost !== null ? <Fact label="Total proposed cost">{dollars(team.totalProposedCost)}</Fact> : null}
                </Stack>
                {team ? (
                  <>
                    {anonymous ? <Text elementType="p">The organization is withheld in this document.</Text> : null}
                    <TeamExportContent proposal={team} questions={loaded.kind === "team" ? loaded.opportunity.questions : []} level={3} idPrefix={id} />
                  </>
                ) : (
                  <CwuExportContent proposal={proposal as CwuProposal} level={3} anonymous={anonymous} idPrefix={id} />
                )}
              </Stack>
            </article>
          );
        })}
      </Stack>
    </Stack>
  );
}
