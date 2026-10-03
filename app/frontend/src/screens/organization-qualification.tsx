import { useState } from "react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Heading,
  InlineAlert,
  Link,
  Text,
} from "@bcgov/design-system-react-components";
import { mayQualifyServiceAreas, offersProgramTermsAcceptance } from "@rules/organizations";
import { SERVICE_AREAS } from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import { Organization, qualifyServiceAreas } from "../api/organizations";
import { badge } from "../app/layout";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";
import { readMoment } from "../lib/dates";

/**
 * The management page's two qualification tabs (organization-edit, slice 13): each program's
 * requirements with whether each is met, the terms and when they were accepted, and — on the Team
 * With Us tab — the approved service areas, which a service administrator alone may change
 * (R-3.25–R-3.28). What is met is the service's answer, read from the organization's record, so the
 * tab and the qualified marks never disagree.
 */

/**
 * How this screen labels and values each service area, as the catalogue story draws them
 * (organization-edit · service-areas-editing): a sentence-case label, and a kebab-case id as the
 * checkbox value. The service speaks in its own keys; the form translates at its edge.
 */
const SENTENCE_CASE: Record<string, string> = {
  FULL_STACK_DEVELOPER: "Full stack developer",
  DATA_PROFESSIONAL: "Data professional",
  AGILE_COACH: "Agile coach",
  DEVOPS_SPECIALIST: "DevOps specialist",
  SERVICE_DESIGNER: "Service designer",
};
const SERVICE_AREA_CHOICES = SERVICE_AREAS.map((area) => ({
  key: area.key as string,
  id: area.key.toLowerCase().replace(/_/g, "-"),
  label: SENTENCE_CASE[area.key] ?? area.name,
}));

const areaName = (key: string) => SERVICE_AREA_CHOICES.find((area) => area.key === key)?.label ?? key;
const areaId = (key: string) => SERVICE_AREA_CHOICES.find((area) => area.key === key)?.id ?? key;
const areaKey = (id: string) => SERVICE_AREA_CHOICES.find((area) => area.id === id)?.key ?? id;

function Requirement({ met, testId, children }: { met: boolean; testId: string; children: string }) {
  return (
    <li data-testid={testId}>
      <Stack direction="row" align="center" gap="small">
        <span style={badge}>{met ? "Met" : "Not met"}</span> {children}
      </Stack>
    </li>
  );
}

function NotQualified({ program }: { program: string }) {
  return (
    <div data-testid="organization-not-qualified-notice">
      <InlineAlert
        variant="info"
        title={`This organization is not qualified for ${program}`}
        description={`It can propose on ${program} opportunities once every requirement below is met.`}
      />
    </div>
  );
}

/**
 * The terms section: when they were accepted, or that they have not been, and the link to the
 * terms page. The link offers to accept only to the person the terms page offers Accept to.
 */
function TermsSection({
  organization,
  program,
  slug,
  acceptedOn,
  testIdPrefix,
}: {
  organization: Organization;
  program: string;
  slug: string;
  acceptedOn: string | null;
  testIdPrefix: "swu" | "twu";
}) {
  const accepted = acceptedOn ? readMoment(acceptedOn) : null;
  const offersAccept = offersProgramTermsAcceptance(organization.viewerMembership, acceptedOn);
  return (
    <Stack as="section" aria-labelledby="terms-heading" gap="medium">
      <Heading level={3} id="terms-heading">
        Terms and conditions
      </Heading>
      {accepted ? (
        <Text elementType="p" data-testid={`organization-${testIdPrefix}-terms-accepted-on`}>
          Accepted on <time dateTime={accepted.dateTime}>{accepted.label}</time>
        </Text>
      ) : (
        <Text elementType="p">The {program} terms and conditions have not been accepted for this organization.</Text>
      )}
      <Text elementType="p">
        <Link href={`/organizations/${organization.id}/${slug}`} data-testid={`organization-view-${testIdPrefix}-terms-link`}>
          {offersAccept ? `Read and accept the ${program} terms and conditions` : `Read the ${program} terms and conditions`}
        </Link>
      </Text>
    </Stack>
  );
}

export function SwuQualificationTab({ organization }: { organization: Organization }) {
  const met = organization.swuRequirements;
  return (
    <Stack as="section" aria-labelledby="tab-heading" gap="medium">
      <Heading level={2} id="tab-heading">
        Sprint With Us qualification
      </Heading>
      {organization.swuQualified ? (
        <Text elementType="p">This organization is qualified to propose on Sprint With Us opportunities.</Text>
      ) : (
        <NotQualified program="Sprint With Us" />
      )}
      <Stack as="ul" gap="small" aria-label="Sprint With Us requirements">
        <Requirement met={met.twoMembers} testId="organization-swu-requirement-two-members">
          At least two active team members
        </Requirement>
        <Requirement met={met.allCapabilities} testId="organization-swu-requirement-all-capabilities">
          Active team members between them hold every capability
        </Requirement>
        <Requirement met={met.termsAccepted} testId="organization-swu-requirement-terms-accepted">
          Sprint With Us terms and conditions accepted
        </Requirement>
      </Stack>
      {organization.swuQualified ? null : (
        <Text elementType="p">Invited people who have not yet accepted do not count towards team size or capabilities.</Text>
      )}
      <TermsSection
        organization={organization}
        program="Sprint With Us"
        slug="sprint-with-us-terms-and-conditions"
        acceptedOn={organization.acceptedSWUTerms}
        testIdPrefix="swu"
      />
    </Stack>
  );
}

