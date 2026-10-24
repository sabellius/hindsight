import { Factory } from "fishery";
import type { accounts } from "@/server/db/schema";

type AccountInsert = typeof accounts.$inferInsert;

export const accountFactory = Factory.define<AccountInsert>(({ sequence }) => ({
  name: `Test Account ${sequence}`,
  type: "live",
  createdAt: new Date("2026-01-01T00:00:00Z"),
}));
