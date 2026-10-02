import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { AlertDialog, Button, ButtonGroup, Heading, Link, Modal, Text } from "@bcgov/design-system-react-components";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  CwuStatus,
  OPPORTUNITY_INCOMPLETE,
  changeIsAnnounced,
  earliestDeadlineFor,
  isPermittedTransition,
  isUnpublished,
  mayAddAddendum,
  mayCancelOpportunity,
  mayDeleteOpportunity,
  mayEditOpportunity,
  mayManageOpportunity,
  mayPublishOpportunity,
  maySubmitForReview,
} from "@rules/opportunities";
import type { Account } from "../api/accounts";
import {
  CwuOpportunity,
  RunningAction,
  SaveAnswer,
  attachToCwuOpportunity,
  changeCwuOpportunity,
  deleteCwuOpportunity,
  fetchCwuOpportunity,
  runCwuOpportunity,
} from "../api/opportunities";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { CwuOpportunityForm, PublishDialog, valuesFrom } from "./opportunity-cwu-form";
import {
  Fact,
  StatusBadge,
  deadlineLabel,
  publishedLabel,
  rewardLabel,
  todayInPacific,
} from "./opportunity-parts";
import { AddendaTab, CancelDialog, HistoryTable, ReportingSection, Sent } from "./opportunity-running";

/**
 * Manage a Code With Us opportunity, at `/opportunities/code-with-us/:opportunityId/edit`
 * (opportunity-cwu-edit): its summary, its details in their form, and its history, each on its
 * own address (`?tab=…`). Only its author and administrators see it; anybody else is shown the
 * missing page (R-1.3, R-1.30).
 *
 * The action bar offers only what the person may do in the opportunity's state
 * (design/DESIGN.md, "Who is offered what on the manage page"): a draft's author may edit it,
 * submit it for review and delete it; an administrator may edit, publish and delete a draft or an
 * opportunity under review, and edit and cancel one that is published, at its evaluation stage or
 * in processing (R-1.20, R-1.22, R-1.28, R-1.53, R-1.56). Once it is no longer a draft, the Addenda
 * tab adds an addendum (R-1.32); the History tab takes a private note with files (R-1.33); and the
 * Summary tab reports its views, watchers and proposals once it is published (R-1.30).
 */

type Tab = "summary" | "opportunity" | "addenda" | "history";

type Loaded = { readonly kind: "loading" } | { readonly kind: "missing" } | { readonly kind: "found"; readonly opportunity: CwuOpportunity };

export function OpportunityCwuEditScreen({ opportunityId }: { opportunityId: string }) {
  useScreenTitle("Manage a Code With Us opportunity");
  return (
    <RequireSignIn title="Manage a Code With Us opportunity" loadingLabel="Loading opportunity…">
      {(account) => <ManageLoader account={account} opportunityId={opportunityId} />}
    </RequireSignIn>
  );
}

function ManageLoader({ account, opportunityId }: { account: Account; opportunityId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    void fetchCwuOpportunity(opportunityId).then((answer) => {
      if (current) setLoaded(answer.kind === "found" ? { kind: "found", opportunity: answer.opportunity } : { kind: "missing" });
    });
    return () => {
      current = false;
    };
  }, [opportunityId]);

  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>Manage a Code With Us opportunity</Heading>
        <Loading label="Loading opportunity…" />
      </Stack>
    );
  }
  if (
    loaded.kind === "missing" ||
    !mayManageOpportunity(account, { status: loaded.opportunity.status, createdBy: loaded.opportunity.createdBy?.id ?? null })
  ) {
    return <NotFound />;
  }
  return <Manage account={account} initial={loaded.opportunity} />;
}

/** What the page says after something it did: done, refused as incomplete, or refused otherwise. */
type Notice =
  | { readonly kind: "done"; readonly text: string }
  | { readonly kind: "incomplete"; readonly action: "submit" | "publish" }
  | { readonly kind: "refused"; readonly text: string };

