| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-14T00:10:48.247Z |
| holder | agent:reviewer |

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I made the three fixes the ruling asked for in `tests/adapters/old/`, but I couldn't run the typecheck: the command needs an approval this session doesn't have.

I made the three fixes the ruling asked for in `tests/adapters/old/`, but I couldn't run the typecheck: the command needs an approval this session doesn't have. So it's still unconfirmed that the adapter compiles, and the runner's re-run is the real check. Nothing I accepted before was rebound, and I didn't walk the target again.

**1. The upload that leaves out its size is now bound.** The old reason was a limit of the browser and Playwright's request client, not something missing from the service, so I replaced it. `file-upload.upload_file_without_declaring_its_size` now sends its request from the test process using Node's own `http` / `https` module. It builds the same multipart form the other uploads use: the name, who may read the file (an empty list unless the test says otherwise), and the file part. It sends the browser session's cookies with it, and writes the body in chunks with no `Content-Length` header. The reply is stored as the latest answer, so the refusal readers see it like any other upload's reply. If the request can't be sent at all, it throws an "unbound" error naming what went wrong. `bindings.yaml` now lists it as `bound`.

I couldn't try it against the running target. The browser tool runs code in a sandbox with no Node runtime, and a shell request needed approval. So it is written but has never actually been sent. The adapter's comment about why only this upload skips the browser still stands.

**2. The five refusal readers no longer filter the reply.** `refusedForSize`, `sizeLimitNamedInRefusal`, `refusedForFileNameLength` and `refusedForReadAccess` on file-upload now return the latest answer's status and body whenever that answer was a refusal (status 400 or above). They no longer check what the text says. On the real reply "Content-Length is too large.", `sizeLimitNamedInRefusal` now hands that text to the test rather than returning empty. `organization-edit.invalidMembershipTypeError` works the same way: the latest refusal, whole, if the invitation request was refused. Otherwise it returns whatever messages the screen shows, with no filter on those either. `refusedWhenSignedOut` and the file-description readers were not named in the ruling and are unchanged.

**3. Compile risk.** To reduce it, I call the `http` and `https` request functions as two separate branches rather than through one variable that could be either, which TypeScript can reject. I also typed the request options and the response handler with the `node:http` types. Node's types should be available, since the shared fixtures already use `process.env`. I checked the README's separation rules: they ban `expect(`, `test(` and imports from `tests/acceptance/` or `app/` in adapters, and say nothing against Node imports. The adapter still asserts nothing and defines no test.

The typecheck errors the ruling saw are in `tests/acceptance`: parameter names and argument counts to `open()` that don't match the generated types. Those belong to the test writer, and I didn't touch them.

Everything else is as accepted in the last round. All pages' routes still resolve on the target, and I didn't open any page again this time.

_Open, waiting for agent:reviewer_
