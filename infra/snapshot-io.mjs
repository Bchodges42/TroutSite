#!/usr/bin/env node
// ROLE 1 helper — archive/restore the generated snapshot trees using ONLY node.
// The server's portable Bash lacks coreutils (sleep/tar/find were the 2026-09-09
// deployment failure), but node is proven present, so the archive is a plain
// directory copy (backups/snapshots-last-good/) instead of a tarball.
//
//   node snapshot-io.mjs archive  <publicDir> <dstDir>   # v1/content/data → dstDir
//   node snapshot-io.mjs restore  <archiveDir> <publicDir>
//
// F24 (2026-09-29 audit): fs.rename cannot replace an EXISTING directory on
// Windows, so both promotions used to delete the old tree first and rename the
// staged copy in afterwards — delete-then-rename. One failed rename then took
// the good generation with it: a fault-injected archive promotion made the
// last-good archive disappear, a fault-injected restore promotion made the
// live v1 tree disappear — in both cases the staged copy survived under a path
// nothing reads. Promotion on BOTH paths is now:
//
//   rename the old generation aside → rename the new one in → only then
//   delete the aside; every failure path renames the old generation back
//   before exiting non-zero.
//
// Restore swaps all trees in one batch: every old tree stays on disk (renamed
// aside) until ALL trees are promoted, so a failure mid-batch cannot leave a
// half-restored read path behind. Renames retry briefly — on Windows a
// directory handle held for a moment by a watcher/indexer makes rename EPERM
// transiently, and a transient failure must not destroy a good generation.
import fs from 'node:fs';
import path from 'node:path';

const TREE_DIRS = ['v1', 'content', 'data'];
const [cmd, a, b] = process.argv.slice(2);

const exists = (p) => { try { fs.statSync(p); return true; } catch { return false; } };
const countFiles = (p) => {
  let n = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, e.name);
    if (e.isDirectory()) n += countFiles(full);
    else if (e.isFile()) n += 1;
  }
  return n;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fault-probe seam (the audit's reproduction method; never set in production):
// TROUT_FAULT_RENAME is a substring — the FIRST rename whose SOURCE path
// contains it throws a synthetic EPERM and the seam is consumed, so the undo
// renames afterwards run real code.
let faultMatch = process.env.TROUT_FAULT_RENAME || '';
function faultInjectedRename(from) {
  if (faultMatch && from.includes(faultMatch)) {
    faultMatch = '';
    throw Object.assign(new Error(`injected promotion fault (rename of ${from})`), { code: 'EPERM' });
  }
}

async function renameSturdy(from, to) {
  faultInjectedRename(from);
  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      lastErr = err;
      if (err.code !== 'EPERM' && err.code !== 'EACCES' && err.code !== 'EBUSY') break;
      await sleep(attempt * 50); // node timer — the portable-shell ban is on bash coreutils
    }
  }
  throw lastErr;
}

// Move `staged` onto `target` while retaining the old generation. Resolves
// with the aside path to delete after success (null when no previous
// generation existed); on failure the old generation is moved back into place
// before the error propagates.
async function promoteDir(staged, target) {
  if (!exists(target)) {
    await renameSturdy(staged, target);
    return null;
  }
  const aside = `${target}.prev-${process.pid}`;
  await renameSturdy(target, aside);
  try {
    await renameSturdy(staged, target);
  } catch (err) {
    try {
      await renameSturdy(aside, target);
      console.error(`[snapshot-io] promotion onto ${target} failed (${err.message}) — the previous generation was moved back into place`);
    } catch (undoErr) {
      console.error(`[snapshot-io] CRITICAL: promotion onto ${target} failed (${err.message}) and restoring the old generation failed too (${undoErr.message}); the old generation is preserved at: ${aside}`);
    }
    throw err;
  }
  return aside;
}

