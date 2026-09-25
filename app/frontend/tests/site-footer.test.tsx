import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FOOTER_PAGES, SiteFooter } from "../src/app/site-footer";
import { LearnMoreScreen } from "../src/screens/learn-more";

describe("the footer every screen carries (R-7.19)", () => {
  it("offers the five pages, each opening its own address", () => {
    render(<SiteFooter />);

    expect(screen.getByTestId("site-footer")).toBeTruthy();
    const expected = [
      ["footer-about-link", "About", "/content/about"],
      ["footer-disclaimer-link", "Disclaimer", "/content/disclaimer"],
      ["footer-privacy-link", "Privacy", "/content/privacy"],
      ["footer-accessibility-link", "Accessibility", "/content/accessibility"],
      ["footer-copyright-link", "Copyright", "/content/copyright"],
    ];
    for (const [testId, label, address] of expected) {
      const link = screen.getByTestId(testId as string);
      expect(link.textContent).toBe(label);
      expect(link.getAttribute("href")).toBe(address);
    }
  });

  it("offers them in the order the service names them", () => {
    expect(FOOTER_PAGES.map((entry) => entry.label)).toEqual([
      "About",
      "Disclaimer",
      "Privacy",
      "Accessibility",
      "Copyright",
    ]);
  });
});

describe("the service level agreement link (R-7.18)", () => {
  it("is offered on each program's learn-more screen and leads to the page", () => {
    for (const program of ["code-with-us", "sprint-with-us", "team-with-us"] as const) {
      const { unmount } = render(<LearnMoreScreen program={program} />);
      const link = screen.getByTestId("service-level-agreement-link");
      expect(link.textContent).toBe("service level agreement");
      expect(link.getAttribute("href")).toBe("/content/service-level-agreement");
      unmount();
    }
  });
});
