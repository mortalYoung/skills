---
name: pr
description: >
  Push commits and create/update PRs automatically. Supports GitHub and GitLab.
when_to_use: >
  User says "create PR", "open PR", "push and PR", "/pr",
  or when ready to open or update a pull request.
disable-model-invocation: true
---

Push commits and create or update PRs.

## Prerequisites

- `Node.js >= 22.6.0` — built-in TypeScript execution via `node --experimental-strip-types`
- `@octokit/rest` — for GitHub PR operations
- `@gitbeaker/rest` — for GitLab MR operations
- `GITHUB_TOKEN` / `GH_TOKEN` and `GITLAB_TOKEN` — see README.md for setup

## Action

All scripts run with `node --experimental-strip-types scripts/<path>` from the project root.

### 1. Detect platform

```
node --experimental-strip-types scripts/detect-platform.ts
```

Output: `github` or `gitlab`. Sets `$PLATFORM` for subsequent steps.

Parses `git remote get-url origin`:

| URL pattern | Platform |
|---|---|
| `github.com/...` | `github` |
| `gitlab.com/...` or `gitlab.` custom domain | `gitlab` |

### 2. Push current branch (if needed)

Check `git log --oneline origin/<branch>..HEAD`. Push when:

- Unpushed commits exist on a branch that already has a remote tracking branch
- User explicitly asks to push

Skip push when:
- Branch is new (no remote tracking branch yet)
- No commits ahead of remote
- User says "without pushing"

Push commands:
```
git push                          # branch has remote tracking
git push -u origin <branch>       # branch is new (but skip new branches per rule above)
```

### 3. Create new PR or update existing PR

First, check for an existing open PR for the current branch:

```
node --experimental-strip-types scripts/<platform>/check-pr.ts
```

Output: `{"found": true, "number": 42, "title": "...", "body": "..."}` or `{"found": false}`

Then:

- **No existing PR found** → create:
  ```
  node --experimental-strip-types scripts/<platform>/create-pr.ts --title "feat: ..." --body "Closes #..."
  node --experimental-strip-types scripts/<platform>/create-pr.ts --title "feat: ..." --body "Closes #..." --draft
  ```

- **Existing open PR found** → update:
  ```
  node --experimental-strip-types scripts/<platform>/update-pr.ts --pr 42 --title "feat: ..." --body "Closes #..."
  ```

## Boundaries

- Does not merge PRs
- Does not approve PRs
- Does not delete branches
- Do NOT use `glab` CLI for MR operations — always use scripts for create/check/update

## Troubleshooting

| Error | Fix |
|---|---|
| `Cannot find package 'xxx'` | Run `bun i` at the project root to install dependencies |
| `GITLAB_TOKEN not set` | Create `skills/pr/.env` with `GITLAB_TOKEN=glpat-xxx` |
| `title is invalid` | Ensure `--title` value is a plain text string (not a JSON object) |
