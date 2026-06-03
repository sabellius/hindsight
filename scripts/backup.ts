import Database from "better-sqlite3";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const BACKUP_DIR = "data/backups";
const DB_PATH = "hindsight.db";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");

function main() {
  if (!existsSync(DB_PATH)) {
    console.error("hindsight.db not found");
    process.exit(1);
  }

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH, { readonly: true });
  const backupPath = join(BACKUP_DIR, `hindsight-${TIMESTAMP}.db`);
  db.backup(backupPath)
    .then(() => {
      db.close();
      console.log(`Database backed up to ${backupPath}`);

      if (existsSync("data/screenshots")) {
        const screenshotsBackup = join(BACKUP_DIR, `screenshots-${TIMESTAMP}`);
        mkdirSync(screenshotsBackup, { recursive: true });
        try {
          execSync(`cp -r data/screenshots/* ${screenshotsBackup}/`);
          console.log(`Screenshots backed up to ${screenshotsBackup}`);
        } catch {
          console.log("No screenshots to backup");
        }
      }

      const backups = execSync(`ls -t ${BACKUP_DIR}/hindsight-*.db 2>/dev/null`)
        .toString()
        .trim()
        .split("\n")
        .filter(Boolean);

      const MAX_BACKUPS = 30;
      if (backups.length > MAX_BACKUPS) {
        const toDelete = backups.slice(MAX_BACKUPS);
        for (const f of toDelete) {
          execSync(`rm -f "${f}"`);
        }
        console.log(`Cleaned up ${toDelete.length} old backups (keeping last ${MAX_BACKUPS})`);
      }
    })
    .catch((err) => {
      db.close();
      console.error("Backup failed:", err);
      process.exit(1);
    });
}

main();
