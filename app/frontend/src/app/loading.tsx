import { ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { statusRow } from "./layout";

/**
 * Something is on its way: an indeterminate progress circle and the same words as visible
 * text, in a status region, with focus left where it is (design/DESIGN.md, "Loading").
 */
export function Loading({ label }: { label: string }) {
  return (
    <div style={statusRow} role="status">
      <ProgressCircle isIndeterminate aria-label={label} />
      <Text>{label}</Text>
    </div>
  );
}
