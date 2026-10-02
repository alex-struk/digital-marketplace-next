import { useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { useSearch } from "@tanstack/react-router";
import {
  PROGRAM_NAMES,
  changeIsAnnounced,
  isPermittedTransition,
  isUnpublished,
  mayAddAddendum,
  mayCancelOpportunity,
  mayManageOpportunity,
} from "@rules/opportunities";
import type { OtherProgram } from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import type { RunningAction } from "../api/opportunities";
import { OtherProgramOpportunity, fetchOtherProgramOpportunity, runOtherProgramOpportunity } from "../api/other-programs";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { Fact, StatusBadge, dayLabel, deadlineLabel } from "./opportunity-parts";
import { AddendaTab, CancelDialog, HistoryTable, ReportingSection, Sent } from "./opportunity-running";

/**
 * Where a Sprint With Us or Team With Us opportunity is managed, at
 * `/opportunities/<program>/<id>/edit`, as far as slices 8 and 9 build it (decision records 0035 and
 * 0043): its title, state, identifier, key facts and, as R-1.29 allows, who made it, with the
 * reporting figures once it is published (R-1.30); an administrator cancelling it (R-1.28); the
 * Addenda tab once it is no longer a draft (R-1.32); and the History tab, which shows any private
 * notes and their files but offers no way to add one (R-1.33). The program's own tabs and the rest of its actions are slice
 * 10's. Only its author and administrators reach it; anybody else is shown the missing page (R-1.30).
 */
type Loaded = { readonly kind: "loading" } | { readonly kind: "missing" } | { readonly kind: "found"; readonly opportunity: OtherProgramOpportunity };

type Tab = "summary" | "addenda" | "history";

const TAB_NAMES: Readonly<Record<Tab, string>> = { summary: "Summary", addenda: "Addenda", history: "History" };

const TITLES: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "Manage a Sprint With Us opportunity",
  "team-with-us": "Manage a Team With Us opportunity",
};

const DONE: Readonly<Record<RunningAction["tag"], string>> = {
  cancel: "The opportunity has been cancelled. Everyone watching it and everyone who submitted a proposal is being told.",
  addAddendum: "The addendum has been added.",
};

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
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const [opportunity, setOpportunity] = useState(initial);
  const [notice, setNotice] = useState<{ readonly kind: "done" | "refused"; readonly text: string } | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notice?.kind === "refused") noticeRef.current?.focus();
  }, [notice]);

  const standing = { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null };
  const offered: readonly Tab[] = opportunity.status === "DRAFT" ? ["summary", "history"] : ["summary", "addenda", "history"];
  const tab: Tab = offered.includes(search.tab as Tab) ? (search.tab as Tab) : "summary";
  const base = `/opportunities/${program}/${opportunity.id}/edit`;
  const mayCancel = mayCancelOpportunity(account) && isPermittedTransition(program, opportunity.status, "CANCELED");

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
          Status: <StatusBadge status={opportunity.status} />
        </Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">{opportunity.id}</span>
        </Text>
      </Stack>
      {mayCancel ? (
        <ButtonGroup ariaLabel="Opportunity actions">
          <Button variant="secondary" danger isDisabled={busy} onPress={() => setCancelling(true)} data-testid="opportunity-cancel-button">
            Cancel opportunity
          </Button>
        </ButtonGroup>
      ) : null}
      <nav aria-label="Opportunity sections">
        <Stack as="ul" direction="row" gap="medium">
          {offered.map((name) => (
            <li key={name}>
              <Link href={`${base}?tab=${name}`} aria-current={name === tab ? "page" : undefined} data-testid={`opportunity-tab-${name}`}>
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
        {notice?.kind === "refused" ? (
          <div tabIndex={-1} ref={noticeRef}>
            <TitledAlert variant="danger" role="alert" title="That could not be done">
              <Text elementType="p">{notice.text}</Text>
            </TitledAlert>
          </div>
        ) : null}
        <div role="status">{notice?.kind === "done" ? <Text elementType="p">{notice.text}</Text> : null}</div>
        {tab === "summary" ? (
          <>
            <Stack as="dl" direction="row" gap="medium">
              <Fact label="Program">{PROGRAM_NAMES[program]}</Fact>
              <Fact label="Proposal deadline">{deadlineLabel(opportunity.proposalDeadline)}</Fact>
              <Fact label="Assignment date">{dayLabel(opportunity.assignmentDate)}</Fact>
              <Fact label={opportunity.value.term}>
                {opportunity.value.amount > 0 ? `$${opportunity.value.amount.toLocaleString("en-CA")}` : "Not entered"}
              </Fact>
              {opportunity.createdBy !== undefined ? (
                <Fact label="Created by" testId="opportunity-created-by">
                  {opportunity.createdBy?.name ?? ""}
                </Fact>
              ) : null}
              {opportunity.updatedBy !== undefined ? (
                <Fact label="Last changed by" testId="opportunity-last-changed-by">
                  {opportunity.updatedBy?.name ?? ""}
                </Fact>
              ) : null}
            </Stack>
            <ReportingSection reporting={opportunity.reporting} unpublished={isUnpublished(opportunity.status)} />
            <Text elementType="p">
              The rest of this opportunity — what makes it a {PROGRAM_NAMES[program]} opportunity, and putting it forward for
              review or publication — cannot be managed here yet.
            </Text>
          </>
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
        key={cancelling ? "open" : "closed"}
        isOpen={cancelling}
        isSending={busy}
        onKeep={() => setCancelling(false)}
        onConfirm={(note) => {
          if (busy) return;
          void run({ tag: "cancel", note }).then(() => setCancelling(false));
        }}
      />
    </Stack>
  );
}
