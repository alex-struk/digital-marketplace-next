import { useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Form,
  Heading,
  NumberField,
  Radio,
  RadioGroup,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";
import { useNavigate } from "@tanstack/react-router";
import { DESCRIPTION_MAX, REMOTE_DESC_MAX, TEASER_MAX, TITLE_MAX } from "@rules/opportunities";
import { OtherProgram, SWU_BUDGET_MAX } from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import { OtherProgramSubmission, createOtherProgramOpportunity } from "../api/other-programs";
import { page, panel, stack } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";
import { StaffOnly } from "../app/staff-only";
import { TitledAlert } from "../app/titled-alert";
import { PublishDialog } from "./opportunity-cwu-form";

/**
 * Create a Sprint With Us or Team With Us opportunity, at `/opportunities/sprint-with-us/create`
 * and `/opportunities/team-with-us/create` (opportunity-swu-create, opportunity-twu-create), as far
 * as slice 8 builds them (decision record 0035).
 *
 * The form holds what every program shares — title, teaser, location, remote work, budget,
 * description and the key dates — and saves it as a draft, which is never checked and whose
 * missing dates the service fills in (R-1.9). The parts that make each program what it is —
 * phases or resources, questions, scoring weights and the evaluation panel — are slice 10's, and
 * without them an opportunity cannot be complete, so submitting for review and publishing are
 * offered as the stories draw them but answered by the service as not yet possible. Once saved,
 * the person is taken to the opportunity's manage page, which shows its identifier. Anybody but
 * public sector staff is shown the missing page (R-1.7).
 */

const WORDS: Readonly<Record<OtherProgram, { title: string; budget: string; budgetRule: string; later: string }>> = {
  "sprint-with-us": {
    title: "Create a Sprint With Us opportunity",
    budget: "Total maximum budget",
    budgetRule: `Between $1 and $${SWU_BUDGET_MAX.toLocaleString("en-CA")}.`,
    later: "Phases, team questions, scoring weights and the evaluation panel cannot be entered here yet",
  },
  "team-with-us": {
    title: "Create a Team With Us opportunity",
    budget: "Maximum budget",
    budgetRule: "At least $1.",
    later: "Resources, resource questions, scoring weights and the evaluation panel cannot be entered here yet",
  },
};

const currency = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 } as const;

export const BLANK_OTHER_FORM: OtherProgramSubmission = {
  title: "",
  teaser: "",
  remoteOk: false,
  remoteDesc: "",
  location: "",
  budget: Number.NaN,
  description: "",
  proposalDeadline: "",
  assignmentDate: "",
  startDate: "",
  completionDate: "",
};

export function OpportunityOtherCreateScreen({ program }: { program: OtherProgram }) {
  const words = WORDS[program];
  useScreenTitle(words.title);
  return <StaffOnly title={words.title}>{(account) => <CreateOther program={program} account={account} />}</StaffOnly>;
}

type Action = "draft" | "submit" | "publish";

