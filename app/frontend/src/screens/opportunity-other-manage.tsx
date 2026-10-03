import { useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  OpportunityStatus,
  PROGRAM_NAMES,
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
import type { OtherProgram } from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import type { RunningAction } from "../api/opportunities";
import {
  OtherProgramChange,
  OtherProgramOpportunity,
  changeOtherProgramOpportunity,
  deleteOtherProgramOpportunity,
  fetchOtherProgramOpportunity,
  runOtherProgramOpportunity,
  submissionFrom,
} from "../api/other-programs";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { EvaluationPanelTab } from "./evaluation-panel-tab";
import { PublishDialog } from "./opportunity-cwu-form";
import { DeleteDialog, Notice, NoticeArea, refusalNotice } from "./opportunity-cwu-edit";
import { usePanelCandidates } from "./opportunity-other-create";
import { OtherProgramForm } from "./opportunity-other-form";
import { Fact, StatusBadge, dayLabel, deadlineLabel, publishedLabel, todayInPacific } from "./opportunity-parts";
import { AddendaTab, CancelDialog, HistoryTable, ReportingSection, Sent } from "./opportunity-running";

/**
 * Manage a Sprint With Us or Team With Us opportunity, at `/opportunities/<program>/<id>/edit`
 * (opportunity-swu-edit, opportunity-twu-edit; decision record 0045): its summary with the
 * reporting figures (R-1.30), its details in their form (R-1.4, R-1.56), its addenda once it is no
 * longer a draft (R-1.32), its history, with any private notes but no way to add one (R-1.33), and
 * its evaluation panel (evaluation-panel-swu, evaluation-panel-twu; R-5.16, R-5.18). Each tab has
 * its own address (`?tab=…`). Only its author and administrators see it; anybody else, a panel
 * member included, is shown the missing page (R-1.30, R-5.18).
 *
 * The action bar offers only what the person may do in the opportunity's state, as on the Code
 * With Us manage page (R-1.20, R-1.22, R-1.28, R-1.53, R-1.56).
 */
type Loaded = { readonly kind: "loading" } | { readonly kind: "missing" } | { readonly kind: "found"; readonly opportunity: OtherProgramOpportunity };

type Tab = "summary" | "opportunity" | "addenda" | "history" | "evaluationPanel";

const TAB_NAMES: Readonly<Record<Tab, string>> = {
  summary: "Summary",
  opportunity: "Opportunity",
  addenda: "Addenda",
  history: "History",
  evaluationPanel: "Evaluation panel",
};

const TAB_TEST_IDS: Readonly<Record<Tab, string>> = {
  summary: "opportunity-tab-summary",
  opportunity: "opportunity-tab-opportunity",
  addenda: "opportunity-tab-addenda",
  history: "opportunity-tab-history",
  evaluationPanel: "opportunity-tab-evaluation-panel",
};

const TITLES: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "Manage a Sprint With Us opportunity",
  "team-with-us": "Manage a Team With Us opportunity",
};

/** The Evaluation panel tab's own surface title (evaluation-panel-swu, evaluation-panel-twu). */
export const PANEL_TITLE = "Evaluation Panel";

const DONE: Readonly<Record<"submit" | "publish" | "save" | RunningAction["tag"], string>> = {
  submit: "The opportunity has been submitted for review. Every administrator has been told.",
  publish: "The opportunity has been published.",
  save: "Your changes have been saved.",
  cancel: "The opportunity has been cancelled. Everyone watching it and everyone who submitted a proposal is being told.",
  addAddendum: "The addendum has been added.",
};

/** The tabs follow the stage: an addendum needs an opportunity that is no longer a draft (R-1.32). */
export function otherTabsFor(status: OpportunityStatus): readonly Tab[] {
  return status === "DRAFT"
    ? ["summary", "opportunity", "history", "evaluationPanel"]
    : ["summary", "opportunity", "addenda", "history", "evaluationPanel"];
}

export function OpportunityOtherManageScreen({ program, opportunityId }: { program: OtherProgram; opportunityId: string }) {
  useScreenTitle(TITLES[program]);
  return (
    <RequireSignIn title={TITLES[program]} loadingLabel="Loading opportunity…">
      {(account) => <ManageLoader program={program} account={account} opportunityId={opportunityId} />}
    </RequireSignIn>
  );
}

function ManageLoader({ program, account, opportunityId }: { program: OtherProgram; account: Account; opportunityId: string }) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  useEffect(() => {
    let current = true;
    void fetchOtherProgramOpportunity(program, opportunityId).then((answer) => {
      if (current) setLoaded(answer.kind === "found" ? answer : { kind: "missing" });
    });
    return () => {
      current = false;
    };
  }, [program, opportunityId]);

  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLES[program]}</Heading>
        <Loading label="Loading opportunity…" />
      </Stack>
    );
  }
  const opportunity = loaded.kind === "found" ? loaded.opportunity : null;
  if (!opportunity || !mayManageOpportunity(account, { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null })) {
    return <NotFound />;
  }
  return <Manage program={program} account={account} initial={opportunity} />;
}

