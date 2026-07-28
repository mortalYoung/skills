/**
 * Shared utilities for GitLab PR/MR operations.
 * Parses git remote URLs in various formats to extract host and project path.
 */

import { execSync } from "node:child_process";

/**
 * Get the git remote URL for "origin".
 */
function getRemoteUrl(): string {
  return execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
}

/**
 * Parse a git remote URL to extract the hostname and project path.
 *
 * Supports all common git remote URL formats:
 *   ssh://git@host[:port]/path/to/repo.git
 *   git@host:path/to/repo.git
 *   https://host/path/to/repo.git
 *
 * @returns `{ host, projectPath }` or `null` if parsing fails.
 */
export function parseRemote(remote: string): { host: string; projectPath: string } | null {
  let hostname: string | null = null;
  let projectPath: string | null = null;

  // Handle protocol-based URLs: ssh://git@host:port/path, https://host/path
  if (remote.includes("://")) {
    try {
      const url = new URL(remote);
      hostname = url.hostname;
      // Strip leading slash and trailing .git from pathname
      projectPath = url.pathname.replace(/^\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    } catch {
      return null;
    }
  }
  // Handle SCP-like URLs: git@host:path/to/repo.git
  else {
    const match = remote.match(/@([a-zA-Z0-9._-]+):(.+?)(?:\.git)?$/);
    if (match) {
      hostname = match[1];
      projectPath = match[2].replace(/\.git$/, "");
    }
  }

  if (!hostname || !projectPath) return null;
  return { host: `https://${hostname}`, projectPath };
}

/**
 * Get the GitLab instance host URL from the git remote.
 *
 * @returns The host URL (e.g. "https://gitlab.example.com") or `null` on failure.
 */
export function getGitLabHost(): string | null {
  try {
    const parsed = parseRemote(getRemoteUrl());
    return parsed?.host ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the GitLab project path (e.g. "group/project") from the git remote.
 *
 * @returns The project path or `null` on failure.
 */
export function getProjectPath(): string | null {
  try {
    const parsed = parseRemote(getRemoteUrl());
    return parsed?.projectPath ?? null;
  } catch {
    return null;
  }
}
