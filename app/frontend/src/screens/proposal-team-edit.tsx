import { RefObject, useEffect, useRef, useState } from "react";
import { AlertDialog, Button, ButtonGroup, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { fileContentAddress } from "@rules/files";
import { SERVICE_AREAS, SWU_PHASES, SWU_PHASE_NAMES } from "@rules/other-program-drafts";
import { isAcceptingProposals } from "@rules/proposals";
import { Scoresheet, rankLabel } from "@rules/proposal-evaluation";
import { TEAM_PROGRAM_NAMES, TeamProgram, offeredTeamProposalActions, organizationIsLocked } from "@rules/team-proposals";
import { Account, changeOwnAccount } from "../api/accounts";
import { downloadFile } from "../api/files";
import { OtherProgramOpportunity, fetchOtherProgramOpportunity } from "../api/other-programs";
import { ActingFor, fetchOrganizationsActingFor } from "../api/proposals";
import { TeamProposal, TeamProposalSaveAnswer, changeTeamProposal, deleteTeamProposal, fetchTeamProposal } from "../api/team-proposals";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { ContactFacts, Fact, deadlineLabel, momentLabel } from "./opportunity-parts";
import { ProposalHistory } from "./proposal-cwu-edit";
import { ProposalStatusBadge, TermsDialog } from "./proposal-cwu-form";
import { TeamProposalForm, teamValuesFrom } from "./proposal-team-form";

/**
 * Manage a Sprint With Us or Team With Us proposal, at
 * `/opportunities/<program>/:opportunityId/proposals/:proposalId/edit` (proposal-swu-edit,
 * proposal-twu-edit; decision record 0058): its key facts, the actions its state allows, and its
 * Proposal and History tabs (`?tab=…`).
 *
 * It is the vendor's page: the vendor who wrote it, or who owns or administers its organization.
 * Anybody else is shown the missing page (R-2.24). A draft may be edited, submitted or deleted; a
 * submitted one edited or withdrawn, its organization staying until it is withdrawn (R-2.22); a
 * withdrawn one edited or put back in (R-2.4, R-2.23). Every submission passes through the terms
 * dialog (R-2.3), and a refusal — the organization no longer qualified, the deadline passed — is said
 * above the tabs in the service's words (R-2.16). The History tab lists every change of state to
 * everyone who may read the proposal (R-2.9).
 */

type Tab = "proposal" | "scoresheet" | "history";
const TAB_NAMES: Readonly<Record<Tab, string>> = { proposal: "Proposal", scoresheet: "Scoresheet", history: "History" };

/** The Scoresheet tab appears once a decision has been made and the service gives the result (R-2.32). */
function tabsFor(proposal: TeamProposal): readonly Tab[] {
  const decided = (proposal.status === "AWARDED" || proposal.status === "NOT_AWARDED") && proposal.scoresheet !== undefined;
  return decided ? ["proposal", "scoresheet", "history"] : ["proposal", "history"];
}

const TITLES: Readonly<Record<TeamProgram, string>> = {
  "sprint-with-us": "Manage a Sprint With Us proposal",
  "team-with-us": "Manage a Team With Us proposal",
};

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | {
      readonly kind: "found";
      readonly proposal: TeamProposal;
      readonly opportunity: OtherProgramOpportunity;
      readonly organizations: readonly ActingFor[];
    };

export function ProposalTeamEditScreen({ program, opportunityId, proposalId }: { program: TeamProgram; opportunityId: string; proposalId: string }) {
  useScreenTitle(TITLES[program]);
  return (
    <RequireSignIn title={TITLES[program]} loadingLabel="Loading proposal…">
      {(account) => <ManageLoader program={program} account={account} opportunityId={opportunityId} proposalId={proposalId} />}
    </RequireSignIn>
  );
}

function ManageLoader({ program, account, opportunityId, proposalId }: { program: TeamProgram; account: Account; opportunityId: string; proposalId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const vendor = account.type === "VENDOR";
  useEffect(() => {
    if (!vendor) return;
    let current = true;
    void Promise.all([fetchTeamProposal(program, proposalId), fetchOtherProgramOpportunity(program, opportunityId), fetchOrganizationsActingFor()]).then(
      ([answer, opportunity, organizations]) => {
        if (!current) return;
        setLoaded(
          answer.kind === "found" && opportunity.kind === "found"
            ? { kind: "found", proposal: answer.proposal, opportunity: opportunity.opportunity, organizations }
            : { kind: "missing" },
        );
      },
    );
    return () => {
      current = false;
    };
  }, [program, proposalId, opportunityId, vendor]);

  if (!vendor || loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLES[program]}</Heading>
        <Loading label="Loading proposal…" />
      </Stack>
    );
  }
  if (loaded.proposal.opportunity.id !== opportunityId.toLowerCase()) return <NotFound />;
  return <Manage program={program} account={account} initial={loaded.proposal} opportunity={loaded.opportunity} organizations={loaded.organizations} />;
}

