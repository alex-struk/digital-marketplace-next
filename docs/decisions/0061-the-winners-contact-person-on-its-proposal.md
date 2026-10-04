# 0061 · The proponent organization's contact person on its proposal (slice 16, revision)

- Status: accepted for the build (slice 16)
- Date: 2026-10-04

## Context

R-1.27 has an awarded opportunity show its successful proponent's contact details only to whoever
may see the proposal's score. Decision record 0060 put them on the opportunity's page, beside the
winner's name. Staff who manage an opportunity, though, reach the award from the opportunity's
Proposals tab and the proposal's own page, and that page named the organization and nothing about
how to reach it. So someone permitted to see the score could read the award without ever seeing who
to contact.

## Decision

A proposal answer from `GET /api/proposals/{program}/{id}` now carries the organization's contact
person (`contact: { name, email, phone }`, taken from the organization's `contactName`,
`contactEmail` and `contactPhone`). It goes on `proponent.value` for Code With Us and on
`organization` for Sprint With Us and Team With Us, and only to a reader the service already shows
the score to: staff who may read the proposal, and the vendor once the proposal has been awarded or
passed over. Nobody else gets it. Proposal lists leave it out. The proposal tab of the read-only
page and of the manage page shows it as "Contact name", "Contact email" and "Contact phone" in the
organization's section. An individual Code With Us proponent's own email and phone were already
shown there.

The read-only Sprint With Us and Team With Us page also shows the vendor the scores, total and rank
once the proposal has been decided, as Code With Us already did. Before that it shows the vendor no
scores, whatever the answer holds.
