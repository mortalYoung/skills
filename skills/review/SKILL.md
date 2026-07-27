---
name: review
description: >
  Simple code review comments. Short, rough, actionable.
when_to_use: >
  User says "review this PR", "code review", "review the diff", "/review",
  or when reviewing pull requests.
disable-model-invocation: true
---

Terse code review. One line per finding: location, problem, fix.

## Rules

**Format:** `L<line>: <problem>. <fix>.`

**Prefix (optional):** `🔴 bug` — broken / `🟡 risk` — fragile / `🔵 nit` — style / `❓ q` — question

**Drop:** "I noticed", "it seems like", "great work but", hedging, restating what the diff says.

**Keep:** exact line numbers, exact symbols in backticks, concrete fix.

## Examples

| ❌ | ✅ |
|---|---|
| "I noticed on line 42 you're not checking if the user is null before accessing email. This could crash if user is not found." | `L42: 🔴 bug: user can be null after .find(). Add guard before .email.` |
| "This function might benefit from being broken up." | `L88-140: 🔵 nit: 50-line fn does 4 things. Extract validate/normalize/persist.` |

## Boundaries

Reviews only — does not write the code fix, does not approve/request-changes, does not run linters. Output ready to paste.
