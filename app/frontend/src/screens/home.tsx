import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { AwardedFigures, fetchAwardedFigures } from "../api/watching";
import { definition, fact, page, row, stack, term } from "../app/layout";
import { Loading } from "../app/loading";
import { useScreenTitle } from "../app/screen-title";

/**
 * The home page, as a visitor who has not signed in sees it.
 *
 * The service's own account of itself, the way in to the opportunity list (Browse opportunities,
 * `/opportunities`), sign-in and sign-up, what has been awarded through it, and the way to each of
 * the three programs. Everything but the awarded figures is drawn at once; the figures come from
 * the service (`/api/metrics`).
 */
type Figures = { readonly kind: "loading" } | { readonly kind: "read"; readonly figures: AwardedFigures | null };

const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const figure = { ...definition, font: "var(--typography-regular-display)" } as const;

export function HomeScreen() {
  useScreenTitle("Digital Marketplace");
  const [figures, setFigures] = useState<Figures>({ kind: "loading" });

  useEffect(() => {
    let current = true;
    void fetchAwardedFigures().then((read) => {
      if (current) setFigures({ kind: "read", figures: read });
    });
    return () => {
      current = false;
    };
  }, []);

  return (
    <div style={page} data-testid="home-page">
      <Heading level={1}>Digital Marketplace</Heading>
      <Text elementType="p" size="large">
        The Digital Marketplace is where the BC Public Service posts procurement
        opportunities for digital work, and where vendors propose to do that work,
        through three programs: Code With Us, Sprint With Us and Team With Us.
      </Text>
      <div style={row}>
        <Link
          href="/opportunities"
          isButton
          buttonVariant="primary"
          data-testid="home-browse-opportunities"
        >
          Browse opportunities
        </Link>
        <Link
          href="/sign-in"
          isButton
          buttonVariant="secondary"
          data-testid="home-sign-in"
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          isButton
          buttonVariant="tertiary"
          data-testid="home-sign-up"
        >
          Sign up
        </Link>
      </div>
      <section aria-labelledby="home-awards-heading" style={stack}>
        <Heading level={2} id="home-awards-heading">
          Awarded through the Digital Marketplace
        </Heading>
        {figures.kind === "loading" ? (
          <Loading label="Loading figures…" />
        ) : figures.figures === null ? (
          <Text elementType="p">The figures could not be loaded. Reload the page to try again.</Text>
        ) : (
          <dl style={facts}>
            <div style={fact}>
              <dt style={term}>Opportunities awarded</dt>
              <dd style={figure} data-testid="home-awarded-count">
                {figures.figures.count.toLocaleString("en-CA")}
              </dd>
            </div>
            <div style={fact}>
              <dt style={term}>Total value awarded</dt>
              <dd style={figure} data-testid="home-awarded-value">
                {`$${figures.figures.value.toLocaleString("en-CA")}`}
              </dd>
            </div>
          </dl>
        )}
      </section>
      <section aria-labelledby="home-programs-heading" style={stack}>
        <Heading level={2} id="home-programs-heading">
          The three programs
        </Heading>
        <ul>
          <li>
            <Link href="/learn-more/code-with-us">Learn about Code With Us</Link>
          </li>
          <li>
            <Link href="/learn-more/sprint-with-us">
              Learn about Sprint With Us
            </Link>
          </li>
          <li>
            <Link href="/learn-more/team-with-us">Learn about Team With Us</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
