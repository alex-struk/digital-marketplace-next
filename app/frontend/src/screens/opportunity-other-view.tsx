import { useEffect, useRef, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { mayManageOpportunity } from "@rules/opportunities";
import { isAcceptingProposals } from "@rules/proposals";
import { mayWatch } from "@rules/opportunity-list";
import { OtherProgram, SERVICE_AREAS, SWU_PHASE_NAMES } from "@rules/other-program-drafts";
import { Page, fetchPage } from "../api/content";
import { OtherProgramOpportunity, fetchOtherProgramOpportunity } from "../api/other-programs";
import { listTeamProposals } from "../api/team-proposals";
import { countView } from "../api/watching";
import { AttachmentList } from "../app/attachments";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { useSession } from "../auth/session";
import { FormattedText } from "../lib/formatted-text/formatted-text";
import { WatchControl } from "./opportunity-cwu-view";
import { Fact, StatusBadge, SuccessfulProponentSection, dayLabel, deadlineLabel, publishedLabel } from "./opportunity-parts";
import { AddendaList } from "./opportunity-running";

/**
 * A Sprint With Us or Team With Us opportunity, at `/opportunities/sprint-with-us/:opportunityId`
 * and `/opportunities/team-with-us/:opportunityId` (opportunity-swu-view, opportunity-twu-view).
 *
 * Anyone reads a published opportunity; a draft or one under review is the missing page to anybody
 * but its author and administrators (R-1.2). Opening it counts a view (R-1.6). Who created and last
 * changed it is shown only as the service names them (R-1.29). It shows only its own program's
 * content (R-1.8): Sprint With Us its phases and skills, Team With Us its resources and contract
 * dates.
 *
 * Each embeds a page of the service's own prose — Sprint With Us the scope of its opportunities,
 * Team With Us the program's terms — rendered by the one formatted-text renderer the page's own
 * address uses, so it reads identically in both places and markup in it is never run (R-7.17). A
 * page that cannot be read leaves its section empty, says nothing about why, and the rest of the
 * opportunity is shown in full (R-7.29).
 */

interface Embedded {
  /** The address of the page the screen embeds. */
  readonly slug: string;
  readonly heading: string;
  readonly testId: string;
}

const EMBEDDED: Readonly<Record<OtherProgram, Embedded>> = {
  "sprint-with-us": { slug: "sprint-with-us-opportunity-scope", heading: "Scope", testId: "opportunity-scope" },
  "team-with-us": { slug: "team-with-us-terms-and-conditions", heading: "Terms and conditions", testId: "opportunity-terms" },
};

const TITLES: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "Sprint With Us opportunity",
  "team-with-us": "Team With Us opportunity",
};

type Loaded = { readonly kind: "loading" } | { readonly kind: "missing" } | { readonly kind: "found"; readonly opportunity: OtherProgramOpportunity };

const dollars = (amount: number) => (amount > 0 ? `$${amount.toLocaleString("en-CA")}` : "Not entered");
const areaName = (key: string) => SERVICE_AREAS.find((area) => area.key === key)?.name ?? key;

