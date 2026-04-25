import { readdir, readFile, stat } from 'fs/promises';
import { resolve } from 'path';

const SCAN_DIRS = [resolve(process.cwd(), 'src'), resolve(process.cwd(), 'scripts')];
const ALLOWED_EXTENSIONS = new Set(['.ts', '.js', '.mjs', '.cjs']);
const LEGACY_SQL_PATTERNS = [/backend\/sql/gi, /\.\.\/sql\//gi, /\/sql\/20\d{6}/gi];

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const s = await stat(fullPath);
    if (s.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function hasAllowedExtension(path: string): boolean {
  return [...ALLOWED_EXTENSIONS].some((ext) => path.endsWith(ext));
}

async function run(): Promise<void> {
  const offenders: Array<{ file: string; pattern: string }> = [];

  for (const dir of SCAN_DIRS) {
    const files = await walk(dir);
    for (const file of files) {
      if (!hasAllowedExtension(file)) continue;
      if (file.endsWith('enforce-migration-source.ts')) continue;
      const content = await readFile(file, 'utf8');
      for (const pattern of LEGACY_SQL_PATTERNS) {
        const found = content.match(pattern);
        if (found && found.length > 0) {
          offenders.push({ file, pattern: pattern.source });
          break;
        }
      }
    }
  }

  if (offenders.length > 0) {
    const details = offenders
      .map((o) => `- ${o.file} (matched: ${o.pattern})`)
      .join('\n');
    throw new Error(
      `Legacy SQL runtime usage detected. Use backend/db/migrations only.\n${details}`
    );
  }

  console.log('Migration source check passed: no runtime references to backend/sql');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