function CreateOther({ program, account }: { program: OtherProgram; account: Account }) {
  const navigate = useNavigate();
  const words = WORDS[program];
  const administrator = account.type === "ADMIN";
  const [values, setValues] = useState<OtherProgramSubmission>(BLANK_OTHER_FORM);
  const [failure, setFailure] = useState<readonly string[] | null>(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const failureRef = useRef<HTMLDivElement>(null);
  const change = <K extends keyof OtherProgramSubmission>(field: K, value: OtherProgramSubmission[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  // A refusal takes focus, so it is heard first.
  useEffect(() => {
    if (failure) failureRef.current?.focus();
  }, [failure]);

  async function send(action: Action) {
    if (sending) return;
    setFailure(null);
    setSending(true);
    const answer = await createOtherProgramOpportunity(
      program,
      values,
      action === "draft" ? "DRAFT" : action === "publish" ? "PUBLISHED" : "UNDER_REVIEW",
    );
    setSending(false);
    setConfirming(false);
    if (answer.kind === "saved") {
      const params = { opportunityId: answer.opportunity.id };
      void (program === "sprint-with-us"
        ? navigate({ to: "/opportunities/sprint-with-us/$opportunityId/edit", params })
        : navigate({ to: "/opportunities/team-with-us/$opportunityId/edit", params }));
      return;
    }
    setFailure(answer.kind === "refused" ? answer.reasons : []);
  }

  const dayField = (field: "proposalDeadline" | "assignmentDate" | "startDate" | "completionDate", label: string, description: string, testId: string, isRequired = true) => (
    <TextField
      id={`opp-${field}`}
      type="date"
      label={label}
      isRequired={isRequired}
      description={description}
      value={values[field]}
      onChange={(value) => change(field, value)}
      data-testid={testId}
    />
  );

  return (
    <div style={page}>
      <Heading level={1}>{words.title}</Heading>
      <Text elementType="p">
        {`Required fields are needed to submit for review or publish. A draft can be saved with any of them blank. ${words.later}, so for now the opportunity can only be saved as a draft.`}
      </Text>
      {failure ? (
        <div tabIndex={-1} ref={failureRef}>
          <TitledAlert variant="danger" role="alert" title="The opportunity was not saved">
            <Text elementType="p">
              {failure.length > 0 ? failure.join(" ") : "The service could not save it. Nothing you entered has been lost. Try again."}
            </Text>
          </TitledAlert>
        </div>
      ) : null}
      <Form
        validationBehavior="aria"
        style={stack}
        onSubmit={(event) => {
          event.preventDefault();
          if (administrator) setConfirming(true);
          else void send("submit");
        }}
      >
        <section aria-labelledby="form-overview" style={panel}>
          <Heading level={2} id="form-overview">
            Overview
          </Heading>
          <TextField
            id="opp-title"
            label="Title"
            isRequired
            description={`Up to ${TITLE_MAX} characters.`}
            value={values.title}
            onChange={(value) => change("title", value)}
            data-testid="opportunity-title-field"
          />
          <TextArea
            id="opp-teaser"
            label="Teaser (optional)"
            description={`A sentence or two shown in the opportunity list. Up to ${TEASER_MAX} characters.`}
            value={values.teaser}
            onChange={(value) => change("teaser", value)}
            data-testid="opportunity-teaser-field"
          />
          <TextField
            id="opp-location"
            label="Location"
            isRequired
            value={values.location}
            onChange={(value) => change("location", value)}
            data-testid="opportunity-location-field"
          />
          <RadioGroup
            id="opp-remote"
            label="Is remote work acceptable?"
            isRequired
            value={values.remoteOk ? "yes" : "no"}
            onChange={(value) => change("remoteOk", value === "yes")}
            data-testid="opportunity-remote-field"
          >
            <Radio value="yes">Yes</Radio>
            <Radio value="no">No</Radio>
          </RadioGroup>
          <TextArea
            id="opp-remote-description"
            label="Remote work description"
            isRequired={values.remoteOk}
            description={`Say what remote work involves. Required when remote work is acceptable. Up to ${REMOTE_DESC_MAX} characters.`}
            value={values.remoteDesc}
            onChange={(value) => change("remoteDesc", value)}
            data-testid="opportunity-remote-description-field"
          />
        </section>
        <section aria-labelledby="form-budget" style={panel}>
          <Heading level={2} id="form-budget">
            Budget
          </Heading>
          <NumberField
            id="opp-budget"
            label={words.budget}
            isRequired
            description={words.budgetRule}
            formatOptions={currency}
            value={values.budget}
            onChange={(value) => change("budget", value)}
            data-testid="opportunity-budget-field"
          />
        </section>
        <section aria-labelledby="form-description" style={panel}>
          <Heading level={2} id="form-description">
            Description
          </Heading>
          <TextArea
            id="opp-description"
            label="Description"
            isRequired
            description={`Formatted text, up to ${DESCRIPTION_MAX.toLocaleString("en-CA")} characters.`}
            value={values.description}
            onChange={(value) => change("description", value)}
            data-testid="opportunity-description-field"
          />
        </section>
        <section aria-labelledby="form-dates" style={panel}>
          <Heading level={2} id="form-dates">
            Key dates
          </Heading>
          <Text elementType="p">Each date must fall on or after the one before it.</Text>
          {dayField(
            "proposalDeadline",
            "Proposal deadline",
            "Proposals close at 4:00 p.m. Pacific time on this day. It cannot be before today.",
            "opportunity-deadline-field",
          )}
          {dayField("assignmentDate", "Assignment date", "On or after the proposal deadline.", "opportunity-assignment-date-field")}
          {program === "team-with-us" ? (
            <>
              {dayField("startDate", "Start date", "On or after the assignment date.", "opportunity-start-date-field")}
              {dayField("completionDate", "Completion date (optional)", "On or after the start date.", "opportunity-completion-date-field", false)}
            </>
          ) : null}
        </section>
        <ButtonGroup ariaLabel="Opportunity actions">
          <Button variant="secondary" isDisabled={sending} onPress={() => void send("draft")} data-testid="opportunity-save-draft">
            Save draft
          </Button>
          {administrator ? (
            <Button variant="primary" isDisabled={sending} onPress={() => setConfirming(true)} data-testid="opportunity-publish">
              Publish
            </Button>
          ) : (
            <Button type="submit" variant="primary" isDisabled={sending} data-testid="opportunity-submit-for-review">
              Submit for review
            </Button>
          )}
        </ButtonGroup>
      </Form>
      <PublishDialog
        isOpen={confirming}
        isSending={sending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void send("publish")}
      />
    </div>
  );
}