async function runArchive(publicDir, dst) {
  const dirs = TREE_DIRS
    .map((d) => path.join(publicDir, d))
    .filter((p) => exists(p) && countFiles(p) > 0);
  if (dirs.length === 0) {
    console.error('[snapshot-io] nothing to archive — generated trees missing/empty (that is the broken state, not the good one)');
    process.exitCode = 1;
    return;
  }
  const tmp = dst + '.tmp';
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  let total = 0;
  try {
    for (const from of dirs) {
      fs.cpSync(from, path.join(tmp, path.basename(from)), { recursive: true });
      total += countFiles(path.join(tmp, path.basename(from)));
    }
    // The last-good archive stays in place until the new generation is
    // promoted; a failed promotion restores it before exiting (F24).
    const aside = await promoteDir(tmp, dst);
    if (aside) fs.rmSync(aside, { recursive: true, force: true });
  } catch (err) {
    // The staged copy is worthless once the old generation is back in place —
    // clean it so no unreferenced half-generation lingers beside the archive.
    fs.rmSync(tmp, { recursive: true, force: true });
    throw err;
  }
  fs.writeFileSync(
    dst + '.stamp',
    `archived ${new Date().toISOString()} dirs=${dirs.map((d) => path.basename(d)).join(',')} files=${total}\n`,
  );
  console.log(`[snapshot-io] archived ${total} files (${dirs.map((d) => path.basename(d)).join(', ')}) → ${dst}`);
}

async function runRestore(archive, publicDir) {
  if (!exists(archive)) {
    console.error('[snapshot-io] no archive at ' + archive + ' — nothing to restore');
    process.exitCode = 1;
    return;
  }
  const pending = [];
  const stagings = [];
  try {
    for (const d of TREE_DIRS) {
      const src = path.join(archive, d);
      if (!exists(src)) continue;
      const target = path.join(publicDir, d);
      // Stage the copy beside the target first: building the staging touches
      // nothing the API reads (it reads these files per request). The only
      // visible step is the swap below.
      const staging = `${target}.restore-${process.pid}`;
      fs.rmSync(staging, { recursive: true, force: true });
      stagings.push(staging);
      fs.cpSync(src, staging, { recursive: true });
      pending.push({ staging, target });
    }
    if (pending.length === 0) {
      console.error('[snapshot-io] archive contained no trees — nothing restored');
      process.exitCode = 1;
      return;
    }
    // Swap phase: every old tree stays on disk (renamed aside) until ALL
    // trees are promoted; any failure undoes the trees that already swapped,
    // so the live read path never ends up half-restored (F24).
    const swapped = [];
    try {
      for (const { staging, target } of pending) {
        const aside = await promoteDir(staging, target);
        swapped.push({ aside, target });
      }
    } catch (err) {
      for (const { aside, target } of swapped.reverse()) {
        if (!aside) continue;
        try {
          // The new generation sits at `target` now and belongs to the failed
          // restore — remove it so the old generation can take its place back.
          fs.rmSync(target, { recursive: true, force: true });
          await renameSturdy(aside, target);
        } catch (undoErr) {
          console.error(`[snapshot-io] CRITICAL: could not undo the swap for ${target} (${undoErr.message}); the previous generation is preserved at: ${aside}`);
        }
      }
      throw err;
    }
    // Only now, with every tree promoted, drop the old generation.
    for (const { aside, target } of swapped) {
      if (aside) fs.rmSync(aside, { recursive: true, force: true });
      console.log(`[snapshot-io] restored ${path.basename(target)} (${countFiles(target)} files)`);
    }
  } finally {
    // Swapped stagings no longer exist (they were renamed); this clears the
    // unswapped ones so no half-generation is left beside the live trees.
    for (const staging of stagings) {
      fs.rmSync(staging, { recursive: true, force: true });
    }
  }
}

try {
  if (cmd === 'archive' && a && b) await runArchive(a, b);
  else if (cmd === 'restore' && a && b) await runRestore(a, b);
  else usage();
} catch (err) {
  console.error(`[snapshot-io] ${cmd} FAILED — ${err.message}`);
  process.exitCode = 1;
}

function usage() {
  console.error('usage: node snapshot-io.mjs archive <publicDir> <dstDir> | restore <archiveDir> <publicDir>');
  process.exit(2);
}
