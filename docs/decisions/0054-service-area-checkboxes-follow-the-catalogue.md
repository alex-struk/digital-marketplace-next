# The service-area checkboxes are labelled and valued as the catalogue draws them

The Team With Us qualification tab's service-area form (R-3.28) first valued each checkbox by
the service's key (`FULL_STACK_DEVELOPER`) and labelled it in title case ("Full Stack
Developer"). The catalogue story `organization-edit · service-areas-editing` draws the same
checkboxes with a kebab-case value (`full-stack-developer`) and a sentence-case label ("Full
stack developer").

The form now draws each checkbox the way the story does, and turns ids back into the service's
keys only when it saves. The read-only list of approved areas on the same tab uses the same
sentence-case labels. The reason is only that the screen follows its catalogue page.

This change does not address the acceptance failures of R-3.26 and R-3.28 seen in an earlier
verify. Those came from how the new target's test adapter reads the service-area checkboxes: it
reported every box with its checked state, so every area's name was always present. That reading
belongs to the adapter, not to the application, and has been referred to the stage that binds it.

The API and the stored data still use the service's keys. Other screens that name service areas,
such as the Team With Us opportunity resources, are not changed by this record.
