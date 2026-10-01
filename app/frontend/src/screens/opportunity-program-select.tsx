import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PROGRAM_NAMES, Program } from "@rules/opportunities";
import { page, panel } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";
import { StaffOnly } from "../app/staff-only";

/**
 * Create an opportunity, at `/opportunities/create` (opportunity-program-select). Public sector
 * staff and administrators choose the program the opportunity belongs to, which cannot be changed
 * afterwards (R-1.8); anybody else is shown the missing page (R-1.7).
 */

const PROGRAMS: readonly { slug: Program; description: string; maxBudget: string }[] = [
  {
    slug: "code-with-us",
    description: "One well-defined piece of work, paid as a fixed reward to the developer or team whose proposal is chosen.",
    maxBudget: "Up to $70,000",
  },
  {
    slug: "sprint-with-us",
    description: "A team works in phases on a larger service, chosen through questions, a code challenge and a team scenario.",
    maxBudget: "Up to $5,000,000",
  },
  {
    slug: "team-with-us",
    description: "Specialists join a government team for a set time, chosen through questions and a challenge.",
    maxBudget: "No upper limit",
  },
];

export function OpportunityProgramSelectScreen() {
  useScreenTitle("Create an opportunity");
  return <StaffOnly title="Create an opportunity">{() => <ProgramSelect />}</StaffOnly>;
}

function ProgramSelect() {
  return (
    <div style={page}>
      <Heading level={1}>Create an opportunity</Heading>
      <Text elementType="p">
        Choose the program the opportunity belongs to. The program cannot be changed once the opportunity is created.
      </Text>
      {PROGRAMS.map((program) => (
        <section key={program.slug} aria-labelledby={`program-${program.slug}`} style={panel} data-testid="program-card">
          <Heading level={2} id={`program-${program.slug}`}>
            {PROGRAM_NAMES[program.slug]}
          </Heading>
          <Text elementType="p">{program.description}</Text>
          <Text elementType="p">
            Maximum budget: <span data-testid="program-max-budget">{program.maxBudget}</span>
          </Text>
          <div>
            <Link
              href={`/opportunities/${program.slug}/create`}
              isButton
              buttonVariant="primary"
              data-testid={`program-choose-${program.slug}`}
            >
              {`Create a ${PROGRAM_NAMES[program.slug]} opportunity`}
            </Link>
          </div>
        </section>
      ))}
    </div>
  );
}