type Notice =
  | { readonly kind: "done"; readonly text: string }
  | { readonly kind: "not-submitted"; readonly reasons: readonly string[] }
  | { readonly kind: "refused"; readonly title: string; readonly reasons: readonly string[] };

function Manage({
  program,
  account,
  initial,
  opportunity,
  organizations,
}: {
  program: TeamProgram;
  account: Account;
  initial: TeamProposal;
  opportunity: OtherProgramOpportunity;
  organizations: readonly ActingFor[];
}) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const [proposal, setProposal] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dialog, setDialog] = useState<"terms" | "withdraw" | "delete" | null>(null);
  const [busy, setBusy] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notice && notice.kind !== "done") noticeRef.current?.focus();
  }, [notice]);

  const tabs = tabsFor(proposal);
  const tab: Tab = tabs.includes(search.tab as Tab) ? (search.tab as Tab) : "proposal";
  const base = `/opportunities/${program}/${opportunity.id}/proposals/${proposal.id}`;
  const offers = offeredTeamProposalActions(proposal.status);
  // The organization already named stays a choice even when the vendor no longer administers it.
  const named = proposal.organization;
  const choices = named && !organizations.some((organization) => organization.id === named.id) ? [...organizations, named] : organizations;
  const names: Record<string, string> = {};
  for (const phase of SWU_PHASES) for (const member of proposal.phases[phase]?.members ?? []) names[member.member.id] = member.member.name;
  for (const member of proposal.team) names[member.member.id] = member.member.name;

  function goToTab(next: Tab) {
    const params = { opportunityId: opportunity.id, proposalId: proposal.id };
    const to = program === "sprint-with-us" ? "/opportunities/sprint-with-us/$opportunityId/proposals/$proposalId/edit" : "/opportunities/team-with-us/$opportunityId/proposals/$proposalId/edit";
    void navigate({ to, params, search: { tab: next } as never });
  }

  function settle(answer: TeamProposalSaveAnswer, done: string, refusedTitle: string) {
    if (answer.kind === "saved") {
      setProposal(answer.proposal);
      setNotice({ kind: "done", text: done });
      return;
    }
    const reasons = answer.kind === "refused" ? answer.reasons : ["The service could not do that. Try again."];
    if (refusedTitle === "Your proposal was not submitted") setNotice({ kind: "not-submitted", reasons });
    else setNotice({ kind: "refused", title: refusedTitle, reasons });
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    const accepted = await changeOwnAccount(account.id, "acceptTerms");
    const answer: TeamProposalSaveAnswer = accepted.kind === "saved" ? await changeTeamProposal(program, proposal.id, "submit") : { kind: "failed" };
    setBusy(false);
    setDialog(null);
    settle(answer, "Your proposal has been submitted.", "Your proposal was not submitted");
  }

  async function withdraw() {
    if (busy) return;
    setBusy(true);
    const answer = await changeTeamProposal(program, proposal.id, "withdraw");
    setBusy(false);
    setDialog(null);
    settle(answer, "Your proposal has been withdrawn.", "Your proposal was not withdrawn");
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    const answer = await deleteTeamProposal(program, proposal.id);
    setBusy(false);
    setDialog(null);
    if (answer.kind === "saved") {
      void navigate({ to: "/dashboard" });
      return;
    }
    settle(answer, "", "Your proposal was not deleted");
  }

  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          {TITLES[program]}
        </Text>
        <Heading level={1}>{proposal.opportunity.title || "Untitled opportunity"}</Heading>
      </Stack>
      <Stack as="dl" direction="row" gap="medium">
        <Fact label="Status">
          <ProposalStatusBadge status={proposal.status} />
        </Fact>
        {proposal.submittedAt && proposal.status !== "DRAFT" ? (
          <Fact label="Submitted" testId="proposal-submitted-at">
            {momentLabel(proposal.submittedAt)}
          </Fact>
        ) : null}
        <Fact label="Proposal ID" testId="proposal-identifier">
          {proposal.id}
        </Fact>
        <Fact label="Opportunity ID" testId="opportunity-identifier">
          {opportunity.id}
        </Fact>
        <Fact label="Proposal deadline">{deadlineLabel(proposal.opportunity.proposalDeadline)}</Fact>
      </Stack>
      <Stack direction="row" align="center" gap="medium">
        <Link href={`/opportunities/${program}/${opportunity.id}`}>View the opportunity</Link>
      </Stack>
      {!editing ? (
        <div data-testid="proposal-actions">
          {offers.edit || offers.submit || offers.withdraw || offers.delete ? (
            <ButtonGroup ariaLabel="Proposal actions">
              {offers.edit ? (
                <Button
                  variant="secondary"
                  onPress={() => {
                    setNotice(null);
                    setEditing(true);
                    if (tab !== "proposal") goToTab("proposal");
                  }}
                  data-testid="proposal-edit-button"
                >
                  Edit
                </Button>
              ) : null}
              {offers.submit ? (
                <Button
                  variant="primary"
                  isDisabled={busy}
                  onPress={() => {
                    setNotice(null);
                    setDialog("terms");
                  }}
                  data-testid="proposal-submit"
                >
                  Submit proposal
                </Button>
              ) : null}
              {offers.withdraw ? (
                <Button variant="secondary" danger isDisabled={busy} onPress={() => setDialog("withdraw")} data-testid="proposal-withdraw-button">
                  Withdraw
                </Button>
              ) : null}
              {offers.delete ? (
                <Button variant="secondary" danger isDisabled={busy} onPress={() => setDialog("delete")} data-testid="proposal-delete-button">
                  Delete
                </Button>
              ) : null}
            </ButtonGroup>
          ) : (
            <Text elementType="p">There is nothing to do with this proposal now.</Text>
          )}
        </div>
      ) : null}
      <nav aria-label="Proposal sections">
        <Stack as="ul" direction="row" gap="medium">
          {tabs.map((name) => (
            <li key={name}>
              <Link href={`${base}/edit?tab=${name}`} aria-current={name === tab ? "page" : undefined} data-testid={`proposal-tab-${name}`}>
                {TAB_NAMES[name]}
              </Link>
            </li>
          ))}
        </Stack>
      </nav>
      <NoticeArea notice={notice} noticeRef={noticeRef} />
      <Stack as="section" gap="medium" aria-labelledby="tab-heading">
        <Heading level={2} id="tab-heading">
          {TAB_NAMES[tab]}
        </Heading>
        {tab === "proposal" && editing ? (
          <>
            <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
            <TeamProposalForm
              key={formVersion}
              program={program}
              purpose="edit"
              opportunity={opportunity}
              organizations={choices}
              initial={teamValuesFrom(proposal, opportunity)}
              initialAttachments={proposal.attachments}
              initialNames={names}
              organizationLocked={organizationIsLocked(proposal.status)}
              headingLevel={3}
              refusalTitle="Your changes were not saved"
              onSend={async (action, content) => {
                if (action === "save") return changeTeamProposal(program, proposal.id, "edit", content);
                const accepted = await changeOwnAccount(account.id, "acceptTerms");
                if (accepted.kind !== "saved") return { kind: "failed" };
                const saved = await changeTeamProposal(program, proposal.id, "edit", content);
                if (saved.kind !== "saved" || saved.proposal.status === "SUBMITTED") return saved;
                return changeTeamProposal(program, proposal.id, "submit");
              }}
              onSaved={(saved, action) => {
                setProposal(saved);
                setEditing(false);
                setFormVersion((version) => version + 1);
                setNotice({
                  kind: "done",
                  text: action === "submit" ? "Your changes have been saved and your proposal submitted." : "Your changes have been saved.",
                });
              }}
              onCancel={() => setEditing(false)}
            />
          </>
        ) : null}
        {tab === "proposal" && !editing ? <TeamProposalDetails program={program} proposal={proposal} opportunity={opportunity} /> : null}
        {tab === "scoresheet" && proposal.scoresheet ? <ScoresheetDetails program={program} proposal={proposal} scoresheet={proposal.scoresheet} /> : null}
        {tab === "history" ? <ProposalHistory proposal={proposal} /> : null}
      </Stack>
      <TermsDialog
        isOpen={dialog === "terms"}
        isSending={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => void submit()}
        programName={TEAM_PROGRAM_NAMES[program]}
        programTerms={`/content/${program}-terms-and-conditions`}
      />
      <Modal isOpen={dialog === "withdraw"} isDismissable onOpenChange={(open) => (!open && !busy ? setDialog(null) : undefined)}>
        <AlertDialog
          variant="warning"
          title="Withdraw this proposal?"
          data-testid="proposal-withdraw-dialog"
          buttons={
            <>
              <Button variant="secondary" isDisabled={busy} onPress={() => setDialog(null)} data-testid="proposal-dialog-cancel">
                Keep proposal
              </Button>
              <Button variant="primary" isDisabled={busy} onPress={() => void withdraw()} data-testid="proposal-withdraw-confirm">
                Withdraw proposal
              </Button>
            </>
          }
        >
          <Text elementType="p">
            {isAcceptingProposals({ status: opportunity.status, proposalDeadline: opportunity.proposalDeadline }, new Date())
              ? `It will no longer be considered. You can submit it again only while the opportunity is accepting proposals, until ${deadlineLabel(proposal.opportunity.proposalDeadline)}. You and the administrators will be sent a withdrawal notice.`
              : "It will no longer be considered, and the opportunity is no longer accepting proposals, so it cannot be submitted again. You and the administrators will be sent a withdrawal notice."}
          </Text>
        </AlertDialog>
      </Modal>
      <Modal isOpen={dialog === "delete"} isDismissable onOpenChange={(open) => (!open && !busy ? setDialog(null) : undefined)}>
        <AlertDialog
          variant="destructive"
          title="Delete this proposal?"
          data-testid="proposal-delete-dialog"
          buttons={
            <>
              <Button variant="secondary" isDisabled={busy} onPress={() => setDialog(null)} data-testid="proposal-dialog-cancel">
                Cancel
              </Button>
              <Button variant="primary" danger isDisabled={busy} onPress={() => void remove()} data-testid="proposal-delete-confirm">
                Delete proposal
              </Button>
            </>
          }
        >
          <Text elementType="p">The draft and everything in it will be removed, and it can no longer be opened. This cannot be undone.</Text>
        </AlertDialog>
      </Modal>
    </Stack>
  );
}

