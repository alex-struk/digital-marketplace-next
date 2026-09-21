import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { page, stack } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";

/**
 * The learn-more screen for each of the three programs.
 *
 * Each one offers the service level agreement beside what the program costs. That page is one
 * the service creates for itself, so the link resolves on a fresh installation (R-7.18). The
 * same link, with the same test id, belongs on the program cards and the three opportunity
 * forms when those screens are built.
 */
export const PROGRAMS = {
  "code-with-us": {
    name: "Code With Us",
    what: "Code With Us pays for a single piece of software work, at a fixed price. A public sector team describes what it needs, and any developer or company can propose to build it.",
    who: "Propose on your own, or on behalf of a company. You do not need a registered organization to take part.",
    cost: "Each Code With Us opportunity says what it pays. The amount is fixed before the opportunity is published, and it is paid once the work is accepted.",
  },
  "sprint-with-us": {
    name: "Sprint With Us",
    what: "Sprint With Us pays for an agile team to work in phases on a product. A public sector team describes the product and the phases, and qualified organizations propose a team to do the work.",
    who: "Propose as an organization that has qualified for Sprint With Us. Qualifying means your team covers the capabilities the program asks for and your organization has accepted the program's terms.",
    cost: "Each Sprint With Us opportunity says the most it will pay, in total and for each phase. Proponents propose their own cost within that.",
  },
  "team-with-us": {
    name: "Team With Us",
    what: "Team With Us pays for people to join an existing public sector team for a set period. A public sector team describes the resources it needs, and qualified organizations propose people to fill them.",
    who: "Propose as an organization that has qualified for Team With Us in the service areas the opportunity asks for.",
    cost: "Each Team With Us opportunity says the most it will pay. Proponents propose an hourly rate for each person they put forward.",
  },
} as const;

export type ProgramSlug = keyof typeof PROGRAMS;

export function isProgramSlug(value: string): value is ProgramSlug {
  return Object.prototype.hasOwnProperty.call(PROGRAMS, value);
}

export function LearnMoreScreen({ program }: { readonly program: ProgramSlug }) {
  const details = PROGRAMS[program];
  useScreenTitle(details.name);
  return (
    <div style={page}>
      <Heading level={1}>{details.name}</Heading>
      <section aria-labelledby="learn-more-what-heading" style={stack}>
        <Heading level={2} id="learn-more-what-heading">
          How {details.name} works
        </Heading>
        <Text elementType="p">{details.what}</Text>
        <Text elementType="p">{details.who}</Text>
      </section>
      <section aria-labelledby="learn-more-cost-heading" style={stack}>
        <Heading level={2} id="learn-more-cost-heading">
          What it costs
        </Heading>
        <Text elementType="p">{details.cost}</Text>
        <Text elementType="p">
          What the service commits to, and what it asks of you, is set out in the{" "}
          <Link
            href="/content/service-level-agreement"
            data-testid="service-level-agreement-link"
          >
            service level agreement
          </Link>
          .
        </Text>
      </section>
    </div>
  );
}
