import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { backupScreenshots, pruneBackups } from "@/lib/backup";

function makeTempDir() {
  return mkdtempSync(join(tmpdir(), "hindsight-backup-test-"));
}

function withMtime(path: string, isoTime: string) {
  const time = new Date(isoTime);
  utimesSync(path, time, time);
}

test("pruneBackups keeps newest N across db files and screenshot folders", () => {
  const dir = makeTempDir();
  try {
    const backups = [
      {
        name: "hindsight-2026-01-01.db",
        time: "2026-01-01T01:00:00Z",
        kind: "file",
      },
      {
        name: "screenshots-2026-01-01",
        time: "2026-01-01T01:30:00Z",
        kind: "dir",
      },
      {
        name: "hindsight-2026-01-02.db",
        time: "2026-01-02T02:00:00Z",
        kind: "file",
      },
      {
        name: "screenshots-2026-01-02",
        time: "2026-01-02T02:30:00Z",
        kind: "dir",
      },
      {
        name: "hindsight-2026-01-03.db",
        time: "2026-01-03T03:00:00Z",
        kind: "file",
      },
    ];
    for (const backup of backups) {
      const path = join(dir, backup.name);
      if (backup.kind === "dir") {
        mkdirSync(path);
      } else {
        writeFileSync(path, "db");
      }
      withMtime(path, backup.time);
    }

    const removed = pruneBackups(dir, 2);

    expect(removed.sort()).toEqual([
      "hindsight-2026-01-01.db",
      "hindsight-2026-01-02.db",
      "screenshots-2026-01-01",
    ]);
    expect(existsSync(join(dir, "hindsight-2026-01-03.db"))).toBe(true);
    expect(existsSync(join(dir, "screenshots-2026-01-02"))).toBe(true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("pruneBackups returns empty on a missing directory, never throws", () => {
  expect(pruneBackups(join(tmpdir(), "does-not-exist-hindsight"), 30)).toEqual(
    [],
  );
});

test("backupScreenshots skips cleanly when the source is missing", () => {
  expect(
    backupScreenshots(
      join(tmpdir(), "does-not-exist-hindsight"),
      join(tmpdir(), "destination-hindsight"),
    ),
  ).toBe("skipped");
});

test("backupScreenshots copies files into the destination", () => {
  const source = makeTempDir();
  const destination = makeTempDir();
  try {
    writeFileSync(join(source, "entry.png"), "image");
    writeFileSync(join(source, "exit.png"), "image");

    expect(backupScreenshots(source, join(destination, "shots"))).toBe(
      "copied",
    );
    expect(existsSync(join(destination, "shots", "entry.png"))).toBe(true);
    expect(existsSync(join(destination, "shots", "exit.png"))).toBe(true);
  } finally {
    rmSync(source, { recursive: true, force: true });
    rmSync(destination, { recursive: true, force: true });
  }
});
