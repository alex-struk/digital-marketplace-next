# A Code With Us proposal starts with no proponent chosen

The proposal form on `proposal-cwu-create` (and the edit form on `proposal-cwu-edit`) used to
open with "An individual" already selected, as the catalogue stories
`proposal-cwu-create · default` and `· invalid` draw it (`defaultValue="individual"`). That
meant the individual's fields were on the page from the start.

An acceptance run of R-2.13, in the case "when it carries no complete proponent", went to the
create screen, gave only proposal text, submitted, and found the proposal listed as Submitted on
the vendor dashboard. The service and the form both refuse a blank individual, and a unit test
confirms that blank fields cannot be submitted. So the individual's fields must have been filled
in on the screen even though the test never chose a proponent. The contract gives the screen a
`choose_proponent_individual` action next to `choose_proponent_organization`. That action has a
purpose only if the old screen chose nobody until the vendor did. On a screen that already chose
the individual, a test that never chose one still ended up with a complete individual
proponent.

The form now opens with neither radio selected. It shows neither the individual's fields nor
the organization choice until one is picked, and it says what each choice asks for. Submitting
with no choice is refused before the terms are asked for. The refusal is a single problem against
the radio group ("Proponent: choose whether an individual or an organization is submitting this
proposal"), linked to `proposal-proponent-type`, alongside anything wrong with the proposal text
or comments. A draft can still be saved with no choice made. It is stored as a blank individual,
and when it is opened again it reads back as unchosen, so its manage page refuses to submit it
in the same way.

This departs from the catalogue's default state in one respect only: no radio is selected at
first. Every element, label, test id and the layout are as the stories draw them. The stories
should be brought into line by the design stage. That change is not this stage's to make.

The service is unchanged. A request that carries no proponent is still read as a blank
individual and refused against the individual's fields (R-2.14).
