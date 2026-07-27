---
name: commit
description: >
  Write and run git commit messages.
when_to_use: >
  User says "write a commit", "commit message", "generate commit", "/commit",
  or when staging changes / ready to commit.
disable-model-invocation: true
---

## Action

1. Run `git log --oneline --no-decorate -n 20` to learn commit style from last 20 commits
2. Run `git add -A` if nothing is staged
3. Generate commit message based on staged files: follow user-specified rules, or rules from git log, or [Angular Conventional Commits](https://www.conventionalcommits.org/)
4. Run `git commit`

## Boundaries

- Never run `git push`

## Style Priority

1. User-specified rules — first choice
2. Project's `git log` style — fallback
3. [Angular Conventional Commits](https://www.conventionalcommits.org/) — last resort

## Examples (Angular Conventional Commits — fallback only)

```
feat(api): add GET /users/:id/profile

Mobile client needs profile data without full user payload
to reduce bandwidth on cold-launch screens.

Closes #128
```

```
feat(api)!: rename /v1/orders to /v1/checkout

BREAKING CHANGE: clients on /v1/orders must migrate to /v1/checkout
before 2026-06-01. Old route returns 410 after that date.
```
