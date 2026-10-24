import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sanitizeFlexXml } from "@/server/flex/sanitize";

const [inputPath, outputPath] = process.argv.slice(2);

if (inputPath === undefined || outputPath === undefined) {
  console.error("usage: pnpm sanitize:flex <input-flex-xml> <output-xml>");
  process.exit(1);
}

const rawXml = readFileSync(inputPath, "utf8");
const sanitizedXml = sanitizeFlexXml(rawXml);
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, sanitizedXml, "utf8");
console.log(`Sanitized ${inputPath} -> ${outputPath}`);
