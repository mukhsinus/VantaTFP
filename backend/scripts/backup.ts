import 'dotenv/config';
import { chmod, mkdir } from 'fs/promises';
import { spawn } from 'child_process';
import { resolve } from 'path';

function timestampForFile(date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}_${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

async function run(): Promise<void> {
  const dbUrl = process.env.DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DB_URL or DATABASE_URL must be set');
  }

  const backupRoot = process.env.BACKUP_PATH ?? 'backups';
  const backupDir = resolve(process.cwd(), backupRoot);
  await mkdir(backupDir, { recursive: true });

  const outputFile = resolve(backupDir, `db_${timestampForFile()}.dump`);
  await new Promise<void>((resolveRun, rejectRun) => {
    const child = spawn('pg_dump', ['--format=custom', '--file', outputFile, dbUrl], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', rejectRun);
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      rejectRun(new Error(`pg_dump failed with exit code ${code ?? -1}`));
    });
  });

  // Keep dump readable only by the current OS user.
  await chmod(outputFile, 0o600);

  console.log(`Backup created: ${outputFile}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
