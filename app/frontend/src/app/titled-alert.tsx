import { ReactNode } from "react";
import { InlineAlert } from "@bcgov/design-system-react-components";

/**
 * An `InlineAlert` with both a title and a body. The design system's alert shows its `title`
 * only when it is given no children, so a story that passes both would lose its title; this
 * puts the title in the alert's own title slot ahead of the body, as the profile screen's
 * alerts already do.
 */
export function TitledAlert({
  variant,
  role,
  title,
  children,
}: {
  variant: "info" | "success" | "warning" | "danger";
  role?: "alert" | "status";
  title: string;
  children?: ReactNode;
}) {
  return (
    <InlineAlert variant={variant} role={role}>
      <span className="title" id="alert-title">
        {title}
      </span>
      {children ? <div className="description">{children}</div> : null}
    </InlineAlert>
  );
}