export function OpportunityOtherViewScreen({ program, opportunityId }: { program: OtherProgram; opportunityId: string }) {
  useScreenTitle(TITLES[program]);
  const session = useSession();
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const ready = session.status !== "starting";
  const viewerId = session.status === "signed-in" ? session.account.id : null;

  // Asked again whoever is signed in, since what the service names depends on who asks.
  useEffect(() => {
    if (!ready) return;
    let current = true;
    setLoaded({ kind: "loading" });
    void fetchOtherProgramOpportunity(program, opportunityId).then((answer) => {
      if (current) setLoaded(answer.kind === "found" ? answer : { kind: "missing" });
    });
    return () => {
      current = false;
    };
  }, [program, opportunityId, ready, viewerId]);

  // Opening the page is one view, however often it is read again while open (R-1.6).
  const counted = useRef(false);
  useEffect(() => {
    if (loaded.kind !== "found" || counted.current) return;
    counted.current = true;
    void countView(program, loaded.opportunity.id);
  }, [loaded, program]);

  if (loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>{TITLES[program]}</Heading>
        <Loading label="Loading opportunity…" />
      </Stack>
    );
  }
  const { opportunity } = loaded;
  const viewer = session.status === "signed-in" ? session.account : null;
  const manages = mayManageOpportunity(viewer, { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null });
  const sprint = program === "sprint-with-us";
  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          {TITLES[program]}
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
          <StatusBadge status={opportunity.status} program={program} />
        </Fact>
        <Fact label="Proposal deadline" testId="opportunity-proposal-deadline">
          {deadlineLabel(opportunity.proposalDeadline)}
        </Fact>
        <Fact label={opportunity.value.term} testId={sprint ? "opportunity-total-max-budget" : "opportunity-max-budget"}>
          {dollars(opportunity.value.amount)}
        </Fact>
        <Fact label="Location">{opportunity.location || "Not entered"}</Fact>
        <Fact label="Remote work">{opportunity.remoteOk ? `Accepted. ${opportunity.remoteDesc}`.trim() : "Not accepted."}</Fact>
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
      {opportunity.successfulProponent ? <SuccessfulProponentSection proponent={opportunity.successfulProponent} /> : null}
      {mayWatch(viewer, { createdBy: opportunity.createdBy?.id ?? null }) ? (
        <WatchControl key={opportunity.id} opportunity={opportunity} program={program} />
      ) : null}
      {viewer?.type === "VENDOR" && isAcceptingProposals(opportunity, new Date()) ? (
        <StartTeamProposal key={`${opportunity.id}-${viewer.id}`} program={program} opportunityId={opportunity.id} vendorId={viewer.id} />
      ) : null}
      {manages ? (
        <div>
          <Link href={`/opportunities/${program}/${opportunity.id}/edit`} isButton buttonVariant="secondary">
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
      {sprint ? (
        <>
          <Stack as="section" gap="medium" aria-labelledby="view-phases" data-testid="opportunity-phases">
            <Heading level={2} id="view-phases">
              Phases
            </Heading>
            <ul>
              {opportunity.phases.map((phase) => (
                <li key={phase.phase}>{`${SWU_PHASE_NAMES[phase.phase]} phase: ${dayLabel(phase.startDate)} to ${dayLabel(phase.completionDate)}`}</li>
              ))}
            </ul>
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
        </>
      ) : (
        <Stack as="section" gap="medium" aria-labelledby="view-resources" data-testid="opportunity-resources">
          <Heading level={2} id="view-resources">
            Resources
          </Heading>
          {opportunity.resources.length > 0 ? (
            <ul>
              {opportunity.resources.map((resource, index) => (
                <li key={index}>{`${areaName(resource.serviceArea)}: ${resource.targetAllocation}% of full time`}</li>
              ))}
            </ul>
          ) : (
            <Text elementType="p">No resources have been named.</Text>
          )}
        </Stack>
      )}
      <Stack as="section" gap="medium" aria-labelledby="view-dates">
        <Heading level={2} id="view-dates">
          Key dates
        </Heading>
        <ul>
          <li data-testid="opportunity-assignment-date">{`Assignment date: ${dayLabel(opportunity.assignmentDate)}`}</li>
          {sprint ? null : (
            <>
              <li data-testid="opportunity-start-date">{`Start date: ${dayLabel(opportunity.startDate)}`}</li>
              {opportunity.completionDate ? (
                <li data-testid="opportunity-completion-date">{`Completion date: ${dayLabel(opportunity.completionDate)}`}</li>
              ) : null}
            </>
          )}
        </ul>
      </Stack>
      <EmbeddedPage embedded={EMBEDDED[program]} />
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
function StartTeamProposal({ program, opportunityId, vendorId }: { program: OtherProgram; opportunityId: string; vendorId: string }) {
  const [held, setHeld] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    void listTeamProposals(program, opportunityId).then((answer) => {
      const mine = answer.kind === "listed" ? answer.proposals.find((proposal) => proposal.createdBy?.id === vendorId) : undefined;
      if (current && mine) setHeld(mine.id);
    });
    return () => {
      current = false;
    };
  }, [program, opportunityId, vendorId]);
  const base = `/opportunities/${program}/${opportunityId}/proposals`;
  return (
    <div>
      <Link href={held ? `${base}/${held}/edit` : `${base}/create`} isButton buttonVariant="primary" data-testid="opportunity-start-proposal">
        {held ? "View your proposal" : "Start a proposal"}
      </Link>
    </div>
  );
}

/**
 * Another page's body, read from its own address and rendered as it is there (R-7.17). While it is
 * being read, and if it cannot be read at all, the section holds nothing and says nothing (R-7.29).
 */
export function EmbeddedPage({ embedded }: { embedded: Embedded }) {
  const [page, setPage] = useState<Page | null>(null);
  useEffect(() => {
    let current = true;
    void fetchPage(embedded.slug).then((answer) => {
      if (current && answer.kind === "found") setPage(answer.page);
    });
    return () => {
      current = false;
    };
  }, [embedded.slug]);
  return (
    <div data-testid={embedded.testId}>
      {page ? (
        <Stack as="section" gap="medium" aria-labelledby={`${embedded.testId}-heading`}>
          <Heading level={2} id={`${embedded.testId}-heading`}>
            {embedded.heading}
          </Heading>
          <FormattedText markup={page.body} testId={`${embedded.testId}-body`} />
        </Stack>
      ) : null}
    </div>
  );
}
