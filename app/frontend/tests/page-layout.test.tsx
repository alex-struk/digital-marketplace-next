import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageContainer, Stack } from "../src/app/page-layout";

/** The page container and the stack, as design/catalogue/layout.tsx defines them (decision record 0037). */
describe("the page container and the stack", () => {
  it("holds a screen in one centred column the width of the banner", () => {
    const { container } = render(
      <PageContainer>
        <p>Content</p>
      </PageContainer>,
    );
    const column = container.firstElementChild as HTMLElement;
    expect(column.style.maxWidth).toBe("calc(1100px + 2 * var(--layout-padding-medium))");
    expect(column.style.marginInline).toBe("auto");
    expect(column.style.paddingInline).toBe("var(--layout-padding-medium)");
    expect(column.style.paddingBlock).toBe("var(--layout-padding-large)");
  });

  it("spaces its items by its gap alone, and a row wraps", () => {
    const { getByTestId } = render(
      <Stack as="ul" direction="row" gap="small" align="end" data-testid="row">
        <li>One</li>
      </Stack>,
    );
    const row = getByTestId("row");
    expect(row.tagName).toBe("UL");
    expect(row.className).toBe("layout-stack");
    expect(row.style.gap).toBe("var(--layout-margin-small)");
    expect(row.style.flexDirection).toBe("row");
    expect(row.style.flexWrap).toBe("wrap");
    expect(row.style.alignItems).toBe("end");
  });

  it("is a column with the medium gap unless told otherwise", () => {
    const { getByTestId } = render(<Stack data-testid="column">x</Stack>);
    const column = getByTestId("column");
    expect(column.style.flexDirection).toBe("column");
    expect(column.style.flexWrap).toBe("nowrap");
    expect(column.style.gap).toBe("var(--layout-margin-medium)");
  });
});
