import { describe, expect, it } from "vitest";
import { applyFormatting, insertImageReference } from "../src/lib/formatted-text/editing";
import { parseFormattedText, parseInline } from "../src/lib/formatted-text/parse";

describe("the body editor's formatting buttons (R-7.26)", () => {
  it("wraps the selected words in bold or italic marks, keeping them selected", () => {
    const bold = applyFormatting("Read the rules first.", 9, 14, "bold");
    expect(bold.value).toBe("Read the **rules** first.");
    expect(bold.value.slice(bold.selectionStart, bold.selectionEnd)).toBe("rules");

    expect(applyFormatting("Read the rules.", 9, 14, "italic").value).toBe("Read the _rules_.");
  });

  it("inserts a placeholder at the cursor when nothing is selected, selected for typing over", () => {
    const edit = applyFormatting("Start ", 6, 6, "bold");
    expect(edit.value).toBe("Start **bold text**");
    expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe("bold text");
  });

  it("turns the lines the selection touches into a heading or a list", () => {
    expect(applyFormatting("One\nTwo\nThree", 0, 0, "heading").value).toBe("## One\nTwo\nThree");
    expect(applyFormatting("One\nTwo\nThree", 1, 6, "bulleted").value).toBe("- One\n- Two\nThree");
    expect(applyFormatting("One\nTwo", 0, 7, "numbered").value).toBe("1. One\n2. Two");
  });

  it("makes a link of the selection with its address selected", () => {
    const edit = applyFormatting("See the guide.", 8, 13, "link");
    expect(edit.value).toBe("See the [guide](https://).");
    expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe("https://");
  });

  it("writes only marks the renderer reads", () => {
    const body = ["bold", "italic", "heading", "bulleted", "numbered"].reduce(
      (text, kind) => applyFormatting(text, 0, text.length, kind as never).value,
      "Words",
    );
    expect(parseFormattedText(body).length).toBeGreaterThan(0);
    expect(parseInline(applyFormatting("x", 0, 1, "bold").value)[0]?.kind).toBe("strong");
  });
});

describe("an image's reference placed at the cursor (R-8.29)", () => {
  const reference = "![Describe this image](@file/5b2e0c3a-8d41-4f6e-a1c2-000000000806)";

  it("goes on a block of its own with its description selected", () => {
    const edit = insertImageReference("Before.After.", 7, 7, reference, "Describe this image");
    expect(edit.value).toBe(`Before.\n\n${reference}\n\nAfter.`);
    expect(edit.value.slice(edit.selectionStart, edit.selectionEnd)).toBe("Describe this image");
  });

  it("adds no blank lines where the body already has them", () => {
    expect(insertImageReference("", 0, 0, reference, "Describe this image").value).toBe(reference);
    expect(insertImageReference("Intro.\n\n", 8, 8, reference, "Describe this image").value).toBe(
      `Intro.\n\n${reference}`,
    );
  });

  it("is turned into the file's address only when displayed, and never stored as one", () => {
    expect(reference).not.toContain("/api/");
    expect(parseInline(reference)).toEqual([
      {
        kind: "image",
        src: "/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000806?type=blob",
        alt: "Describe this image",
      },
    ]);
  });

  it("leaves a marker that names no file as an ordinary address", () => {
    expect(parseInline("![map](@file/harbour-map)")).toEqual([
      { kind: "image", src: "@file/harbour-map", alt: "map" },
    ]);
  });
});
