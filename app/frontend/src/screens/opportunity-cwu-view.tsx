import { useEffect, useRef, useState } from "react";
import { Checkbox, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { Program, mayManageOpportunity } from "@rules/opportunities";
import { mayWatch } from "@rules/opportunity-list";
import { isAcceptingProposals } from "@rules/proposals";
import { CwuOpportunity, fetchCwuOpportunity } from "../api/opportunities";
import { listCwuProposals } from "../api/proposals";
import { countView, setWatching } from "../api/watching";
import { AttachmentList } from "../app/attachments";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { useSession } from "../auth/session";
import { FormattedText } from "../lib/formatted-text/formatted-text";
import { Fact, StatusBadge, dayLabel, deadlineLabel, publishedLabel, rewardLabel } from "./opportunity-parts";
import { AddendaList } from "./opportunity-running";

/**
 * A Code With Us opportunity, at `/opportunities/code-with-us/:opportunityId` (opportunity-cwu-view).
 *
 * Anyone reads a published opportunity; a draft or one under review is the missing page to anybody
 * but its author and administrators (R-1.2). The published date is the first publication (R-1.23).
 * Who created and last changed it is shown only to an administrator and to those people, because
 * the service names them to nobody else (R-1.29). Its author and administrators are offered the way
 * to manage it.
 */
type Loaded = { readonly kind: "loading" } | { readonly kind: "missing" } | { readonly kind: "found"; readonly opportunity: CwuOpportunity };

export function OpportunityCwuViewScreen({ opportunityId }: { opportunityId: string }) {
  useScreenTitle("Code With Us opportunity");
  const session = useSession();
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const ready = session.status !== "starting";
  const viewerId = session.status === "signed-in" ? session.account.id : null;

  // Asked again whoever is signed in, since what the service names depends on who asks.
  useEffect(() => {
    if (!ready) return;
    let current = true;
    setLoaded({ kind: "loading" });
    void fetchCwuOpportunity(opportunityId).then((answer) => {
      if (!current) return;
      setLoaded(answer.kind === "found" ? { kind: "found", opportunity: answer.opportunity } : { kind: "missing" });
    });
    return () => {
      current = false;
    };
  }, [opportunityId, ready, viewerId]);

  // Opening the page is one view, however often it is read again while open (R-1.6).
  const counted = useRef(false);
  useEffect(() => {
    if (loaded.kind !== "found" || counted.current) return;
    counted.current = true;
    void countView("code-with-us", loaded.opportunity.id);
  }, [loaded]);

  if (loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>Code With Us opportunity</Heading>
        <Loading label="Loading opportunity…" />
      </Stack>
    );
  }
  const { opportunity } = loaded;
  const viewer = session.status === "signed-in" ? session.account : null;
  const manages = mayManageOpportunity(viewer, { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null });
  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          Code With Us opportunity
        </Text>
        <Heading level={1}>{opportunity.title || "Untitled opportunity"}</Heading>
      </Stack>
      {opportunity.teaser ? (
        <Text elementType="p" size="large">
          {opportunity.teaser}
        </Text>
      ) : null}
      <Stack as="dl" direction="row" gap="medium">
        <Fact label="Status">
          <StatusBadge status={opportunity.status} />
        </Fact>
        <Fact label="Proposal deadline" testId="opportunity-proposal-deadline">
          {deadlineLabel(opportunity.proposalDeadline)}
        </Fact>
        <Fact label="Reward" testId="opportunity-reward">
          {rewardLabel(opportunity.reward)}
        </Fact>
        <Fact label="Location">{opportunity.location || "Not entered"}</Fact>
        <Fact label="Remote work">
          {opportunity.remoteOk ? `Accepted. ${opportunity.remoteDesc}`.trim() : "Not accepted."}
        </Fact>
        <Fact label="Published" testId="opportunity-published-date">
          {publishedLabel(opportunity.publishedAt)}
        </Fact>
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
      <Text elementType="p" size="small" color="secondary">
        Opportunity ID: <span data-testid="opportunity-identifier">{opportunity.id}</span>
      </Text>
      {mayWatch(viewer, { createdBy: opportunity.createdBy?.id ?? null }) ? (
        <WatchControl key={opportunity.id} opportunity={opportunity} />
      ) : null}
      {viewer?.type === "VENDOR" && isAcceptingProposals(opportunity, new Date()) ? (
        <StartProposal key={`${opportunity.id}-${viewer.id}`} opportunityId={opportunity.id} vendorId={viewer.id} />
      ) : null}
      {manages ? (
        <div>
          <Link href={`/opportunities/code-with-us/${opportunity.id}/edit`} isButton buttonVariant="secondary">
            Manage this opportunity
          </Link>
        </div>
      ) : null}
      <Stack as="section" gap="medium" aria-labelledby="view-description">
        <Heading level={2} id="view-description">
          Description
        </Heading>
        <FormattedText markup={opportunity.description} />
        <AttachmentList attachments={opportunity.attachments} />
      </Stack>
      <Stack as="section" gap="medium" aria-labelledby="view-skills">
        <Heading level={2} id="view-skills">
          Skills
        </Heading>
        {opportunity.skills.length > 0 ? (
          <ul>
            {opportunity.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : (
          <Text elementType="p">No skills have been named.</Text>
        )}
      </Stack>
      <Stack as="section" gap="medium" aria-labelledby="view-dates">
        <Heading level={2} id="view-dates">
          Key dates
        </Heading>
        <ul>
          <li>{`Assignment date: ${dayLabel(opportunity.assignmentDate)}`}</li>
          <li>{`Start date: ${dayLabel(opportunity.startDate)}`}</li>
          {opportunity.completionDate ? <li>{`Completion date: ${dayLabel(opportunity.completionDate)}`}</li> : null}
        </ul>
      </Stack>
      <Stack as="section" gap="medium" aria-labelledby="view-addenda" data-testid="opportunity-addenda">
        <Heading level={2} id="view-addenda">
          Addenda
        </Heading>
        <AddendaList addenda={opportunity.addenda} showAuthor={false} />
      </Stack>
    </Stack>
  );
}

/**
 * Start a proposal (`opportunity-start-proposal`), for a vendor while the opportunity accepts
 * proposals. A vendor who already holds one is taken to it instead of a new one (R-2.2).
 */
function StartProposal({ opportunityId, vendorId }: { opportunityId: string; vendorId: string }) {
  const [held, setHeld] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    void listCwuProposals(opportunityId).then((answer) => {
      const mine = answer.kind === "listed" ? answer.proposals.find((proposal) => proposal.createdBy?.id === vendorId) : undefined;
      if (current && mine) setHeld(mine.id);
    });
    return () => {
      current = false;
    };
  }, [opportunityId, vendorId]);
  const base = `/opportunities/code-with-us/${opportunityId}/proposals`;
  return (
    <div>
      <Link
        href={held ? `${base}/${held}/edit` : `${base}/create`}
        isButton
        buttonVariant="primary"
        data-testid="opportunity-start-proposal"
      >
        {held ? "View your proposal" : "Start a proposal"}
      </Link>
    </div>
  );
}