const DONE: Readonly<Record<"submit" | "publish" | "save" | RunningAction["tag"], string>> = {
  submit: "The opportunity has been submitted for review. Every administrator has been told.",
  publish: "The opportunity has been published.",
  save: "Your changes have been saved.",
  cancel: "The opportunity has been cancelled. Everyone watching it and everyone who submitted a proposal is being told.",
  addAddendum: "The addendum has been added.",
};

function Manage({ account, initial }: { account: Account; initial: CwuOpportunity }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const [opportunity, setOpportunity] = useState(initial);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dialog, setDialog] = useState<"publish" | "delete" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);
  // Bumped when the form is saved, so it starts again from what was saved; attaching a file at
  // once changes the opportunity without throwing away what is being typed.
  const [formVersion, setFormVersion] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notice && notice.kind !== "done") noticeRef.current?.focus();
  }, [notice]);

  const standing = { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null };
  const draft = opportunity.status === "DRAFT";
  const offered = tabsFor(opportunity.status);
  const tab: Tab = offered.includes(search.tab as Tab) ? (search.tab as Tab) : "summary";
  const base = `/opportunities/code-with-us/${opportunity.id}/edit`;
  const mayEdit = mayEditOpportunity(account, standing);
  const administrator = account.type === "ADMIN";
  const today = todayInPacific();

  const offers = {
    edit: mayEdit,
    // A draft's author is offered Submit for review; an administrator publishes instead.
    submit: draft && !administrator && maySubmitForReview(account, standing),
    publish: isUnpublished(opportunity.status) && mayPublishOpportunity(account),
    delete: mayDeleteOpportunity(account, standing),
    // Published, an evaluation stage or processing, by an administrator (R-1.20, R-1.28).
    cancel: mayCancelOpportunity(account) && isPermittedTransition("code-with-us", opportunity.status, "CANCELED"),
  };
  const editing = tab === "opportunity" && mayEdit;

  /**
   * Cancelling or an addendum. A refusal is said in the tab's section, except for the addendum,
   * whose form says it beside what was typed.
   */
  async function run(action: RunningAction): Promise<Sent> {
    setBusy(true);
    const answer = await runCwuOpportunity(opportunity.id, action);
    setBusy(false);
    if (answer.kind === "saved") {
      setOpportunity(answer.opportunity);
      setNotice({ kind: "done", text: DONE[action.tag] });
      return null;
    }
    const why = answer.kind === "refused" ? answer.reasons.join(" ") : "The service could not do that. Try again.";
    if (action.tag === "cancel") setNotice({ kind: "refused", text: why });
    return why;
  }

  async function cancelOpportunity(note: string) {
    if (busy) return;
    await run({ tag: "cancel", note });
    setDialog(null);
  }

  function goToTab(next: Tab) {
    void navigate({ to: "/opportunities/code-with-us/$opportunityId/edit", params: { opportunityId: opportunity.id }, search: { tab: next } as never });
  }

  async function act(action: "submit" | "publish") {
    if (busy) return;
    setBusy(true);
    const answer = await changeCwuOpportunity(opportunity.id, action === "submit" ? "submitForReview" : "publish");
    setBusy(false);
    setDialog(null);
    if (answer.kind === "saved") {
      setOpportunity(answer.opportunity);
      setNotice({ kind: "done", text: DONE[action] });
      return;
    }
    setNotice(refusalNotice(answer, action));
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    const answer = await deleteCwuOpportunity(opportunity.id);
    setBusy(false);
    setDialog(null);
    if (answer.kind === "saved") {
      void navigate({ to: "/dashboard" });
      return;
    }
    setNotice({
      kind: "refused",
      text: answer.kind === "refused" ? answer.reasons.join(" ") : "The opportunity could not be deleted. Try again.",
    });
  }

  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          Manage a Code With Us opportunity
        </Text>
        <Heading level={1}>{opportunity.title || "Untitled opportunity"}</Heading>
      </Stack>
      <Stack direction="row" align="center" gap="medium">
        <Text elementType="p">
          Status: <StatusBadge status={opportunity.status} />
        </Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">{opportunity.id}</span>
        </Text>
      </Stack>
      {/* The actions stay on every tab, the Opportunity tab's form included, so a draft can be put
          forward from wherever its author is; only Edit is left off where the form is already
          open (decision record 0032). */}
      {(offers.edit && !editing) || offers.submit || offers.publish || offers.delete || offers.cancel ? (
        <ButtonGroup ariaLabel="Opportunity actions">
          {offers.edit && !editing ? (
            <Button variant="secondary" onPress={() => goToTab("opportunity")} data-testid="opportunity-edit-button">
              Edit
            </Button>
          ) : null}
          {offers.submit ? (
            <Button variant="primary" isDisabled={busy} onPress={() => void act("submit")} data-testid="opportunity-submit-for-review">
              Submit for review
            </Button>
          ) : null}
          {offers.publish ? (
            <Button variant="primary" isDisabled={busy} onPress={() => setDialog("publish")} data-testid="opportunity-publish">
              Publish
            </Button>
          ) : null}
          {offers.delete ? (
            <Button variant="secondary" danger isDisabled={busy} onPress={() => setDialog("delete")} data-testid="opportunity-delete-button">
              Delete
            </Button>
          ) : null}
          {offers.cancel ? (
            <Button variant="secondary" danger isDisabled={busy} onPress={() => setDialog("cancel")} data-testid="opportunity-cancel-button">
              Cancel opportunity
            </Button>
          ) : null}
        </ButtonGroup>
      ) : null}
      <nav aria-label="Opportunity sections">
        <Stack as="ul" direction="row" gap="medium">
          {offered.map((name) => (
            <li key={name}>
              <Link
                href={name === "summary" ? `${base}?tab=summary` : `${base}?tab=${name}`}
                aria-current={name === tab ? "page" : undefined}
                data-testid={`opportunity-tab-${name}`}
              >
                {TAB_NAMES[name]}
              </Link>
            </li>
          ))}
        </Stack>
      </nav>
      <Stack as="section" gap="medium" aria-labelledby="tab-heading">
        <Heading level={2} id="tab-heading">
          {TAB_NAMES[tab]}
        </Heading>
        {/* What an action came to is said in the section being read, whichever tab it is. */}
        <NoticeArea notice={notice} noticeRef={noticeRef} />
        {tab === "summary" ? <SummaryTab opportunity={opportunity} /> : null}
        {tab === "opportunity" ? (
          <CwuOpportunityForm
            key={formVersion}
            purpose="edit"
            account={account}
            initial={valuesFrom(opportunity)}
            initialAttachments={opportunity.attachments}
            isDraft={draft}
            today={today}
            earliestDeadline={earliestDeadlineFor(opportunity, today)}
            headingLevel={3}
            readOnly={!mayEdit}
            consequence={
              <Text elementType="p">
                {draft
                  ? "Saving records a new version of the draft. Nothing is checked until it is submitted for review or published."
                  : "Saving records a new version. Everyone watching this opportunity, everyone who has submitted a proposal, and its author will be emailed."}
              </Text>
            }
            onSend={(_action, submission) => changeCwuOpportunity(opportunity.id, "edit", submission)}
            onSaved={(saved) => {
              setOpportunity(saved);
              setFormVersion((version) => version + 1);
              setNotice({ kind: "done", text: DONE.save });
            }}
            attachNow={async (fileIds) => {
              const answer = await attachToCwuOpportunity(opportunity.id, fileIds);
              if (answer.kind === "saved") {
                setOpportunity(answer.opportunity);
                return null;
              }
              return answer.kind === "refused" && answer.reasons.length > 0
                ? answer.reasons.join(" ")
                : "The file could not be attached. Try again.";
            }}
            onCancel={() => goToTab("summary")}
          />
        ) : null}
        {tab === "addenda" ? (
          <AddendaTab
            addenda={opportunity.addenda}
            mayAdd={mayAddAddendum(account, standing)}
            announced={changeIsAnnounced(opportunity.status)}
            onAdd={(addendum) => run({ tag: "addAddendum", addendum })}
          />
        ) : null}
        {/* No screen adds a private note (R-1.33); the history shows the ones there are. */}
        {tab === "history" ? <HistoryTable history={opportunity.history ?? []} /> : null}
      </Stack>
      <CancelDialog
        key={dialog === "cancel" ? "open" : "closed"}
        isOpen={dialog === "cancel"}
        isSending={busy}
        onKeep={() => setDialog(null)}
        onConfirm={(note) => void cancelOpportunity(note)}
      />
      <PublishDialog
        isOpen={dialog === "publish"}
        isSending={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => void act("publish")}
      />
      <Modal isOpen={dialog === "delete"} isDismissable onOpenChange={(open) => (!open && !busy ? setDialog(null) : undefined)}>
        <AlertDialog
          variant="destructive"
          title="Delete this opportunity?"
          data-testid="opportunity-delete-dialog"
          buttons={
            <>
              <Button variant="secondary" isDisabled={busy} onPress={() => setDialog(null)} data-testid="opportunity-dialog-cancel">
                Cancel
              </Button>
              <Button variant="primary" danger isDisabled={busy} onPress={() => void remove()} data-testid="opportunity-delete-confirm">
                Delete opportunity
              </Button>
            </>
          }
        >
          <Text elementType="p">The opportunity and everything entered in it will be removed. This cannot be undone.</Text>
        </AlertDialog>
      </Modal>
    </Stack>
  );
}

