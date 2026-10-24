import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { backupScreenshots, pruneBackups } from "@/lib/backup";

const BACKUP_DIR = "data/backups";
const DB_PATH = "hindsight.db";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const MAX_BACKUPS = 30;

function main() {
  if (!existsSync(DB_PATH)) {
    console.error("hindsight.db not found");
    process.exit(1);
  }

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const database = new Database(DB_PATH, { readonly: true });
  const backupPath = join(BACKUP_DIR, `hindsight-${TIMESTAMP}.db`);

  database
    .backup(backupPath)
    .then(() => {
      database.close();
      console.log(`Database backed up to ${backupPath}`);

      const screenshots = backupScreenshots(
        "data/screenshots",
        join(BACKUP_DIR, `screenshots-${TIMESTAMP}`),
      );
      if (screenshots === "copied") {
        console.log("Screenshots backed up");
      }

      const pruned = pruneBackups(BACKUP_DIR, MAX_BACKUPS);
      if (pruned.length > 0) {
        console.log(
          `Pruned ${pruned.length} old backup artifacts (keeping last ${MAX_BACKUPS})`,
        );
      }
    })
    .catch((err: unknown) => {
      database.close();
      console.error("Backup failed:", err);
      process.exit(1);
    });
}

main();