/**
 * Watching the opportunity, for anyone signed in who did not create it (R-1.5). Ticking or
 * unticking saves at once, and the change is announced; a refusal puts the box back.
 */
export function WatchControl({
  opportunity,
  program = "code-with-us",
}: {
  opportunity: { readonly id: string; readonly subscribed: boolean };
  program?: Program;
}) {
  const [watching, setWatched] = useState(opportunity.subscribed);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function change(value: boolean) {
    setWatched(value);
    setSaving(true);
    setStatus(null);
    const saved = await setWatching(program, opportunity.id, value);
    setSaving(false);
    if (!saved) {
      setWatched(!value);
      setStatus("Your choice could not be saved. Please try again.");
      return;
    }
    setStatus(
      value
        ? "You are watching this opportunity. You will be emailed whenever it changes."
        : "You are no longer watching this opportunity.",
    );
  }

  return (
    <Stack gap="small">
      <Text elementType="p" size="small" color="secondary">
        Watching sends you an email whenever this opportunity changes.
      </Text>
      <Checkbox
        isSelected={watching}
        onChange={(value) => (saving ? undefined : void change(value))}
        data-testid="opportunity-watch-toggle"
      >
        Watch this opportunity
      </Checkbox>
      <div role="status">{status ? <Text elementType="p">{status}</Text> : null}</div>
    </Stack>
  );
}
