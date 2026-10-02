// Renders the realm the sandbox identity provider imports, filling the password placeholder
// from the environment and writing the result into a volume. The password reaches no file in
// this repository (constitution P3).
//
// The client's redirect, web and post-logout origins are filled the same way, from
// APP_ORIGIN: the address the application answers on, which a copy running beside another
// publishes on a port of its own (decision record 0045). Unset, it is today's address.
//
// The placeholders stand inside JSON strings, so each value is escaped the way JSON escapes a
// string's contents before it is put there. Substituting it as plain text would let a
// password holding a quote or a backslash produce a file the identity provider cannot parse —
// and an unparseable realm does not degrade the sandbox, it stops it.
//
// REALM_TEMPLATE and REALM_OUTPUT exist so the renderer can be run outside its container by
// the unit tests; the compose file sets neither.
import { readFileSync, writeFileSync } from "node:fs";

const password = process.env.SDLC_SANDBOX_PASSWORD;
const appOrigin = (process.env.APP_ORIGIN?.trim() || "http://localhost:4300").replace(/\/+$/, "");
const templatePath = process.env.REALM_TEMPLATE || "/template/realm.json";
const outputPath = process.env.REALM_OUTPUT || "/import/realm.json";

if (!password) {
  console.error(
    "SDLC_SANDBOX_PASSWORD is not set, so the sandbox identity provider has no accounts to offer.",
  );
  process.exit(1);
}

// JSON.stringify quotes and escapes; the slice drops the quotes, leaving the escaped body to
// sit inside the quotes the template already has.
const escape = (value) => JSON.stringify(value).slice(1, -1);

const template = readFileSync(templatePath, "utf8");
const rendered = template
  .split("__SANDBOX_PASSWORD__")
  .join(escape(password))
  .split("__APP_ORIGIN__")
  .join(escape(appOrigin));

// Parsed here rather than discovered by the identity provider on start-up, so a realm that
// cannot be read fails this one-shot service with a plain message instead of sending the
// identity provider into a restart loop.
JSON.parse(rendered);

writeFileSync(outputPath, rendered);
console.log("Rendered the sandbox realm for import.");
