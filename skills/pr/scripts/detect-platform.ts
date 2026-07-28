#!/usr/bin/env tsx
/**
 * Detect Git platform from remote URL.
 * Returns: "github" | "gitlab" | null
 */

import { execSync } from "node:child_process";

function detectPlatform(): string | null {
  try {
    const remote = execSync("git remote get-url origin", {
      encoding: "utf-8",
    }).trim();

    if (remote.includes("github.com")) return "github";
    if (remote.includes("gitlab.com") || /gitlab\.[a-z.-]+/.test(remote))
      return "gitlab";

    console.error(`Unknown platform: ${remote}`);
    return null;
  } catch {
    console.error("No git remote 'origin' found.");
    return null;
  }
}

const platform = detectPlatform();
if (platform) console.log(platform);
else process.exit(1);
