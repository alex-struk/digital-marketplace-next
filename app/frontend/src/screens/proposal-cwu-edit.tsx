import { RefObject, useEffect, useRef, useState } from "react";
import { AlertDialog, Button, ButtonGroup, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { fileContentAddress } from "@rules/files";
import {
  ProposalProblem,
  isAcceptingProposals,
  offeredProposalActions,
  proposalHistoryLabel,
} from "@rules/proposals";
import { Account, changeOwnAccount } from "../api/accounts";
import { downloadFile } from "../api/files";
import {
  ActingFor,
  CwuProposal,
  ProposalSaveAnswer,
  changeCwuProposal,
  deleteCwuProposal,
  fetchCwuProposal,
  fetchOrganizationsActingFor,
} from "../api/proposals";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { Fact, deadlineLabel, momentLabel } from "./opportunity-parts";
import { CwuProposalForm, ProblemSummary, ProposalStatusBadge, TermsDialog, submissionProblems, valuesFrom } from "./proposal-cwu-form";

/**
 * Manage a Code With Us proposal, at
 * `/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit` (proposal-cwu-edit): its
 * key facts, the actions its state allows, and its Proposal and History tabs (`?tab=…`).
 *
 * It is the vendor's page: the vendor who wrote the proposal, or who owns or administers its
 * organization. Anybody else — another vendor, staff — and a draft that has been deleted are shown
 * the missing page (R-2.4, R-2.24). A draft may be edited, submitted or deleted; a submitted one
 * edited or withdrawn; a withdrawn one edited or put back in (R-2.4, R-2.23). Every submission
 * passes through the terms dialog (R-2.3); one the service refuses because the deadline has passed
 * says so above the tabs (R-2.15). The History tab lists every change of state (R-2.9).
 */

type Tab = "proposal" | "history";
const TABS: readonly Tab[] = ["proposal", "history"];
const TAB_NAMES: Readonly<Record<Tab, string>> = { proposal: "Proposal", history: "History" };

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | { readonly kind: "found"; readonly proposal: CwuProposal; readonly organizations: readonly ActingFor[] };

export function ProposalCwuEditScreen({ opportunityId, proposalId }: { opportunityId: string; proposalId: string }) {
  useScreenTitle("Manage a Code With Us proposal");
  return (
    <RequireSignIn title="Manage a Code With Us proposal" loadingLabel="Loading proposal…">
      {(account) => <ManageLoader account={account} opportunityId={opportunityId} proposalId={proposalId} />}
    </RequireSignIn>
  );
}

function ManageLoader({ account, opportunityId, proposalId }: { account: Account; opportunityId: string; proposalId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const vendor = account.type === "VENDOR";
  useEffect(() => {
    if (!vendor) return;
    let current = true;
    void Promise.all([fetchCwuProposal(proposalId), fetchOrganizationsActingFor()]).then(([answer, organizations]) => {
      if (!current) return;
      setLoaded(answer.kind === "found" ? { kind: "found", proposal: answer.proposal, organizations } : { kind: "missing" });
    });
    return () => {
      current = false;
    };
  }, [proposalId, vendor]);

  if (!vendor || loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>Manage a Code With Us proposal</Heading>
        <Loading label="Loading proposal…" />
      </Stack>
    );
  }
  if (loaded.proposal.opportunity.id !== opportunityId.toLowerCase()) return <NotFound />;
  return <Manage account={account} initial={loaded.proposal} organizations={loaded.organizations} />;
}

/** What the page says after something it did. */
type Notice =
  | { readonly kind: "done"; readonly text: string }
  | { readonly kind: "not-submitted"; readonly reasons: readonly string[] }
  | { readonly kind: "incomplete"; readonly problems: readonly ProposalProblem[] }
  | { readonly kind: "refused"; readonly title: string; readonly reasons: readonly string[] };

function Manage({ account, initial, organizations }: { account: Account; initial: CwuProposal; organizations: readonly ActingFor[] }) {
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

  const tab: Tab = TABS.includes(search.tab as Tab) ? (search.tab as Tab) : "proposal";
  const opportunityId = proposal.opportunity.id;
  const base = `/opportunities/code-with-us/${opportunityId}/proposals/${proposal.id}`;
  const offers = offeredProposalActions(proposal.status);
  // The organization already named stays a choice even when the vendor no longer administers it.
  const named = proposal.proponent.tag === "organization" ? proposal.proponent.value : null;
  const choices = named && !organizations.some((organization) => organization.id === named.id) ? [...organizations, named] : organizations;

  function goToTab(next: Tab) {
    void navigate({
      to: "/opportunities/code-with-us/$opportunityId/proposals/$proposalId/edit",
      params: { opportunityId, proposalId: proposal.id },
      search: { tab: next } as never,
    });
  }

  /** The answer to a change: the proposal as it now stands, or why not. */
  function settle(answer: ProposalSaveAnswer, done: string, refusedTitle: string) {
    if (answer.kind === "saved") {
      setProposal(answer.proposal);
      setNotice({ kind: "done", text: done });
      return;
    }
    const reasons = answer.kind === "refused" ? answer.reasons : ["The service could not do that. Try again."];
    if (refusedTitle === "Your proposal was not submitted") setNotice({ kind: "not-submitted", reasons });
    else setNotice({ kind: "refused", title: refusedTitle, reasons });
  }

  /**
   * Submit proposal: what it holds is checked first, and then the terms are asked for (R-2.3,
   * R-2.13). Once the deadline has passed nothing is worth completing, so the submission goes to the
   * service, whose refusal says why (R-2.15).
   */
  function askToSubmit() {
    const late = !isAcceptingProposals(proposal.opportunity, new Date());
    const problems = late ? [] : submissionProblems(valuesFrom(proposal));
    if (problems.length > 0) {
      setNotice({ kind: "incomplete", problems });
      return;
    }
    setNotice(null);
    setDialog("terms");
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    const accepted = await changeOwnAccount(account.id, "acceptTerms");
    const answer: ProposalSaveAnswer = accepted.kind === "saved" ? await changeCwuProposal(proposal.id, "submit") : { kind: "failed" };
    setBusy(false);
    setDialog(null);
    settle(answer, "Your proposal has been submitted.", "Your proposal was not submitted");
  }

  async function withdraw() {
    if (busy) return;
    setBusy(true);
    const answer = await changeCwuProposal(proposal.id, "withdraw");
    setBusy(false);
    setDialog(null);
    settle(answer, "Your proposal has been withdrawn.", "Your proposal was not withdrawn");
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    const answer = await deleteCwuProposal(proposal.id);
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
          Manage a Code With Us proposal
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
          {opportunityId}
        </Fact>
        <Fact label="Proposal deadline">{deadlineLabel(proposal.opportunity.proposalDeadline)}</Fact>
      </Stack>
      <Stack direction="row" align="center" gap="medium">
        <Link href={`/opportunities/code-with-us/${opportunityId}`}>View the opportunity</Link>
        <Link href={`${base}/export`} data-testid="proposal-export-link">
          Printable copy
        </Link>
      </Stack>
      {/* While the form is open its own save row takes the action bar's place. */}
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
                <Button variant="primary" isDisabled={busy} onPress={askToSubmit} data-testid="proposal-submit">
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
          {TABS.map((name) => (
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
            <CwuProposalForm
              key={formVersion}
              purpose="edit"
              opportunityId={opportunityId}
              initial={valuesFrom(proposal)}
              initialAttachments={proposal.attachments}
              organizations={choices}
              headingLevel={3}
              refusalTitle="Your changes were not saved"
              onSend={async (action, submission) => {
                if (action === "save") return changeCwuProposal(proposal.id, "edit", submission);
                const accepted = await changeOwnAccount(account.id, "acceptTerms");
                if (accepted.kind !== "saved") return { kind: "failed" };
                const saved = await changeCwuProposal(proposal.id, "edit", submission);
                if (saved.kind !== "saved" || saved.proposal.status === "SUBMITTED") return saved;
                return changeCwuProposal(proposal.id, "submit");
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
        {tab === "proposal" && !editing ? <ProposalDetails proposal={proposal} /> : null}
        {tab === "history" ? <ProposalHistory proposal={proposal} /> : null}
      </Stack>
      <TermsDialog isOpen={dialog === "terms"} isSending={busy} onCancel={() => setDialog(null)} onConfirm={() => void submit()} />
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
            {`It will no longer be considered. You can submit it again only while the opportunity is accepting proposals, until ${deadlineLabel(
              proposal.opportunity.proposalDeadline,
            )}.`}
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
  if (notice?.kind === "incomplete") {
    return (
      <Stack gap="small">
        <ProblemSummary problems={notice.problems} title="This proposal has" summaryRef={noticeRef} />
        <Text elementType="p">Edit the proposal to complete it, then submit it.</Text>
      </Stack>
    );
  }
  if (notice?.kind === "not-submitted") {
    return (
      <div tabIndex={-1} ref={noticeRef} data-testid="proposal-submit-refused-message">
        <TitledAlert variant="danger" role="alert" title="Your proposal was not submitted">
          {notice.reasons.map((reason) => (
            <Text elementType="p" key={reason}>
              {reason}
            </Text>
          ))}
        </TitledAlert>
      </div>
    );
  }
  if (notice?.kind === "refused") {
    return (
      <div tabIndex={-1} ref={noticeRef} data-testid="proposal-refused-message">
        <TitledAlert variant="danger" role="alert" title={notice.title}>
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

const notEntered = (value: string) => (value.trim() === "" ? "Not entered yet" : value);

/**
 * The proposal as it stands, read-only, with its result once a decision has been made (R-2.32).
 * The read-only proposal page shows the score on its own, so it leaves the result out.
 */
export function ProposalDetails({ proposal, showResult = true }: { proposal: CwuProposal; showResult?: boolean }) {
  const { proponent } = proposal;
  const decided = showResult && (proposal.status === "AWARDED" || proposal.status === "NOT_AWARDED");
  return (
    <>
      {decided && typeof proposal.score === "number" ? (
        <Stack as="section" gap="medium" aria-labelledby="tab-result">
          <Heading level={3} id="tab-result">
            Result
          </Heading>
          <Stack as="dl" direction="row" gap="medium">
            <Fact label="Score" testId="proposal-score">{`${proposal.score}%`}</Fact>
          </Stack>
        </Stack>
      ) : null}
      <Stack as="section" gap="medium" aria-labelledby="tab-proponent">
        <Heading level={3} id="tab-proponent">
          Proponent
        </Heading>
        {proponent.tag === "organization" ? (
          <Stack as="dl" direction="row" gap="medium">
            <Fact label="Proponent type">Organization</Fact>
            <Fact label="Organization">{proponent.value.legalName}</Fact>
          </Stack>
        ) : (
          <Stack as="dl" direction="row" gap="medium">
            <Fact label="Proponent type">Individual</Fact>
            <Fact label="Legal name">{notEntered(proponent.value.legalName)}</Fact>
            <Fact label="Email address">{notEntered(proponent.value.email)}</Fact>
            {proponent.value.phone ? <Fact label="Phone number">{proponent.value.phone}</Fact> : null}
            <Fact label="Address">{notEntered(addressOf(proponent.value))}</Fact>
          </Stack>
        )}
      </Stack>
      <Stack as="section" gap="medium" aria-labelledby="tab-text">
        <Heading level={3} id="tab-text">
          Proposal text
        </Heading>
        <Text elementType="p">{notEntered(proposal.proposalText)}</Text>
      </Stack>
      <Stack as="section" gap="medium" aria-labelledby="tab-comments">
        <Heading level={3} id="tab-comments">
          Additional comments
        </Heading>
        <Text elementType="p">{notEntered(proposal.additionalComments)}</Text>
      </Stack>
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

function addressOf(individual: { street1: string; street2: string; city: string; region: string; mailCode: string; country: string }): string {
  const lines = [individual.street1, individual.street2, individual.city, `${individual.region} ${individual.mailCode}`.trim(), individual.country];
  return lines.map((line) => line.trim()).filter((line) => line !== "").join(", ");
}

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

/** Every change of state, newest first, with who made it and any note (R-2.9, R-2.35), in every program. */
export function ProposalHistory({ proposal }: { proposal: Pick<CwuProposal, "history"> }) {
  return (
    <div role="region" aria-labelledby="history-caption" tabIndex={0} style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="proposal-history-table">
        <caption id="history-caption" style={{ textAlign: "start" }}>
          <Text size="small" color="secondary">
            Every change of state and every score entered, newest first
          </Text>
        </caption>
        <thead>
          <tr>
            <th scope="col" style={cell}>
              Date
            </th>
            <th scope="col" style={cell}>
              Entry
            </th>
            <th scope="col" style={cell}>
              By
            </th>
            <th scope="col" style={cell}>
              Note
            </th>
          </tr>
        </thead>
        <tbody>
          {proposal.history.map((entry, index) => (
            <tr key={`${entry.createdAt}-${index}`}>
              <td style={cell}>
                <time dateTime={entry.createdAt}>{momentLabel(entry.createdAt)}</time>
              </td>
              <td style={cell}>{proposalHistoryLabel(entry)}</td>
              <td style={cell}>{entry.createdBy?.name ?? "System"}</td>
              <td style={cell}>{entry.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
