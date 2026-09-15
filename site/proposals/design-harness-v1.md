| Field | Value |
| --- | --- |
| gate | G-POL |
| opened | 2026-09-15T15:29:41.463Z |
| holder | agent:tech-lead |

# Should the project install the design harness, so every design catalogue is compiled and scanned for accessibility before its gate is ruled?

**Recommendation.** Approve. The harness is what the UX reviewer asked for before it could rule on the users design, and against the current catalogue it compiles all 54 stories with zero accessibility violations.

## What this changes

Installs the design harness from the pipeline template into `design/`: `package.json` and its lockfile, `tsconfig.json`, `.storybook/main.ts`, `.storybook/preview.ts`, and `scan.mjs`. Nothing under `design/catalogue/`, `design/DESIGN.md` or `design/screens.yaml` is touched.

## Why

The UX reviewer escalated `design-users-2` because the design-system packages were not installed, nothing had compiled the catalogue, and no accessibility scan existed. It judged a second return would repeat the same gaps, since they were environmental. This harness is what removes them: Storybook 10 with `@bcgov/design-system-react-components` 0.8.1 and `@bcgov/design-tokens` 5.0.0, a typecheck, and a scan that renders every story in Chromium, runs axe 4.13 over each, and writes `design/report.json` with a digest of the stories it read.

## What was measured before proposing

Against the catalogue on main (54 stories): the typecheck passed with no diagnostics, the Storybook build succeeded, and the scan reported 54 stories rendered, 0 violations, 0 failed to render. All 314 locked packages resolve from registry.npmjs.org.

## What it commits the project to

From pipeline commit 07cdf21 the design stage runs this scan after every design run, and G-DESIGN fails a catalogue that does not compile, a report written for different stories, any violation or unrendered story, and any change to these harness files by a design run (docs/decisions/0009-a-catalogue-is-compiled-and-scanned.md in the pipeline). Storybook telemetry is disabled in `main.ts`; the build output is ignored, and the report is tracked as gate evidence.

_Ruled: approve by tech-lead_
