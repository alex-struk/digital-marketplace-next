---
stage: "ratify"
title: "ratify files"
at: "2026-09-07T08:48:15.948Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify files: 31 accepted, 0 still open, 0 obsolete, 1 replacement(s) added.
Unknown conditions (reported, not applied):
- confirm D-files-1
- confirm D-files-7
- confirm D-files-15
- confirm D-files-23
- defect D-files-5: An upload larger than the service's size limit is refused as the requester's error, with a message naming the limit, and the limit is stated in the interface before a person chooses a file rather than only after they submit it.
- defect D-files-6: A submission carrying no file part, or read-access information that is not well-formed, is refused as a bad request naming what was wrong with it, and is not recorded in the service's error log as a fault of the service; any working copy already written is removed whether the upload succeeds or fails.
- defect D-files-11: An attachment on an opportunity is uploaded with no read access recorded against the file itself, for all three programs alike, so that what the opportunity is attached to decides who may read it.
- defect D-files-12: A file attached to an opportunity or a proposal is readable by whoever may read the thing it is attached to, under one rule covering Code With Us, Sprint With Us and Team With Us alike rather than a separate rule per program.
- defect D-files-19: A profile picture or organization logo is accepted only if its content can be read as a JPEG or a PNG, and a file whose content is neither is refused whatever its name says; an image that reads successfully but cannot be resized is stored at its original size rather than refused.
- defect D-files-22: A file may be attached to an opportunity or a proposal only by someone who is permitted to read that file.