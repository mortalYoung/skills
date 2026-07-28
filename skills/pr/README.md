# PR Skill

Push Commit and Create/Modify PR Automatically.

# Prerequrements

## Token Configuration

Configure tokens in `.claude/settings.local.json` (Claude Code automatically injects them into environment variables):

```json
{
  "env": {
    "GITHUB_TOKEN": "ghp_xxx",
    "GITLAB_TOKEN": "glpat_xxx"
  }
}
```

Alternatively, set them in your shell profile (`~/.zshrc`).

# Expect

- Push commit if needed.
- Update or Create PR if needed.
- Support gitlab and github.
