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
import { EvaluatedOpportunity, EvaluationTab, evaluationTabsFor } from "@rules/individual-evaluation";
import { offersFinalize } from "@rules/consensus";
import type { Account } from "../api/accounts";
import type { RunningAction } from "../api/opportunities";
import { finalizeConsensus } from "../api/evaluations";
import {
  OtherProgramChange,
  OtherProgramOpportunity,
  attachToOtherProgramOpportunity,
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
import { EvaluationListTab, InstructionsTab } from "./evaluation-tabs";
import { ConsensusTab, FinalizeDialog, FinalizeRefusal, finalizingWords } from "./evaluation-consensus-tab";
import { ProposalsTab } from "./opportunity-cwu-proposals-tab";
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
 * its own address (`?tab=…`). Its author and administrators see those; a member of its panel sees
 * only the evaluation tools their place on it gives them — the instructions and their own
 * evaluations to an evaluator, the consensus to the chair (R-5.19, R-5.34) — and the panel tab
 * stays its author's and administrators' (R-5.18). Anybody offered no tab is shown the missing page.
 *
 * The action bar offers only what the person may do in the opportunity's state, as on the Code
 * With Us manage page (R-1.20, R-1.22, R-1.28, R-1.53, R-1.56).
 */
type Loaded = { readonly kind: "loading" } | { readonly kind: "missing" } | { readonly kind: "found"; readonly opportunity: OtherProgramOpportunity };

type ManagerTab = "summary" | "opportunity" | "addenda" | "history" | "proposals" | "evaluationPanel";
type Tab = ManagerTab | EvaluationTab;

const TAB_NAMES: Readonly<Record<Tab, string>> = {
  summary: "Summary",
  opportunity: "Opportunity",
  addenda: "Addenda",
  history: "History",
  proposals: "Proposals",
  evaluationPanel: "Evaluation panel",
  instructions: "Instructions",
  evaluation: "Evaluation",
  consensus: "Consensus",
};

const TAB_TEST_IDS: Readonly<Record<Tab, string>> = {
  summary: "opportunity-tab-summary",
  opportunity: "opportunity-tab-opportunity",
  addenda: "opportunity-tab-addenda",
  history: "opportunity-tab-history",
  proposals: "opportunity-tab-proposals",
  evaluationPanel: "opportunity-tab-evaluation-panel",
  instructions: "opportunity-tab-instructions",
  evaluation: "opportunity-tab-evaluation",
  consensus: "opportunity-tab-consensus",
};

/** The surface title of each evaluation tab, which is a surface of its own. */
const EVALUATION_TAB_TITLES: Readonly<Record<EvaluationTab, string>> = {
  instructions: "Instructions",
  evaluation: "Evaluation",
  consensus: "Consensus",
};

const isEvaluationTab = (tab: unknown): tab is EvaluationTab => tab === "instructions" || tab === "evaluation" || tab === "consensus";

const TITLES: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "Manage a Sprint With Us opportunity",
  "team-with-us": "Manage a Team With Us opportunity",
};

/** The Evaluation panel tab's own surface title (evaluation-panel-swu, evaluation-panel-twu). */
export const PANEL_TITLE = "Evaluation Panel";

const DONE: Readonly<Record<"submit" | "publish" | "save" | "finalize" | RunningAction["tag"], string>> = {
  submit: "The opportunity has been submitted for review. Every administrator has been told.",
  publish: "The opportunity has been published.",
  save: "Your changes have been saved.",
  cancel: "The opportunity has been cancelled. Everyone watching it and everyone who submitted a proposal is being told.",
  addAddendum: "The addendum has been added.",
  finalize: "The consensus scores have been finalized. The chair and the opportunity's owner are being told.",
};

/**
 * The tabs follow the stage: an addendum needs an opportunity that is no longer a draft (R-1.32),
 * and only one that has been put forward can have proposals; the Proposals tab itself says when
 * they can be read (R-1.31, R-2.25).
 */
export function otherTabsFor(status: OpportunityStatus): readonly ManagerTab[] {
  return status === "DRAFT"
    ? ["summary", "opportunity", "history", "evaluationPanel"]
    : ["summary", "opportunity", "addenda", "history", "proposals", "evaluationPanel"];
}

/** What the evaluation rules turn on, read from the opportunity as the service answered with it. */
export function evaluatedFrom(opportunity: OtherProgramOpportunity): EvaluatedOpportunity {
  return {
    status: opportunity.status,
    createdBy: opportunity.createdBy?.id ?? null,
    panel: (opportunity.evaluationPanel ?? []).map((member) => ({ user: member.user.id, evaluator: member.evaluator, chair: member.chair })),
  };
}

/**
 * Every tab the person is offered: the manage page's own to its author and administrators, then
 * the evaluation tools their place on the panel gives them (R-5.34). Somebody offered none is shown
 * the missing page.
 */
export function manageTabsFor(account: Account, opportunity: OtherProgramOpportunity): readonly Tab[] {
  const manager = mayManageOpportunity(account, { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null });
  return [...(manager ? otherTabsFor(opportunity.status) : []), ...evaluationTabsFor(account, evaluatedFrom(opportunity))];
}

