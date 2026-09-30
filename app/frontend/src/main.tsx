import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "@bcgov/bc-sans/css/BC_Sans.css";
import "@bcgov/design-tokens/css/variables.css";
import "./styles.css";
import { router } from "./router";
import { startSession } from "./auth/session";

const root = document.getElementById("root");
if (!root) throw new Error("The application has nowhere to render.");

// Who is using the app is found out once, as it starts, and every screen is told when it is
// known. What can be known without asking the service is settled before the first screen is
// drawn, so that screen is already the person's own (decision record 0018).
void startSession();

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
