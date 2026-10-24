import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

export function pruneBackups(directory: string, keep: number): string[] {
  if (!existsSync(directory)) return [];

  const entries = readdirSync(directory)
    .filter(
      (name) =>
        name.startsWith("hindsight-") || name.startsWith("screenshots-"),
    )
    .map((name) => {
      const path = join(directory, name);
      return { name, path, modifiedMs: statSync(path).mtimeMs };
    })
    .sort((a, b) => b.modifiedMs - a.modifiedMs);

  const removed = entries.slice(keep);
  for (const entry of removed) {
    rmSync(entry.path, { recursive: true, force: true });
  }
  return removed.map((entry) => entry.name);
}

export function backupScreenshots(
  source: string,
  destination: string,
): "skipped" | "copied" {
  if (!existsSync(source)) return "skipped";

  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source)) {
    copyFileSync(join(source, entry), join(destination, entry));
  }
  return "copied";
}
