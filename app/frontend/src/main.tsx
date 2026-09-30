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

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

// Who is using the app is found out once, as it starts, and every screen is told when it is
// known: a sign-in the identity provider has just returned from is completed here.
void startSession();
