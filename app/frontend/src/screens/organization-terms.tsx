import { useEffect, useState } from "react";
import { Button, ButtonGroup, Heading, Text } from "@bcgov/design-system-react-components";
import { QualifyingProgram, offersProgramTermsAcceptance } from "@rules/organizations";
import { Page, fetchPage } from "../api/content";
import { Organization, acceptProgramTerms, fetchOrganization } from "../api/organizations";
import { useSession } from "../auth/session";
import { useGoTo } from "../app/go-to";
import { card } from "../app/layout";
import { Loading, useLoadingShown } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { readMoment } from "../lib/dates";
import { FormattedText } from "../lib/formatted-text/formatted-text";

/**
 * A program's terms for one organization, at `/organizations/:orgId/sprint-with-us-terms-and-conditions`
 * and `…/team-with-us-terms-and-conditions` (organization-swu-terms, organization-twu-terms).
 *
 * The terms are the body of the service's own page at the same address under `/content`, rendered
 * as it is there. The organization's owner is offered Accept while the terms stand unaccepted; once
 * accepted, the page says when, and offers it no more. A service administrator reads the terms but
 * is not offered Accept, because acceptance is the organization's own act (R-3.27). Whoever may not
 * read the organization is shown the missing page, as on its management page (R-3.3).
 */

const TERMS_PAGES: Readonly<Record<QualifyingProgram, { readonly slug: string; readonly tab: string; readonly title: string }>> = {
  "sprint-with-us": {
    slug: "sprint-with-us-terms-and-conditions",
    tab: "swu-qualification",
    title: "Sprint With Us Terms & Conditions",
  },
  "team-with-us": {
    slug: "team-with-us-terms-and-conditions",
    tab: "twu-qualification",
    title: "Team With Us Terms & Conditions",
  },
};

export function OrganizationTermsScreen({ program, orgId }: { program: QualifyingProgram; orgId: string }) {
  const session = useSession();
  const [answer, setAnswer] = useState<Organization | "loading" | "missing" | "failed">("loading");
  const viewer = session.status === "signed-in" ? session.account : null;
  const viewerId = viewer?.id ?? null;
  const settled = session.status !== "starting";
  const title = TERMS_PAGES[program].title;

  useEffect(() => {
    if (!settled || !viewerId) return;
    let current = true;
    setAnswer("loading");
    void fetchOrganization(orgId).then((found) => {
      if (!current) return;
      setAnswer(found.kind === "found" ? found.organization : found.kind);
    });
    return () => {
      current = false;
    };
  }, [orgId, settled, viewerId]);

  const loading = !settled || (viewer !== null && answer === "loading");
  const loadingShown = useLoadingShown(loading);
  if (loading) {
    if (!loadingShown) return null;
    return (
      <Stack gap="large">
        <Heading level={1}>{title}</Heading>
        <Loading label="Loading terms and conditions…" />
      </Stack>
    );
  }
  if (!viewer || answer === "missing" || answer === "loading") return <NotFound />;
  if (answer === "failed") return <Failed title={title} />;
  if (!answer.active) return <NotFound />;
  return <Terms program={program} organization={answer} onChanged={setAnswer} />;
}

function Failed({ title }: { title: string }) {
  useScreenTitle(title);
  return (
    <Stack gap="large">
      <Heading level={1}>{title}</Heading>
      <TitledAlert variant="danger" role="alert" title="The organization could not be loaded">
        <Text elementType="p">Try again in a moment.</Text>
      </TitledAlert>
    </Stack>
  );
}

function Terms({
  program,
  organization,
  onChanged,
}: {
  program: QualifyingProgram;
  organization: Organization;
  onChanged: (organization: Organization) => void;
}) {
  const page = TERMS_PAGES[program];
  useScreenTitle(page.title);
  const goTo = useGoTo();
  const [accepting, setAccepting] = useState(false);
  const [refused, setRefused] = useState<readonly string[] | null>(null);
  const acceptedOn = program === "sprint-with-us" ? organization.acceptedSWUTerms : organization.acceptedTWUTerms;
  const accepted = acceptedOn ? readMoment(acceptedOn) : null;
  const offersAccept = offersProgramTermsAcceptance(organization.viewerMembership, acceptedOn);
  const back = `/organizations/${organization.id}/edit?tab=${page.tab}`;

  async function accept() {
    if (accepting) return;
    setAccepting(true);
    setRefused(null);
    const answer = await acceptProgramTerms(organization.id, program);
    setAccepting(false);
    if (answer.kind === "saved") {
      onChanged(answer.organization);
      goTo(back);
      return;
    }
    setRefused(answer.reasons);
  }

  return (
    <Stack gap="large">
      <Stack gap="small">
        <Text elementType="p" size="small" color="secondary">
          {organization.legalName}
        </Text>
        <Heading level={1}>{page.title}</Heading>
      </Stack>
      {accepted ? (
        <Text elementType="p" data-testid="organization-terms-accepted-on">
          {organization.legalName} accepted these terms on <time dateTime={accepted.dateTime}>{accepted.label}</time>
        </Text>
      ) : offersAccept ? null : (
        <Text elementType="p">
          {organization.legalName} has not accepted these terms.{" "}
          {organization.viewerMembership
            ? "Only the organization’s owner can accept them."
            : "Only the organization’s own people can accept them."}
        </Text>
      )}
      {refused ? (
        <TitledAlert variant="danger" role="alert" title="The terms could not be accepted">
          <Text elementType="p">{refused.join(" ") || "Try again in a moment."}</Text>
        </TitledAlert>
      ) : null}
      <TermsBody slug={page.slug} />
      {offersAccept ? (
        <Stack gap="medium">
          <Text elementType="p">
            By accepting, you agree to these terms on behalf of {organization.legalName}. They are accepted once for the
            organization.
          </Text>
          <ButtonGroup ariaLabel="Terms actions">
            <Button variant="primary" onPress={() => void accept()} data-testid="organization-accept-terms-button">
              Accept terms and conditions
            </Button>
            <Button variant="secondary" onPress={() => goTo(back)} data-testid="organization-terms-cancel">
              Cancel
            </Button>
          </ButtonGroup>
        </Stack>
      ) : (
        <div>
          <Button variant="secondary" onPress={() => goTo(back)} data-testid="organization-terms-cancel">
            Back to the organization
          </Button>
        </div>
      )}
    </Stack>
  );
}

/**
 * The terms themselves: the body of the service's page at the program's terms address, rendered by
 * the one formatted-text renderer (R-7.17). While it is read, or if it cannot be, the panel holds
 * only its heading.
 */
function TermsBody({ slug }: { slug: string }) {
  const [body, setBody] = useState<Page | null>(null);
  useEffect(() => {
    let current = true;
    void fetchPage(slug).then((answer) => {
      if (current && answer.kind === "found") setBody(answer.page);
    });
    return () => {
      current = false;
    };
  }, [slug]);
  return (
    <section aria-labelledby="terms-heading" style={card} data-testid="organization-terms-body">
      <Stack gap="medium">
        <Heading level={2} id="terms-heading">
          Terms and conditions
        </Heading>
        {body ? <FormattedText markup={body.body} /> : null}
      </Stack>
    </section>
  );
}
