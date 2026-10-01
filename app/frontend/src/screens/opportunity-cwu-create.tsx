import { Heading, Text } from "@bcgov/design-system-react-components";
import { useNavigate } from "@tanstack/react-router";
import type { Account } from "../api/accounts";
import { createCwuOpportunity } from "../api/opportunities";
import { page } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";
import { StaffOnly } from "../app/staff-only";
import { BLANK_FORM, CwuOpportunityForm } from "./opportunity-cwu-form";
import { todayInPacific } from "./opportunity-parts";

/**
 * Create a Code With Us opportunity, at `/opportunities/code-with-us/create`
 * (opportunity-cwu-create). A public sector employee saves a draft or submits it for review; an
 * administrator saves a draft or publishes it, after confirming (R-1.22, R-1.48). Once saved, the
 * person is taken to the opportunity's manage page, which shows its identifier. Anybody else is
 * shown the missing page (R-1.7).
 */
export function OpportunityCwuCreateScreen() {
  useScreenTitle("Create a Code With Us opportunity");
  return (
    <StaffOnly title="Create a Code With Us opportunity">{(account) => <CreateCwu account={account} />}</StaffOnly>
  );
}

function CreateCwu({ account }: { account: Account }) {
  const navigate = useNavigate();
  const today = todayInPacific();
  const administrator = account.type === "ADMIN";
  return (
    <div style={page}>
      <Heading level={1}>Create a Code With Us opportunity</Heading>
      <Text elementType="p">
        Required fields are needed to submit for review or publish. A draft can be saved with any of them blank.
      </Text>
      <CwuOpportunityForm
        purpose="create"
        account={account}
        initial={BLANK_FORM}
        isDraft={false}
        today={today}
        earliestDeadline={today}
        headingLevel={2}
        consequence={
          <Text elementType="p">
            {administrator
              ? "Nothing is checked until you publish. You will be asked to confirm before anything is published."
              : "Nothing is checked until you submit for review. An administrator publishes the opportunity after reviewing it."}
          </Text>
        }
        onSend={(action, submission) =>
          createCwuOpportunity(submission, action === "draft" ? "DRAFT" : action === "publish" ? "PUBLISHED" : "UNDER_REVIEW")
        }
        onSaved={(opportunity) =>
          void navigate({ to: "/opportunities/code-with-us/$opportunityId/edit", params: { opportunityId: opportunity.id } })
        }
      />
    </div>
  );
}