/**
 * The tab an address asks for, among those offered: the first offered when it asks for none; to the
 * author or an administrator, the Summary for any other name, as before; and nothing — the missing
 * page — for an evaluation tab not offered to this person, or for anything but their evaluation
 * tabs to a panel member who does not manage it (design gap 5, following R-5.18).
 */
export function chosenTab(offered: readonly Tab[], asked: unknown): Tab | null {
  if (offered.includes(asked as Tab)) return asked as Tab;
  if (asked === undefined || asked === null || asked === "") return offered[0] ?? null;
  if (isEvaluationTab(asked) || !offered.includes("summary")) return null;
  return "summary";
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
  if (!opportunity || manageTabsFor(account, opportunity).length === 0) return <NotFound />;
  return <Manage program={program} account={account} initial={opportunity} />;
}

function Manage({ program, account, initial }: { program: OtherProgram; account: Account; initial: OtherProgramOpportunity }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const [opportunity, setOpportunity] = useState(initial);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dialog, setDialog] = useState<"publish" | "delete" | "cancel" | "finalize" | null>(null);
  // A refusal to finalise, named (R-1.41); shown above the tab, whichever tab is open.
  const [finalizeRefusal, setFinalizeRefusal] = useState<readonly string[] | null>(null);
  const finalizeRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  // Bumped when the form is saved, so it starts again from what was saved.
  const [formVersion, setFormVersion] = useState(0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const candidates = usePanelCandidates(account);

  useEffect(() => {
    if (notice && notice.kind !== "done") noticeRef.current?.focus();
  }, [notice]);

  useEffect(() => {
    if (finalizeRefusal) finalizeRef.current?.focus();
  }, [finalizeRefusal]);

  const standing = { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null };
  const draft = opportunity.status === "DRAFT";
  const offered = manageTabsFor(account, opportunity);
  const chosen = chosenTab(offered, search.tab);
  const tab: Tab = chosen ?? "summary";
  // The document title is the surface title, and the panel and evaluation tabs are surfaces of their own.
  useScreenTitle(tab === "evaluationPanel" ? PANEL_TITLE : isEvaluationTab(tab) ? EVALUATION_TAB_TITLES[tab] : TITLES[program]);
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
    // The one way out of the consensus stage, for the owner and administrators alike (R-1.50, R-5.14).
    finalize: offersFinalize(account, evaluatedFrom(opportunity)),
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

  /** Finalises the consensus; a refusal names why and the opportunity stays where it is (R-1.41). */
  async function finalize() {
    if (busy) return;
    setBusy(true);
    const answer = await finalizeConsensus(program, opportunity.id);
    setBusy(false);
    setDialog(null);
    if (answer.kind === "saved") {
      setFinalizeRefusal(null);
      setOpportunity(answer.opportunity);
      setNotice({ kind: "done", text: DONE.finalize });
      return;
    }
    setNotice(null);
    setFinalizeRefusal(answer.kind === "refused" ? answer.reasons : ["The consensus scores could not be finalized. Try again."]);
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

  if (chosen === null) return <NotFound />;

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
      {(offers.edit && !editing) || offers.submit || offers.publish || offers.delete || offers.cancel || offers.finalize ? (
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
          {offers.finalize ? (
            <Button variant="primary" isDisabled={busy} onPress={() => setDialog("finalize")} data-testid="finalize-consensus-button">
              Finalize consensus scores
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
      {finalizeRefusal ? <FinalizeRefusal reasons={finalizeRefusal} alertRef={finalizeRef} /> : null}
      <Stack as="section" gap="medium" aria-labelledby="tab-heading">
        <Heading level={2} id="tab-heading">
          {TAB_NAMES[tab]}
        </Heading>
        <NoticeArea notice={notice} noticeRef={noticeRef} />
        {tab === "summary" ? (
          <>
            {opportunity.status === "EVAL_QUESTIONS_CONSENSUS" && offers.finalize ? <Text elementType="p">{finalizingWords(program)}</Text> : null}
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
            initialAttachments={opportunity.attachments}
            attachNow={async (fileIds) => {
              const answer = await attachToOtherProgramOpportunity(program, opportunity.id, fileIds);
              if (answer.kind === "saved") {
                setOpportunity(answer.opportunity);
                return null;
              }
              return answer.kind === "refused" && answer.reasons.length > 0 ? answer.reasons.join(" ") : "The file could not be attached. Try again.";
            }}
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
        {tab === "proposals" ? <ProposalsTab program={program} opportunity={opportunity} /> : null}
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
        {tab === "instructions" ? <InstructionsTab program={program} /> : null}
        {tab === "evaluation" ? (
          <EvaluationListTab program={program} account={account} opportunity={opportunity} onSubmitted={setOpportunity} />
        ) : null}
        {tab === "consensus" ? <ConsensusTab program={program} account={account} opportunity={opportunity} onSubmitted={setOpportunity} /> : null}
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
      <FinalizeDialog
        program={program}
        isOpen={dialog === "finalize"}
        isSending={busy}
        onCancel={() => setDialog(null)}
        onConfirm={() => void finalize()}
      />
      <DeleteDialog isOpen={dialog === "delete"} isSending={busy} onCancel={() => setDialog(null)} onConfirm={() => void remove()} />
    </Stack>
  );
}
