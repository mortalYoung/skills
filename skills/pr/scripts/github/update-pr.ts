/**
 * Update an existing GitHub PR using Octokit.
 * Args: --pr <number> --title "<title>" --body "<body>"
 */

import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";

const args = process.argv.slice(2);
const prNumber = Number(extractArg(args, "--pr"));
const title = extractArg(args, "--title");
const body = extractArg(args, "--body");

function extractArg(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function getOwnerRepo(): { owner: string; repo: string } | null {
  try {
    const remote = execSync("git remote get-url origin", {
      encoding: "utf-8",
    }).trim();
    const match = remote.match(
      /(?:github\.com[/:])([\w.-]+)\/([\w.-]+?)(?:\.git)?$/
    );
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

if (!prNumber) {
  console.error("--pr is required (numeric PR number)");
  process.exit(1);
}

const repoInfo = getOwnerRepo();
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

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
  const updates: Record<string, string> = {};
  if (title) updates.title = title;
  if (body) updates.body = body;

  const { data: pr } = await octokit.rest.pulls.update({
    owner: repoInfo.owner,
    repo: repoInfo.repo,
    pull_number: prNumber,
    ...updates,
  });
  console.log(`PR #${pr.number} updated: ${pr.html_url}`);
} catch (err: any) {
  console.error(`Failed to update PR: ${err.message}`);
  process.exit(1);
}
