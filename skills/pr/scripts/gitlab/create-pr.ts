#!/usr/bin/env tsx
/**
 * Create a new GitLab MR for the current branch using @gitbeaker/rest.
 * Args: --title "<title>" --body "<body>" [--draft]
 */

import { execSync } from "node:child_process";
import { Gitlab } from "@gitbeaker/rest";

const args = process.argv.slice(2);
const title = extractArg(args, "--title");
const body = extractArg(args, "--body");
const draft = args.includes("--draft");

function extractArg(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function getCurrentBranch(): string {
  return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
}

function getProjectPath(): string | null {
  try {
    const remote = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    const match = remote.match(
      /(?:gitlab\.com[/:]|gitlab\.[a-z.-]+[/:])([\w.-]+\/[\w.-]+?)(?:\.git)?$/
    );
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function getDefaultBranch(): string {
  try {
    return execSync("git symbolic-ref refs/remotes/origin/HEAD", { encoding: "utf-8" })
      .trim()
      .replace("refs/remotes/origin/", "");
  } catch {
    return "main";
  }
}

if (!title) {
  console.error("--title is required");
  process.exit(1);
}

const projectPath = getProjectPath();
const token = process.env.GITLAB_TOKEN;
const sourceBranch = getCurrentBranch();
const targetBranch = getDefaultBranch();

if (!projectPath) {
  console.error("Could not determine GitLab project path from remote URL");
  process.exit(1);
}

if (!token) {
  console.error("GITLAB_TOKEN not set");
  process.exit(1);
}

const api = new Gitlab({ token });

try {
  const mr = await api.MergeRequests.create(projectPath, sourceBranch, targetBranch, {
    title,
    description: body || undefined,
    removeSourceBranch: true,
  });
  console.log(`MR created: ${mr.web_url}`);
} catch (err: any) {
  console.error(`Failed to create MR: ${err.message}`);
  process.exit(1);
}