export function TwuQualificationTab({
  viewer,
  organization,
  onChanged,
}: {
  viewer: Account;
  organization: Organization;
  onChanged: (organization: Organization) => void;
}) {
  const [editing, setEditing] = useState(false);
  const mayEdit = mayQualifyServiceAreas(viewer);

  if (editing && mayEdit) {
    return (
      <Stack as="section" aria-labelledby="tab-heading" gap="medium">
        <Heading level={2} id="tab-heading">
          Team With Us qualification
        </Heading>
        <ServiceAreasForm
          organization={organization}
          onSaved={(saved) => {
            onChanged(saved);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </Stack>
    );
  }

  return (
    <Stack as="section" aria-labelledby="tab-heading" gap="medium">
      <Heading level={2} id="tab-heading">
        Team With Us qualification
      </Heading>
      {organization.twuQualified ? (
        <Text elementType="p">This organization is qualified to propose on Team With Us opportunities.</Text>
      ) : (
        <NotQualified program="Team With Us" />
      )}
      <Stack as="ul" gap="small" aria-label="Team With Us requirements">
        <Requirement met={organization.serviceAreas.length > 0} testId="organization-twu-requirement-service-area">
          Approved for at least one service area
        </Requirement>
        <Requirement met={Boolean(organization.acceptedTWUTerms)} testId="organization-twu-requirement-terms-accepted">
          Team With Us terms and conditions accepted
        </Requirement>
      </Stack>
      <Stack as="section" aria-labelledby="areas-heading" gap="medium">
        <Heading level={3} id="areas-heading">
          Approved service areas
        </Heading>
        {mayEdit ? null : (
          <Text elementType="p">Only an administrator can change which service areas an organization is approved for.</Text>
        )}
        {organization.serviceAreas.length > 0 ? (
          <ul>
            {organization.serviceAreas.map((area) => (
              <li key={area} data-testid="organization-service-area">
                {areaName(area)}
              </li>
            ))}
          </ul>
        ) : (
          <Text elementType="p">This organization is not approved for any service area.</Text>
        )}
        {mayEdit ? (
          <div>
            <Button variant="secondary" onPress={() => setEditing(true)} data-testid="organization-edit-service-areas-button">
              Edit service areas
            </Button>
          </div>
        ) : null}
      </Stack>
      <TermsSection
        organization={organization}
        program="Team With Us"
        slug="team-with-us-terms-and-conditions"
        acceptedOn={organization.acceptedTWUTerms}
        testIdPrefix="twu"
      />
    </Stack>
  );
}

/**
 * The administrator's service-area approvals: every recognised area as a checkbox, starting from
 * the current approvals. Saving replaces them with exactly what is ticked (R-3.28).
 */
function ServiceAreasForm({
  organization,
  onSaved,
  onCancel,
}: {
  organization: Organization;
  onSaved: (organization: Organization) => void;
  onCancel: () => void;
}) {
  const [ticked, setTicked] = useState<string[]>(organization.serviceAreas.map(areaId));
  const [saving, setSaving] = useState(false);
  const [refused, setRefused] = useState<readonly string[] | null>(null);

  async function save() {
    if (saving) return;
    setSaving(true);
    setRefused(null);
    const answer = await qualifyServiceAreas(organization.id, ticked.map(areaKey));
    setSaving(false);
    if (answer.kind === "saved") onSaved(answer.organization);
    else setRefused(answer.reasons);
  }

  return (
    <Stack as="section" aria-labelledby="areas-heading" gap="medium">
      <Heading level={3} id="areas-heading">
        Approved service areas
      </Heading>
      <Text elementType="p">Saving replaces this organization’s approvals with exactly the areas ticked.</Text>
      {refused ? (
        <TitledAlert variant="danger" role="alert" title="The service areas could not be saved">
          <Text elementType="p">{refused.join(" ") || "Try again in a moment."}</Text>
        </TitledAlert>
      ) : null}
      <CheckboxGroup label="Service areas this organization is approved for" value={ticked} onChange={setTicked}>
        {SERVICE_AREA_CHOICES.map((area) => (
          <Checkbox key={area.id} value={area.id} data-testid="organization-service-area-checkbox">
            {area.label}
          </Checkbox>
        ))}
      </CheckboxGroup>
      <ButtonGroup ariaLabel="Service area actions">
        <Button variant="primary" onPress={() => void save()} data-testid="organization-save-service-areas-button">
          Save service areas
        </Button>
        <Button variant="secondary" onPress={onCancel} data-testid="organization-cancel-service-areas-button">
          Cancel
        </Button>
      </ButtonGroup>
    </Stack>
  );
}
