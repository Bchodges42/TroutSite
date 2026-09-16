#!/usr/bin/env node
// ROLE 1 helper — archive/restore the generated snapshot trees using ONLY node.
// The server's portable Bash lacks coreutils (sleep/tar/find were the 2026-09-09
// deployment failure), but node is proven present, so the archive is a plain
// directory copy (backups/snapshots-last-good/) instead of a tarball.
//
//   node snapshot-io.mjs archive  <publicDir> <dstDir>   # v1/content/data → dstDir
//   node snapshot-io.mjs restore  <archiveDir> <publicDir>
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

if (cmd === 'archive') {
  const publicDir = a, dst = b;
  if (!publicDir || !dst) usage();
  const dirs = TREE_DIRS
    .map((d) => path.join(publicDir, d))
    .filter((p) => exists(p) && countFiles(p) > 0);
  if (dirs.length === 0) {
    console.error('[snapshot-io] nothing to archive — generated trees missing/empty (that is the broken state, not the good one)');
    process.exit(1);
  }
  const tmp = dst + '.tmp';
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  let total = 0;
  for (const from of dirs) {
    fs.cpSync(from, path.join(tmp, path.basename(from)), { recursive: true });
    total += countFiles(path.join(tmp, path.basename(from)));
  }
  fs.rmSync(dst, { recursive: true, force: true });
  fs.renameSync(tmp, dst);
  fs.writeFileSync(
    dst + '.stamp',
    `archived ${new Date().toISOString()} dirs=${dirs.map((d) => path.basename(d)).join(',')} files=${total}\n`,
  );
  console.log(`[snapshot-io] archived ${total} files (${dirs.map((d) => path.basename(d)).join(', ')}) → ${dst}`);
} else if (cmd === 'restore') {
  const archive = a, publicDir = b;
  if (!archive || !publicDir) usage();
  if (!exists(archive)) {
    console.error('[snapshot-io] no archive at ' + archive + ' — nothing to restore');
    process.exit(1);
  }
  let restored = 0;
  for (const d of TREE_DIRS) {
    const src = path.join(archive, d);
    if (!exists(src)) continue;
    const target = path.join(publicDir, d);
    // Atomicity (2026-09-16 infra audit): restore used to rm the target then
    // copy — during the copy the API (which reads these files per request)
    // served 404s/partial trees. Stage the copy beside the target and swap by
    // rename; the uncovered window shrinks from the whole copy to one syscall.
    const staging = `${target}.restore-${process.pid}`;
    fs.rmSync(staging, { recursive: true, force: true });
    try {
      fs.cpSync(src, staging, { recursive: true });
    } catch (err) {
      fs.rmSync(staging, { recursive: true, force: true });
      throw err;
    }
    fs.rmSync(target, { recursive: true, force: true });
    fs.renameSync(staging, target);
    restored += 1;
    console.log(`[snapshot-io] restored ${d} (${countFiles(target)} files)`);
  }
  if (restored === 0) {
    console.error('[snapshot-io] archive contained no trees — nothing restored');
    process.exit(1);
  }
} else {
  usage();
}

function usage() {
  console.error('usage: node snapshot-io.mjs archive <publicDir> <dstDir> | restore <archiveDir> <publicDir>');
  process.exit(2);
}
