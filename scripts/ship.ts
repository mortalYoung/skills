#!/usr/bin/env npx tsx
/**
 * Ship skills — symlink all skills under `skills/` into `~/.claude/skills/`.
 *
 * Usage:
 *   npx tsx scripts/ship.ts              # normal run
 *   npx tsx scripts/ship.ts --dry-run    # preview only
 *   npx tsx scripts/ship.ts --force      # overwrite existing non-symlink entries
 */

import { existsSync, lstatSync, readdirSync, symlinkSync, unlinkSync, readlinkSync } from "node:fs";
import { join, relative } from "node:path";
import { homedir } from "node:os";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname;
const SKILLS_SRC = join(PROJECT_ROOT, "skills");
const SKILLS_DST = join(homedir(), ".claude", "skills");

// ── Flags ────────────────────────────────────────────────────────────
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

// ── Helpers ──────────────────────────────────────────────────────────
function log(...msg: unknown[]) {
  if (DRY_RUN) console.log("[dry-run]", ...msg);
  else console.log(...msg);
}

function isSkillDir(dir: string): boolean {
  return existsSync(join(SKILLS_SRC, dir, "SKILL.md"));
}

// ── Main ─────────────────────────────────────────────────────────────
function main() {
  if (!existsSync(SKILLS_SRC)) {
    console.error(`❌ Source directory not found: ${SKILLS_SRC}`);
    process.exit(1);
  }

  if (!existsSync(SKILLS_DST)) {
    if (DRY_RUN) {
      log(`mkdir -p ${SKILLS_DST}`);
    } else {
      // Create ~/.claude/skills if it doesn't exist
      const { mkdirSync } = require("node:fs");
      mkdirSync(SKILLS_DST, { recursive: true });
    }
  }

  const entries = readdirSync(SKILLS_SRC, { withFileTypes: true });
  const skills = entries
    .filter((e) => e.isDirectory() && isSkillDir(e.name))
    .map((e) => e.name);

  if (skills.length === 0) {
    console.log("No skills found to ship.");
    return;
  }

  console.log(`Found ${skills.length} skill(s): ${skills.join(", ")}`);
  console.log(`Target: ${SKILLS_DST}\n`);

  let linked = 0;
  let skipped = 0;
  let errors = 0;

  for (const name of skills) {
    const srcPath = join(SKILLS_SRC, name);
    const dstPath = join(SKILLS_DST, name);

    // Check what's at the destination
    const dstExists = existsSync(dstPath);

    if (dstExists) {
      const isSymlink = lstatSync(dstPath).isSymbolicLink();
      let existingTarget: string | null = null;
      if (isSymlink) {
        existingTarget = readlinkSync(dstPath);
      }

      // Already pointing to the right place — skip
      if (isSymlink && existingTarget === srcPath) {
        log(`⏭  ${name} — already linked`);
        skipped++;
        continue;
      }

      // Existing symlink pointing elsewhere — overwrite
      if (isSymlink) {
        if (DRY_RUN) {
          log(`🐛 ${name} — relink: ${existingTarget} → ${srcPath}`);
        } else {
          unlinkSync(dstPath);
          symlinkSync(srcPath, dstPath);
          log(`🔗 ${name} — relinked (was → ${relative(SKILLS_DST, existingTarget!)})`);
        }
        linked++;
        continue;
      }

      // Existing real directory or file — skip or error
      if (FORCE) {
        if (DRY_RUN) {
          log(`⚠️  ${name} — would remove existing entry & link`);
        } else {
          // Remove recursively (rm -rf equivalent)
          const { rmSync } = require("node:fs");
          rmSync(dstPath, { recursive: true, force: true });
          symlinkSync(srcPath, dstPath);
          log(`🔗 ${name} — overwrote existing entry with symlink`);
        }
        linked++;
      } else {
        console.warn(`⚠️  ${name} — exists and is not a symlink pointing here. Use --force to overwrite.`);
        errors++;
      }
      continue;
    }

    // Fresh link
    if (DRY_RUN) {
      log(`🔗 ${name} → ${dstPath}`);
    } else {
      symlinkSync(srcPath, dstPath);
      log(`🔗 ${name}`);
    }
    linked++;
  }

  console.log(`\nDone. ${linked} linked, ${skipped} skipped, ${errors} error(s).`);
}

main();