const TAB_NAMES: Readonly<Record<Tab, string>> = {
  summary: "Summary",
  opportunity: "Opportunity",
  addenda: "Addenda",
  history: "History",
};

/** The tabs follow the stage: an addendum needs an opportunity that is no longer a draft (R-1.32). */
export function tabsFor(status: CwuStatus): readonly Tab[] {
  return status === "DRAFT" ? ["summary", "opportunity", "history"] : ["summary", "opportunity", "addenda", "history"];
}

function refusalNotice(answer: Exclude<SaveAnswer, { kind: "saved" }>, action: "submit" | "publish"): Notice {
  if (answer.kind === "refused" && answer.reasons.includes(OPPORTUNITY_INCOMPLETE)) return { kind: "incomplete", action };
  if (answer.kind === "refused") return { kind: "refused", text: answer.reasons.join(" ") };
  return { kind: "refused", text: "The service could not do that. Try again." };
}

function NoticeArea({ notice, noticeRef }: { notice: Notice | null; noticeRef: RefObject<HTMLDivElement> }) {
  let shown: ReactNode = null;
  if (notice?.kind === "incomplete") {
    shown = (
      <div tabIndex={-1} ref={noticeRef} data-testid="opportunity-incomplete-message">
        <TitledAlert variant="danger" role="alert" title="This opportunity is incomplete">
          <Text elementType="p">
            {`It could not be ${notice.action === "submit" ? "submitted for review" : "published"}. Edit the opportunity, complete and save the form, and then ${
              notice.action === "submit" ? "submit it" : "publish it"
            } again.`}
          </Text>
        </TitledAlert>
      </div>
    );
  } else if (notice?.kind === "refused") {
    shown = (
      <div tabIndex={-1} ref={noticeRef}>
        <TitledAlert variant="danger" role="alert" title="That could not be done">
          <Text elementType="p">{notice.text}</Text>
        </TitledAlert>
      </div>
    );
  }
  return (
    <>
      {shown}
      <div role="status">{notice?.kind === "done" ? <Text elementType="p">{notice.text}</Text> : null}</div>
    </>
  );
}

function SummaryTab({ opportunity }: { opportunity: CwuOpportunity }) {
  return (
    <>
      <Stack as="dl" direction="row" gap="medium">
        <Fact label="Proposal deadline">{deadlineLabel(opportunity.proposalDeadline)}</Fact>
        <Fact label="Reward">{rewardLabel(opportunity.reward)}</Fact>
        <Fact label="Published">{publishedLabel(opportunity.publishedAt)}</Fact>
        {opportunity.createdBy ? (
          <Fact label="Created by" testId="opportunity-created-by">
            {opportunity.createdBy.name}
          </Fact>
        ) : null}
        {opportunity.updatedBy ? (
          <Fact label="Last changed by" testId="opportunity-last-changed-by">
            {opportunity.updatedBy.name}
          </Fact>
        ) : null}
      </Stack>
      <ReportingSection reporting={opportunity.reporting} unpublished={isUnpublished(opportunity.status)} />
    </>
  );
}
