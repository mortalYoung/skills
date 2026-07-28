/**
 * Check if an open PR exists for the current branch using Octokit.
 * Returns PR number and metadata if found, exits with 1 if not.
 */

import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";

function getCurrentBranch(): string {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
  }).trim();
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

async function checkExistingPR(): Promise<void> {
  const branch = getCurrentBranch();
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
    const { data: prs } = await octokit.rest.pulls.list({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      head: `${repoInfo.owner}:${branch}`,
      state: "open",
    });

    if (prs.length > 0) {
      const pr = prs[0];
      console.log(
        JSON.stringify({
          found: true,
          number: pr.number,
          title: pr.title,
          body: pr.body,
          state: pr.state,
        })
      );
    } else {
      console.log(JSON.stringify({ found: false }));
    }
  } catch {
    console.log(JSON.stringify({ found: false }));
  }
}

checkExistingPR();