function NoticeArea({ notice, noticeRef }: { notice: Notice | null; noticeRef: RefObject<HTMLDivElement> }) {
  if (notice?.kind === "not-submitted" || notice?.kind === "refused") {
    return (
      <div tabIndex={-1} ref={noticeRef} data-testid={notice.kind === "not-submitted" ? "proposal-submit-refused-message" : "proposal-refused-message"}>
        <TitledAlert variant="danger" role="alert" title={notice.kind === "not-submitted" ? "Your proposal was not submitted" : notice.title}>
          {notice.reasons.map((reason) => (
            <Text elementType="p" key={reason}>
              {reason}
            </Text>
          ))}
        </TitledAlert>
      </div>
    );
  }
  return <div role="status">{notice?.kind === "done" ? <Text elementType="p">{notice.text}</Text> : null}</div>;
}

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

const dollars = (amount: number) => `$${Math.round(amount).toLocaleString("en-CA")}`;
const areaName = (key: string | null) => {
  const name = SERVICE_AREAS.find((area) => area.key === key)?.name ?? key ?? "Unknown service area";
  return name.charAt(0) + name.slice(1).toLowerCase();
};

/** The proposal as it stands, read-only (proposal-swu-edit and proposal-twu-edit, default). */
export function TeamProposalDetails({ program, proposal, opportunity }: { program: TeamProgram; proposal: TeamProposal; opportunity: OtherProgramOpportunity }) {
  const sprint = program === "sprint-with-us";
  return (
    <>
      <Stack as="section" gap="medium" aria-labelledby="tab-organization">
        <Heading level={3} id="tab-organization">
          Organization
        </Heading>
        <Text elementType="p" data-testid="proposal-organization">
          {proposal.organization?.legalName ?? "Not chosen yet"}
        </Text>
        {proposal.organization?.contact ? (
          <Stack as="dl" direction="row" gap="medium">
            <ContactFacts contact={proposal.organization.contact} />
          </Stack>
        ) : null}
      </Stack>
      <Stack as="section" gap="medium" aria-labelledby="tab-team">
        <Heading level={3} id="tab-team">
          Team
        </Heading>
        {sprint ? (
          <>
            {SWU_PHASES.filter((phase) => proposal.phases[phase]).map((phase) => {
              const team = proposal.phases[phase]!;
              const name = `${SWU_PHASE_NAMES[phase]} phase`;
              return (
                <Stack key={phase} gap="medium">
                  <div role="region" aria-labelledby={`team-caption-${phase}`} tabIndex={0} style={{ overflowX: "auto" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                      <caption id={`team-caption-${phase}`} style={{ textAlign: "start" }}>
                        <Text size="small" color="secondary">{`${name} team`}</Text>
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" style={cell}>
                            Team member
                          </th>
                          <th scope="col" style={cell}>
                            Scrum master
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.members.length === 0 ? (
                          <tr>
                            <td style={cell} colSpan={2}>
                              Nobody named yet
                            </td>
                          </tr>
                        ) : (
                          team.members.map((member) => (
                            <tr key={member.member.id}>
                              <td style={cell}>{member.member.name}</td>
                              <td style={cell}>{member.scrumMaster ? "Yes" : "No"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Text elementType="p">{`${name} proposed cost: ${dollars(team.proposedCost)}`}</Text>
                </Stack>
              );
            })}
            <Text elementType="p">{`Total proposed cost: ${dollars(proposal.totalProposedCost ?? 0)} of the ${dollars(proposal.opportunity.budget)} maximum budget.`}</Text>
          </>
        ) : (
          <>
            {proposal.team.length === 0 ? (
              <Text elementType="p">Nobody named yet.</Text>
            ) : (
              <div role="region" aria-labelledby="team-caption" tabIndex={0} style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <caption id="team-caption" style={{ textAlign: "start" }}>
                    <Text size="small" color="secondary">
                      The team, by resource
                    </Text>
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" style={cell}>
                        Team member
                      </th>
                      <th scope="col" style={cell}>
                        Resource
                      </th>
                      <th scope="col" style={cell}>
                        Hourly rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.team.map((member) => (
                      <tr key={member.member.id}>
                        <td style={cell}>{member.member.name}</td>
                        <td style={cell}>{`${areaName(member.resource.serviceArea)}${member.resource.targetAllocation !== null ? `, ${member.resource.targetAllocation}% of full time` : ""}`}</td>
                        <td style={cell}>{`$${member.hourlyRate.toLocaleString("en-CA")}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {proposal.totalProposedCost !== null ? (
              <Text elementType="p">{`Estimated cost over the contract: ${dollars(proposal.totalProposedCost)} of the ${dollars(proposal.opportunity.budget)} maximum budget.`}</Text>
            ) : null}
          </>
        )}
      </Stack>
      <Stack as="section" gap="medium" aria-labelledby="tab-questions">
        <Heading level={3} id="tab-questions">
          {sprint ? "Team questions" : "Resource questions"}
        </Heading>
        {opportunity.questions.length === 0 ? (
          <Text elementType="p">This opportunity asks no questions.</Text>
        ) : (
          <Stack as="ol" gap="medium">
            {opportunity.questions.map((question, order) => {
              const response = proposal.responses.find((entry) => entry.order === order)?.response ?? "";
              return (
                <li key={order}>
                  <Stack gap="small">
                    <Text elementType="p">{question.question}</Text>
                    <Text elementType="p">{`Response: ${response.trim() === "" ? "Not entered yet" : response}`}</Text>
                  </Stack>
                </li>
              );
            })}
          </Stack>
        )}
      </Stack>
      {sprint ? (
        <Stack as="section" gap="medium" aria-labelledby="tab-references">
          <Heading level={3} id="tab-references">
            References
          </Heading>
          {proposal.references.length === 0 ? (
            <Text elementType="p">No references have been added.</Text>
          ) : (
            <ul>
              {proposal.references.map((reference, index) => (
                <li key={index}>{[reference.name, reference.email, reference.phone].filter((part) => part.trim() !== "").join(", ")}</li>
              ))}
            </ul>
          )}
        </Stack>
      ) : null}
      <Stack as="section" gap="medium" aria-labelledby="tab-attachments">
        <Heading level={3} id="tab-attachments">
          Attachments
        </Heading>
        {proposal.attachments.length === 0 ? (
          <Text elementType="p">No attachments have been added.</Text>
        ) : (
          <ul data-testid="attachment-list">
            {proposal.attachments.map((attachment) => (
              <li key={attachment.id} data-testid="attachment-existing-row">
                <Link
                  href={fileContentAddress(attachment.id)}
                  data-testid="attachment-download-link"
                  onClick={(event) => {
                    event.preventDefault();
                    void downloadFile(attachment.id, attachment.name);
                  }}
                >
                  {`Download ${attachment.name}`}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Stack>
    </>
  );
}

const percent = (value: number | null) => (value === null ? "Not scored" : `${value}%`);

/**
 * The vendor's result once a decision has been made (R-2.32): the anonymous name evaluators saw
 * (R-2.5), each stage's score, the weighted total and the rank.
 */
function ScoresheetDetails({ program, proposal, scoresheet }: { program: TeamProgram; proposal: TeamProposal; scoresheet: Scoresheet }) {
  const sprint = program === "sprint-with-us";
  return (
    <>
      {proposal.anonymousProponentName ? (
        <Text elementType="p">
          During evaluation, evaluators saw this proposal as <span data-testid="proposal-anonymous-name">{proposal.anonymousProponentName}</span>.
        </Text>
      ) : null}
      <Stack as="dl" direction="row" gap="medium">
        <Fact label={sprint ? "Team questions" : "Resource questions"}>{percent(scoresheet.questions)}</Fact>
        <Fact label={sprint ? "Code challenge" : "Challenge"}>{percent(scoresheet.challenge)}</Fact>
        {sprint ? <Fact label="Team scenario">{percent(scoresheet.scenario)}</Fact> : null}
        <Fact label="Price">{percent(scoresheet.price)}</Fact>
        <Fact label="Total" testId="proposal-total-score">
          {percent(scoresheet.total)}
        </Fact>
        {scoresheet.rank ? (
          <Fact label="Rank" testId="proposal-rank">
            {rankLabel(scoresheet.rank)}
          </Fact>
        ) : null}
      </Stack>
      <Text elementType="p" size="small" color="secondary">
        The total combines each stage's score in the proportions the opportunity states.
      </Text>
    </>
  );
}
