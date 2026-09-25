// Renders the realm the sandbox identity provider imports, filling the password placeholder
// from the environment and writing the result into a volume. The password reaches no file in
// this repository (constitution P3).
//
// The placeholder stands inside a JSON string, so the password is escaped the way JSON
// escapes a string's contents before it is put there. Substituting it as plain text would
// let a password holding a quote or a backslash produce a file the identity provider cannot
// parse — and an unparseable realm does not degrade the sandbox, it stops it.
import { readFileSync, writeFileSync } from "node:fs";

const password = process.env.SDLC_SANDBOX_PASSWORD;

if (!password) {
  console.error(
    "SDLC_SANDBOX_PASSWORD is not set, so the sandbox identity provider has no accounts to offer.",
  );
  process.exit(1);
}

const template = readFileSync("/template/realm.json", "utf8");
// JSON.stringify quotes and escapes; the slice drops the quotes, leaving the escaped body to
// sit inside the quotes the template already has.
const escaped = JSON.stringify(password).slice(1, -1);
const rendered = template.split("__SANDBOX_PASSWORD__").join(escaped);

// Parsed here rather than discovered by the identity provider on start-up, so a realm that
// cannot be read fails this one-shot service with a plain message instead of sending the
// identity provider into a restart loop.
JSON.parse(rendered);

writeFileSync("/import/realm.json", rendered);
console.log("Rendered the sandbox realm for import.");
