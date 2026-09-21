import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormattedText } from "../src/lib/formatted-text/formatted-text";
import { parseFormattedText, readHref } from "../src/lib/formatted-text/parse";

describe("markup in a body is never executed (R-7.17)", () => {
  it("shows a script as the text it is", () => {
    const { container } = render(
      <FormattedText markup={'Before <script>window.taken = true;</script> after.'} />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>window.taken = true;</script>");
  });

  it("shows an element written in a body as the text it is", () => {
    const { container } = render(
      <FormattedText markup={"<b>not bold</b> and <img src=x onerror=alert(1)>"} />,
    );

    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<b>not bold</b>");
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("will not make a link out of an address that runs something", () => {
    expect(readHref("javascript:alert(1)")).toBeNull();
    expect(readHref("data:text/html;base64,PHNjcmlwdD4=")).toBeNull();
    expect(readHref("//elsewhere.example/thing")).toBeNull();
    expect(readHref("https://example.test/thing")).toBe("https://example.test/thing");
    expect(readHref("/content/privacy")).toBe("/content/privacy");
    expect(readHref("mailto:someone@example.test")).toBe("mailto:someone@example.test");
  });

  it("keeps the words of a link it will not follow", () => {
    const { container } = render(
      <FormattedText markup={"[Press here](javascript:alert(1))"} />,
    );

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("Press here");
  });
});

describe("a body as formatted text (R-7.1)", () => {
  it("renders the marks the editor writes", () => {
    const { container } = render(
      <FormattedText
        markup={[
          "# How we handle your information",
          "",
          "We keep **very little** and share *none* of it.",
          "",
          "- The first thing",
          "- The second thing",
          "",
          "1. Step one",
          "2. Step two",
        ].join("\n")}
      />,
    );

    // A body's own headings start at H2, under the page's H1, so the outline holds.
    expect(container.querySelector("h1")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "How we handle your information", level: 2 }),
    ).toBeTruthy();
    expect(container.querySelector("strong")?.textContent).toBe("very little");
    expect(container.querySelector("em")?.textContent).toBe("none");
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  it("puts a body's headings under the page's title, with no gap in the outline", () => {
    // Whether an author writes "#" or "##" for their top heading, it becomes H2 under the
    // page's H1, and what sits under it goes down one level at a time.
    const written = render(
      <FormattedText markup={"## Top\n\n### Under it\n\nWords."} />,
    );
    expect(written.container.querySelector("h2")?.textContent).toBe("Top");
    expect(written.container.querySelector("h3")?.textContent).toBe("Under it");
    expect(written.container.querySelector("h1")).toBeNull();
    written.unmount();

    const shallower = render(<FormattedText markup={"# Top\n\n## Under it"} />);
    expect(shallower.container.querySelector("h2")?.textContent).toBe("Top");
    expect(shallower.container.querySelector("h3")?.textContent).toBe("Under it");
  });

  it("marks every link it renders, so a test can follow one", () => {
    render(
      <FormattedText
        markup={"Raise it through the [accessibility page](/content/accessibility)."}
      />,
    );

    const link = screen.getByTestId("content-body-link");
    expect(link.getAttribute("href")).toBe("/content/accessibility");
    expect(link.textContent).toBe("accessibility page");
  });

  it("gives an image with no description an empty one", () => {
    const { container } = render(
      <FormattedText markup={"![](/api/files/00000000-0000-4000-8000-000000000001)"} />,
    );
    const image = container.querySelector("img");

    expect(image?.getAttribute("alt")).toBe("");
    expect(image?.getAttribute("src")).toBe(
      "/api/files/00000000-0000-4000-8000-000000000001",
    );
  });

  it("reads one body the same way every time it is asked", () => {
    // The same renderer runs on a page's own address and wherever a screen embeds the body,
    // so one body can only have one reading (R-7.17).
    const markup = "A paragraph with `code` and a <span>tag</span>.";
    expect(parseFormattedText(markup)).toEqual(parseFormattedText(markup));
  });
});
