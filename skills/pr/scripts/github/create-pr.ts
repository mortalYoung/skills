#!/usr/bin/env tsx
/**
 * Create a new GitHub PR for the current branch using Octokit.
 * Args: --title "<title>" --body "<body>" [--draft]
 */

import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";

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

function getOwnerRepo(): { owner: string; repo: string } | null {
  try {
    const remote = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    const match = remote.match(
      /(?:github\.com[/:])([\w.-]+)\/([\w.-]+?)(?:\.git)?$/
    );
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
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

const repoInfo = getOwnerRepo();
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const head = getCurrentBranch();
const base = getDefaultBranch();

if (!repoInfo) {
  console.error("Could not determine owner/repo from remote URL");
  process.exit(1);
}

if (!token) {
  console.error("GITHUB_TOKEN or GH_TOKEN not set");
  process.exit(1);
}

const octokit = new Octokit({ auth: token });

try {
  const { data: pr } = await octokit.rest.pulls.create({
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    title,
    body: body || undefined,
    head,
    base,
    draft,
  });
  console.log(`PR created: ${pr.html_url}`);
} catch (err: any) {
  console.error(`Failed to create PR: ${err.message}`);
  process.exit(1);
}
