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

## Action

All scripts run with `node --experimental-strip-types scripts/<path>` from the project root.

### 1. Detect platform

```bash
node --experimental-strip-types scripts/detect-platform.ts
```

Output: `github` or `gitlab`.

### 2. Push current branch (if needed)

Check `git log --oneline origin/<branch>..HEAD`. Push when:

- Unpushed commits exist on a branch that already has a remote tracking branch
- User explicitly asks to push

Skip push when:
- Branch is new (no remote tracking branch yet)
- No commits ahead of remote
- User says "without pushing"

Push commands:
```bash
git push                          # branch has remote tracking
```

### 3. Create new PR or update existing PR

First, check for an existing open PR for the current branch:

```bash
node --experimental-strip-types scripts/<platform>/check-pr.ts
```

Output: `{"found": true, "number": 42, "title": "...", "body": "..."}` or `{"found": false}`

Then:

- **No existing PR found** → create:
```bash
node --experimental-strip-types scripts/<platform>/create-pr.ts --title "feat: ..." --body "Closes #..."
node --experimental-strip-types scripts/<platform>/create-pr.ts --title "feat: ..." --body "Closes #..." --draft
```

- **Existing open PR found** → update:
```bash
node --experimental-strip-types scripts/<platform>/update-pr.ts --pr 42 --title "feat: ..." --body "Closes #..."
```

### 4. PR body template

When generating the `--body` content, use the following structure:

```markdown
## Summary

<What does this PR do and why?>

## Changes

- <Change one>
- <Change two>
- ...
```

At minimum, always include **Summary** and **Changes** sections. Add optional sections (Breaking Changes, Screenshots, etc.) when relevant.

## Boundaries

- Does not merge PRs
- Does not approve PRs
- Does not delete branches
- Do NOT use `glab` CLI for MR operations — always use scripts for create/check/update

## Troubleshooting

| Error | Fix |
|---|---|
| `Cannot find package 'xxx'` | Run `bun i` at the skill root to install dependencies |
| `GITLAB_TOKEN not set` | Create `skills/pr/.env` with `GITLAB_TOKEN=glpat-xxx` |
| `title is invalid` | Ensure `--title` value is a plain text string (not a JSON object) |
| `detect-platform` 输出 `github` 或 MR 创建失败返回 GitHub HTML 错误页（404 "Oh no") | 脚本必须在**项目仓库根目录**运行。脚本里的 `git remote get-url origin` / `git rev-parse` 从 cwd 向上解析 git 仓库——在 skill 目录（如 `~/.claude/skills/pr`）跑会解析到错误仓库（如 `.claude` dotfiles 仓库，origin 指向 GitHub），导致 host 误判、GitLab API 打到 GitHub。用绝对路径调脚本：`node --experimental-strip-types ~/.claude/skills/pr/scripts/gitlab/create-pr.ts ...` |
