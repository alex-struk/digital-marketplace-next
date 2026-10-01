import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { mayManageOpportunity } from "@rules/opportunities";
import { CwuOpportunity, fetchCwuOpportunity } from "../api/opportunities";
import { AttachmentList } from "../app/attachments";
import { facts, page, stack, tight } from "../app/layout";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { useScreenTitle } from "../app/screen-title";
import { useSession } from "../auth/session";
import { FormattedText } from "../lib/formatted-text/formatted-text";
import { Fact, StatusBadge, dayLabel, deadlineLabel, publishedLabel, rewardLabel } from "./opportunity-parts";

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

  if (loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "loading") {
    return (
      <div style={page}>
        <Heading level={1}>Code With Us opportunity</Heading>
        <Loading label="Loading opportunity…" />
      </div>
    );
  }
  const { opportunity } = loaded;
  const viewer = session.status === "signed-in" ? session.account : null;
  const manages = mayManageOpportunity(viewer, { status: opportunity.status, createdBy: opportunity.createdBy?.id ?? null });
  return (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">
        Code With Us opportunity
      </Text>
      <Heading level={1}>{opportunity.title || "Untitled opportunity"}</Heading>
      {opportunity.teaser ? (
        <Text elementType="p" size="large">
          {opportunity.teaser}
        </Text>
      ) : null}
      <dl style={facts}>
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
      </dl>
      <Text elementType="p" size="small" color="secondary">
        Opportunity ID: <span data-testid="opportunity-identifier">{opportunity.id}</span>
      </Text>
      {manages ? (
        <div>
          <Link href={`/opportunities/code-with-us/${opportunity.id}/edit`} isButton buttonVariant="secondary">
            Manage this opportunity
          </Link>
        </div>
      ) : null}
      <section aria-labelledby="view-description" style={stack}>
        <Heading level={2} id="view-description">
          Description
        </Heading>
        <FormattedText markup={opportunity.description} />
        <AttachmentList attachments={opportunity.attachments} />
      </section>
      <section aria-labelledby="view-skills" style={stack}>
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
      </section>
      <section aria-labelledby="view-dates" style={stack}>
        <Heading level={2} id="view-dates">
          Key dates
        </Heading>
        <ul>
          <li>{`Assignment date: ${dayLabel(opportunity.assignmentDate)}`}</li>
          <li>{`Start date: ${dayLabel(opportunity.startDate)}`}</li>
          {opportunity.completionDate ? <li>{`Completion date: ${dayLabel(opportunity.completionDate)}`}</li> : null}
        </ul>
      </section>
      <section aria-labelledby="view-addenda" style={tight} data-testid="opportunity-addenda">
        <Heading level={2} id="view-addenda">
          Addenda
        </Heading>
        <Text elementType="p">No addenda have been added.</Text>
      </section>
    </div>
  );
}
