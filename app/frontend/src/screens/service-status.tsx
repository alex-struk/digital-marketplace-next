import { useEffect, useState } from "react";
import { Heading, Text } from "@bcgov/design-system-react-components";
import { Stack } from "../app/page-layout";
import { useScreenTitle } from "../app/screen-title";

/**
 * `/status` as a browser opens it (scheduled-transition-trigger). The web server hands a browser's
 * page request here and every other request to the service (decision record 0060); the screen then
 * asks the service's own `/status`, which runs the deadline hook in front of it (R-1.1), and says
 * whether the service answered. It shows nothing about what closed, as the story does not.
 */
type Reading = "asking" | "up" | "down";

export function ServiceStatusScreen() {
  useScreenTitle("Service status");
  const [reading, setReading] = useState<Reading>("asking");

  useEffect(() => {
    let current = true;
    void fetch("/status", { headers: { accept: "text/plain" } })
      .then((answer) => (current ? setReading(answer.ok ? "up" : "down") : undefined))
      .catch(() => (current ? setReading("down") : undefined));
    return () => {
      current = false;
    };
  }, []);

  return (
    <Stack gap="large" data-testid="service-status-page">
      <Heading level={1}>Service status</Heading>
      <div role="status">
        {reading === "asking" ? (
          <Text elementType="p">Checking the service…</Text>
        ) : (
          <Text elementType="p" data-testid="service-status-message">
            {reading === "up" ? "The Digital Marketplace is up." : "The Digital Marketplace is not answering."}
          </Text>
        )}
      </div>
    </Stack>
  );
}
