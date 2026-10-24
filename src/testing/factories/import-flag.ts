import { Factory } from "fishery";
import type { importFlags } from "@/server/db/schema";

type ImportFlagInsert = typeof importFlags.$inferInsert;

export const importFlagFactory = Factory.define<ImportFlagInsert>(
  ({ sequence }) => ({
    batchId: sequence,
    reason: "unknown flex element",
    rawFields: JSON.stringify({ assetCategory: "CORP", ticker: "XYZ" }),
    createdAt: new Date("2026-01-15T00:00:00Z"),
  }),
);
