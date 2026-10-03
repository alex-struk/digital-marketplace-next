import { useEffect, useState } from "react";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { useNavigate } from "@tanstack/react-router";
import type { OtherProgram } from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import { PanelCandidate, createOtherProgramOpportunity, fetchPanelCandidates } from "../api/other-programs";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";
import { StaffOnly } from "../app/staff-only";
import { OtherProgramForm, blankOtherForm } from "./opportunity-other-form";
import { todayInPacific } from "./opportunity-parts";

/**
 * Create a Sprint With Us or Team With Us opportunity, at `/opportunities/sprint-with-us/create`
 * and `/opportunities/team-with-us/create` (opportunity-swu-create, opportunity-twu-create). The
 * program is the address's, and the opportunity keeps it for good (R-1.8).
 *
 * Save draft keeps whatever the form holds and the service fills in a draft's missing dates
 * (R-1.9). Submit for review — or, for an administrator, Publish after the confirmation (R-1.48) —
 * checks the whole opportunity and its panel against the program's rules first, and the service
 * checks it again. Once saved, the person is taken to the opportunity's manage page, which shows
 * its identifier. Anybody but public sector staff is shown the missing page (R-1.7).
 */

const TITLES: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "Create a Sprint With Us opportunity",
  "team-with-us": "Create a Team With Us opportunity",
};

export function OpportunityOtherCreateScreen({ program }: { program: OtherProgram }) {
  useScreenTitle(TITLES[program]);
  return <StaffOnly title={TITLES[program]}>{(account) => <CreateOther program={program} account={account} />}</StaffOnly>;
}

/**
 * Who may be named on the panel: every active public sector employee and administrator, as the
 * service names them to staff; the person themselves until that is read.
 */
export function usePanelCandidates(account: Pick<Account, "id" | "name">): readonly PanelCandidate[] {
  const { id, name } = account;
  const [candidates, setCandidates] = useState<readonly PanelCandidate[]>([{ id, label: name }]);
  useEffect(() => {
    let current = true;
    void fetchPanelCandidates().then((found) => {
      if (current && found.length > 0) setCandidates(found.some((candidate) => candidate.id === id) ? found : [{ id, label: name }, ...found]);
    });
    return () => {
      current = false;
    };
  }, [id, name]);
  return candidates;
}

function CreateOther({ program, account }: { program: OtherProgram; account: Account }) {
  const navigate = useNavigate();
  const candidates = usePanelCandidates(account);
  const administrator = account.type === "ADMIN";
  return (
    <Stack gap="large">
      <Heading level={1}>{TITLES[program]}</Heading>
      <Text elementType="p">Required fields are needed to submit for review or publish. A draft can be saved with any of them blank.</Text>
      <OtherProgramForm
        program={program}
        purpose="create"
        account={account}
        initial={blankOtherForm(program)}
        isDraft={false}
        earliestDeadline={todayInPacific()}
        headingLevel={2}
        candidates={candidates}
        consequence={
          <Text elementType="p">
            {administrator
              ? "Nothing is checked until you publish. You will be asked to confirm before anything is published."
              : "Nothing is checked until you submit for review. An administrator publishes the opportunity after reviewing it."}
          </Text>
        }
        onSend={(action, submission) =>
          createOtherProgramOpportunity(program, submission, action === "draft" ? "DRAFT" : action === "publish" ? "PUBLISHED" : "UNDER_REVIEW")
        }
        onSaved={(saved) => {
          const params = { opportunityId: saved.id };
          void (program === "sprint-with-us"
            ? navigate({ to: "/opportunities/sprint-with-us/$opportunityId/edit", params })
            : navigate({ to: "/opportunities/team-with-us/$opportunityId/edit", params }));
        }}
      />
    </Stack>
  );
}
