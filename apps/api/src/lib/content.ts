import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

export interface ContentFile {
  /** Absolute path of the YAML file. */
  path: string;
  /** Parsed YAML payload (unvalidated). */
  data: unknown;
}

/** Recursively collect and parse every *.yaml/*.yml file under dir. Missing dir → []. */
export function readYamlFiles(dir: string): ContentFile[] {
  if (!statSafeIsDirectory(dir)) return [];
  const out: ContentFile[] = [];
  walk(dir);
  return out;

  function walk(d: string): void {
    for (const entry of readdirSync(d)) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) {
        walk(p);
      } else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
        try {
          out.push({ path: p, data: parse(readFileSync(p, 'utf8')) });
        } catch (err) {
          throw new Error(`Failed to parse YAML file ${p}: ${(err as Error).message}`);
        }
      }
    }
  }
}

function statSafeIsDirectory(dir: string): boolean {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}
