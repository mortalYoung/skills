#!/usr/bin/env npx tsx
/**
 * Unship skills — remove symlinks in `~/.claude/skills/` that point to this project.
 *
 * Usage:
 *   npx tsx scripts/unship.ts              # normal run
 *   npx tsx scripts/unship.ts --dry-run    # preview only
 *   npx tsx scripts/unship.ts --all        # remove all my symlinks, including dead ones
 */

import { existsSync, lstatSync, readdirSync, unlinkSync, readlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname;
const SKILLS_SRC = join(PROJECT_ROOT, "skills");
const SKILLS_DST = join(homedir(), ".claude", "skills");

// ── Flags ────────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const ALL = args.has("--all");

// ── Helpers ──────────────────────────────────────────────────────────
function log(...msg: unknown[]) {
  if (DRY_RUN) console.log("[dry-run]", ...msg);
  else console.log(...msg);
}

function belongsToUs(symlinkTarget: string): boolean {
  if (ALL) return true;
  // Check if the symlink target is under this project's skills/ directory
  return symlinkTarget.startsWith(SKILLS_SRC);
}

// ── Main ─────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(SKILLS_DST)) {
    console.log("Nothing to unship — ~/.claude/skills/ does not exist.");
    return;
  }

  const entries = readdirSync(SKILLS_DST, { withFileTypes: true });
  let removed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const fullPath = join(SKILLS_DST, entry.name);

    // Only process symlinks
    if (!entry.isSymbolicLink() && !lstatSync(fullPath).isSymbolicLink()) {
      skipped++;
      continue;
    }

    const target = readlinkSync(fullPath);

    if (!belongsToUs(target)) {
      skipped++;
      continue;
    }

    // It's one of ours — remove it
    if (DRY_RUN) {
      log(`🗑  ${entry.name} → ${target}`);
    } else {
      unlinkSync(fullPath);
      log(`🗑  ${entry.name}`);
    }
    removed++;
  }

  if (removed === 0 && !DRY_RUN) {
    console.log("No shipped symlinks found.");
  }

  console.log(`\nDone. ${removed} removed, ${skipped} skipped.`);
}

main();