function Manage({ program, account, initial }: { program: OtherProgram; account: Account; initial: OtherProgramOpportunity }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const [opportunity, setOpportunity] = useState(initial);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dialog, setDialog] = useState<"publish" | "delete" | "cancel" | null>(null);
  const [busy, setBusy] = useState(false);
  // Bumped when the form is saved, so it starts again from what was saved.
  const [formVersion, setFormVersion] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const candidates = usePanelCandidates(account);

  useEffect(() => {
    if (notice && notice.kind !== "done") noticeRef.current?.focus();
  }, [notice]);

  const standing = { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null };
  const draft = opportunity.status === "DRAFT";
  const offered = otherTabsFor(opportunity.status);
  const tab: Tab = offered.includes(search.tab as Tab) ? (search.tab as Tab) : "summary";
  // The document title is the surface title, and the panel tab is a surface of its own.
  useScreenTitle(tab === "evaluationPanel" ? PANEL_TITLE : TITLES[program]);
  const base = `/opportunities/${program}/${opportunity.id}/edit`;
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
    cancel: mayCancelOpportunity(account) && isPermittedTransition(program, opportunity.status, "CANCELED"),
  };
  const editing = tab === "opportunity" && mayEdit;

  function goToTab(next: Tab) {
    const params = { opportunityId: opportunity.id };
    const search = { tab: next } as never;
    void (program === "sprint-with-us"
      ? navigate({ to: "/opportunities/sprint-with-us/$opportunityId/edit", params, search })
      : navigate({ to: "/opportunities/team-with-us/$opportunityId/edit", params, search }));
  }

  /** Cancelling or an addendum; a refusal of the addendum is said beside what was typed. */
  async function run(action: RunningAction): Promise<Sent> {
    setBusy(true);
    const answer = await runOtherProgramOpportunity(program, opportunity.id, action);
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

  async function act(action: "submit" | "publish") {
    if (busy) return;
    setBusy(true);
    const change: OtherProgramChange = { tag: action === "submit" ? "submitForReview" : "publish" };
    const answer = await changeOtherProgramOpportunity(program, opportunity.id, change);
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
    const answer = await deleteOtherProgramOpportunity(program, opportunity.id);
    setBusy(false);
    setDialog(null);
    if (answer.kind === "saved") {
      void navigate({ to: "/dashboard" });
      return;
    }
    setNotice({ kind: "refused", text: answer.kind === "refused" ? answer.reasons.join(" ") : "The opportunity could not be deleted. Try again." });
  }

  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          {TITLES[program]}
        </Text>
        <Heading level={1}>{opportunity.title || "Untitled opportunity"}</Heading>
      </Stack>
      <Stack direction="row" align="center" gap="medium">
        <Text elementType="p">
          Status: <StatusBadge status={opportunity.status} program={program} />
        </Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">{opportunity.id}</span>
        </Text>
      </Stack>
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
              <Link href={`${base}?tab=${name}`} aria-current={name === tab ? "page" : undefined} data-testid={TAB_TEST_IDS[name]}>
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
        <NoticeArea notice={notice} noticeRef={noticeRef} />
        {tab === "summary" ? (
          <>
            <Stack as="dl" direction="row" gap="medium">
              <Fact label="Program">{PROGRAM_NAMES[program]}</Fact>
              <Fact label="Proposal deadline">{deadlineLabel(opportunity.proposalDeadline)}</Fact>
              <Fact label="Assignment date">{dayLabel(opportunity.assignmentDate)}</Fact>
              <Fact label={opportunity.value.term}>
                {opportunity.value.amount > 0 ? `$${opportunity.value.amount.toLocaleString("en-CA")}` : "Not entered"}
              </Fact>
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
        ) : null}
        {tab === "opportunity" ? (
          <OtherProgramForm
            key={formVersion}
            program={program}
            purpose="edit"
            account={account}
            initial={submissionFrom(opportunity)}
            isDraft={draft}
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
            onSend={(_action, submission) => changeOtherProgramOpportunity(program, opportunity.id, { tag: "edit", submission })}
            onSaved={(saved) => {
              setOpportunity(saved);
              setFormVersion((version) => version + 1);
              setNotice({ kind: "done", text: DONE.save });
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
        {tab === "evaluationPanel" ? (
          <EvaluationPanelTab
            program={program}
            status={opportunity.status}
            panel={opportunity.evaluationPanel ?? []}
            candidates={candidates}
            onSave={async (panel) => {
              const answer = await changeOtherProgramOpportunity(program, opportunity.id, { tag: "editEvaluationPanel", panel });
              if (answer.kind === "saved") setOpportunity(answer.opportunity);
              return answer;
            }}
          />
        ) : null}
      </Stack>
      <CancelDialog
        key={dialog === "cancel" ? "open" : "closed"}
        isOpen={dialog === "cancel"}
        isSending={busy}
        onKeep={() => setDialog(null)}
        onConfirm={(note) => {
          if (busy) return;
          void run({ tag: "cancel", note }).then(() => setDialog(null));
        }}
      />
      <PublishDialog isOpen={dialog === "publish"} isSending={busy} onCancel={() => setDialog(null)} onConfirm={() => void act("publish")} />
      <DeleteDialog isOpen={dialog === "delete"} isSending={busy} onCancel={() => setDialog(null)} onConfirm={() => void remove()} />
    </Stack>
  );
}
