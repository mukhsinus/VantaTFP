import 'dotenv/config';
import { resolve } from 'path';
import { spawn } from 'child_process';

async function run(): Promise<void> {
  const fileArg = process.argv[2];
  if (!fileArg) {
    throw new Error('Usage: tsx scripts/restore.ts <path-to-dump>');
  }

  const dbUrl = process.env.DB_URL ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DB_URL or DATABASE_URL must be set');
  }

  const dumpPath = resolve(process.cwd(), fileArg);

  await new Promise<void>((resolveRun, rejectRun) => {
    const child = spawn(
      'pg_restore',
      ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--dbname', dbUrl, dumpPath],
      {
        stdio: 'inherit',
        env: process.env,
      }
    );

    child.on('error', rejectRun);
    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      rejectRun(new Error(`pg_restore failed with exit code ${code ?? -1}`));
    });
  });

  console.log(`Restore completed from: ${dumpPath}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
