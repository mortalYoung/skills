/**
 * Check if an open MR exists for the current branch using @gitbeaker/rest.
 * Returns MR IID and metadata if found, exits with 1 if not.
 */

import dotenv from "dotenv";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import { Gitlab } from "@gitbeaker/rest";
import { getGitLabHost, getProjectPath } from "./gitlab-utils.ts";

dotenv.config({ path: resolve(import.meta.dirname!, "../../.env") });

function getCurrentBranch(): string {
  return execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
  }).trim();
}

async function checkExistingMR(): Promise<void> {
  const branch = getCurrentBranch();
  const host = getGitLabHost();
  const projectPath = getProjectPath();
  const token = process.env.GITLAB_TOKEN;

  if (!host || !projectPath) {
    console.error("Could not determine GitLab host or project path from remote URL");
    process.exit(1);
  }

  if (!token) {
    console.error("GITLAB_TOKEN not set");
    process.exit(1);
  }

  const api = new Gitlab({ token, host });

  try {
    const mrs = await api.MergeRequests.all({
      projectId: projectPath,
      sourceBranch: branch,
      state: "opened",
    });

    if (mrs.length > 0) {
      const mr = mrs[0];
      console.log(
        JSON.stringify({
          found: true,
          iid: mr.iid,
          title: mr.title,
          description: mr.description,
          web_url: mr.web_url,
        })
      );
    } else {
      console.log(JSON.stringify({ found: false }));
    }
  } catch {
    console.log(JSON.stringify({ found: false }));
  }
}

checkExistingMR();
