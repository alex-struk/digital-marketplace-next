import { ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { statusRow } from "./layout";

/**
 * Something is on its way: an indeterminate progress circle beside the same words as text,
 * in a status region, so it is announced without moving focus (design/DESIGN.md, "Loading").
 */
export function LoadingStatus({ label, text }: { readonly label: string; readonly text: string }) {
  return (
    <div style={statusRow} role="status">
      <ProgressCircle isIndeterminate aria-label={label} />
      <Text>{text}</Text>
    </div>
  );
}
