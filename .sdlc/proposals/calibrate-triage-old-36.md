---
gate: G3
question: "2 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-1.17, R-8.29 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-30T06:26:44.099Z
---

# 2 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-1.17, R-8.29 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

2 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-1.17 · v2

Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused.

- given: a member of public sector staff adding an evaluation question to an opportunity
- when: they submit a question or guideline outside 1 to 1,000 characters, a score below 1, a word limit outside 1 to 3,000, a position outside 0 to 100, or a minimum score equal to or above the question's score
- then: the submission is rejected and the offending field is named
- test: tests/acceptance/opportunities/R-1.17.spec.ts

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (an empty question is refused on submission, naming the question)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a question over 1,000 characters is refused on submission, naming the question)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (an empty guideline is refused on submission, naming the guideline)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/guideline/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a guideline over 1,000 characters is refused on submission, naming the guideline)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/guideline/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a maximum score below 1 is refused on submission, naming the score)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/score/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a response word limit below 1 is refused on submission, naming the word limit)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/word/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a response word limit above 3,000 is refused on submission, naming the word limit)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/word/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a Sprint With Us minimum score that is not lower than the maximum is refused on submission, naming the minimum score)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/minimum/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a Team With Us minimum score that is not lower than the maximum is refused on submission, naming the minimum score)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/minimum/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

**Each evaluation question on a Sprint With Us or Team With Us opportunity carries a question and a guideline of 1 to 1,000 characters, a maximum score of at least 1, a response word limit of 1 to 3,000, and an optional minimum score that must be lower than the maximum score; its position is set by its place in the opportunity's list of questions, which holds at most 100, and is never entered by the person; a question outside these limits is refused. (a hundred and first question is refused on submission, naming the questions)** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoMatch[2m([22m[32mexpected[39m[2m)[22m

Expected pattern: [32m/question/i[39m
Received string:  [31m""[39m

Call Log:
- Timeout 15000ms exceeded while waiting on the predicate
```

### R-8.29 · v1

An image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed.

- given: an administrator editing a page's body with the image control
- when: they choose an image and it is accepted
- then: the image is inserted into the text as a reference the service resolves for itself, and a reader of the finished page sees the image
- test: tests/acceptance/files/R-8.29.spec.ts

**an image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

## Triage conditions

One condition per line, one for every criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
  On an unbound row it sends the binding back to `bind-adapter` however often it has been sent.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID. On an unbound row, use it when the criterion itself looks suspect.
- `oracle-cannot <ID>: <why>` — only for a row listed as unbound, on the oracle's target: the
  oracle genuinely cannot be driven into, or observed in, the state the test needs without
  changing its code — the state sits behind an external identity provider, is reachable only
  through a link the application emails, or is enforced only by a browser-native dialog.
  `<why>` names that state and why the oracle cannot reach it. It closes the row, changes no
  criterion, and stands until the criterion's version changes. It is never a way to skip binding
  work: where the application offers the control under another label, behind a step or as
  another persona, the answer is `adapter-wrong`.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.

