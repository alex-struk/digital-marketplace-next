# 0042 · The Code With Us remote work question starts unanswered

- Status: accepted for the build (slice 8, revision after the ruling that returned it)
- Date: 2026-10-02
- Supersedes: 0031 (where the question starts); amends 0041 (its last point, for Code With Us)

## What was wrong

The ruling named R-1.11, in the case where an opportunity does not say whether remote work is
acceptable. Record 0031 started the Code With Us form's "Is remote work acceptable?" question on
**No**, so a form whose question was never answered was published as on-site instead of being
refused. The catalogue's `opportunity-cwu-create` default and administrator stories draw the
question with neither Yes nor No chosen.

## Decision

- The Code With Us create form starts the question with neither answer chosen. The form holds
  no answer (`remote: null` in `CwuFormValues`) until Yes or No is chosen.
- While it holds no answer, the form sends no `remoteOk` at all (`submissionOf` leaves the key
  out). The service already reads a missing answer as unanswered.
- Submitting for review or publishing with the question unanswered is refused before anything is
  sent, by the same rules the service applies, with the existing message
  `Remote work: say whether remote work is acceptable.` in the `field-error` list and on the
  question. The service refuses such a request in the same words if it gets one.
- Saving a draft without an answer is still accepted (R-1.9). The kept schema's `remoteOk` column
  cannot be empty (record 0002), so the draft is stored as not accepting remote work, and the
  manage page's form shows **No** when it is opened again. Only the create form can hold no
  answer.
- The Sprint With Us and Team With Us create forms are unchanged and still start on No (record
  0041). The ruling named only Code With Us, and slice 10 owns those forms' rules.

## What would reverse it

A ruling that a saved draft must open again with the question unanswered. That needs somewhere to
keep "no answer", which the kept schema does not have.
