#!/usr/bin/env tsx
/**
 * Update an existing GitLab MR using @gitbeaker/rest.
 * Args: --pr <iid> --title "<title>" --body "<body>"
 */

import { execSync } from "node:child_process";
import { Gitlab } from "@gitbeaker/rest";

const args = process.argv.slice(2);
const mrIid = Number(extractArg(args, "--pr"));
const title = extractArg(args, "--title");
const body = extractArg(args, "--body");

function extractArg(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

function getProjectPath(): string | null {
  try {
    const remote = execSync("git remote get-url origin", {
      encoding: "utf-8",
    }).trim();
    const match = remote.match(
      /(?:gitlab\.com[/:]|gitlab\.[a-z.-]+[/:])([\w.-]+\/[\w.-]+?)(?:\.git)?$/
    );
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

if (!mrIid) {
  console.error("--pr is required (numeric IID)");
  process.exit(1);
}

const projectPath = getProjectPath();
const token = process.env.GITLAB_TOKEN;

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
  const updates: Record<string, string> = {};
  if (title) updates.title = title;
  if (body) updates.description = body;

  const mr = await api.MergeRequests.edit(projectPath, mrIid, updates);
  console.log(`MR #${mr.iid} updated: ${mr.web_url}`);
} catch (err: any) {
  console.error(`Failed to update MR: ${err.message}`);
  process.exit(1);
}
