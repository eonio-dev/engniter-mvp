## Deferred from: code review of 1-1-set-up-initial-project-from-starter-template (2026-05-30T14:59:17.681+02:00)

- Harden email-domain parsing against malformed addresses with multiple `@` characters so allowlist checks cannot be confused by invalid input. Deferred as pre-existing and outside this final review-fix pass.
- Reject backslash-based redirect targets like `/\evil.com` in `getSafeRedirectPath` to close a possible redirect sanitation gap. Deferred as pre-existing and outside this final review-fix pass.
