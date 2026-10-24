import { Factory } from "fishery";
import type { importBatches } from "@/server/db/schema";

type ImportBatchInsert = typeof importBatches.$inferInsert;

export const importBatchFactory = Factory.define<ImportBatchInsert>(
  ({ sequence }) => ({
    fileName: `flex-${sequence}.xml`,
    rawFilePath: `exports/archive/flex-${sequence}.xml`,
    accountId: null,
    createdAt: new Date("2026-01-15T00:00:00Z"),
  }),
);
