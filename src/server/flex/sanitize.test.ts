import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { sanitizeFlexXml } from "@/server/flex/sanitize";

const sampleFixturePath = join(
  process.cwd(),
  "src",
  "server",
  "flex",
  "fixtures",
  "sample.flex.xml",
);

function countOccurrences(haystack: string, needle: string) {
  return haystack.split(needle).length - 1;
}

describe("sanitizeFlexXml on the sample fixture", () => {
  const rawXml = readFileSync(sampleFixturePath, "utf8");
  const sanitizedXml = sanitizeFlexXml(rawXml);

  test("masks every account id occurrence", () => {
    expect(sanitizedXml).not.toContain("U7654321");
    expect(countOccurrences(sanitizedXml, 'accountId="MASKED-ACCOUNT-1"')).toBe(
      countOccurrences(rawXml, 'accountId="U7654321"'),
    );
  });

  test("keeps quantities, amounts, and prices verbatim", () => {
    expect(sanitizedXml).toContain('quantity="0.3712"');
    expect(sanitizedXml).toContain('quantity="2"');
    expect(sanitizedXml).toContain('tradePrice="185.50"');
    expect(sanitizedXml).toContain('tradePrice="187.20"');
    expect(sanitizedXml).toContain('netCash="-370.45"');
    expect(sanitizedXml).toContain('ibCommission="1.00"');
    expect(sanitizedXml).toContain('ibCommission="3.50"');
    expect(sanitizedXml).toContain('amount="5000.00"');
    expect(sanitizedXml).toContain('amount="-0.05"');
  });

  test("keeps currencies and ticker attributes verbatim", () => {
    expect(sanitizedXml).toContain('currency="USD"');
    expect(sanitizedXml).toContain('currency="EUR"');
    expect(sanitizedXml).toContain('ibCommissionCurrency="EUR"');
    expect(sanitizedXml).toContain('symbol="AAPL"');
    expect(sanitizedXml).toContain('symbol="ASML"');
    expect(sanitizedXml).toContain('ticker="ASML"');
    expect(sanitizedXml).toContain('assetCategory="STK"');
    expect(sanitizedXml).toContain('type="Withholding Tax"');
  });

  test("keeps the documented dateTime formats verbatim", () => {
    expect(sanitizedXml).toContain('dateTime="20240102;154500"');
    expect(sanitizedXml).toContain('dateTime="20240131;000000"');
    expect(sanitizedXml).toContain('tradeDate="20240109"');
    expect(sanitizedXml).toContain('tradeTime="14:30:00"');
  });

  test("preserves the element structure", () => {
    expect(countOccurrences(sanitizedXml, "<Order ")).toBe(
      countOccurrences(rawXml, "<Order "),
    );
    expect(countOccurrences(sanitizedXml, "<Trade ")).toBe(
      countOccurrences(rawXml, "<Trade "),
    );
    expect(countOccurrences(sanitizedXml, "<CashTransaction ")).toBe(
      countOccurrences(rawXml, "<CashTransaction "),
    );
    expect(countOccurrences(sanitizedXml, "accountId=")).toBe(
      countOccurrences(rawXml, "accountId="),
    );
  });

  test("is deterministic", () => {
    expect(sanitizeFlexXml(rawXml)).toBe(sanitizedXml);
  });
});

describe("sanitizeFlexXml on inline samples", () => {
  test("masks account aliases and account names", () => {
    const rawXml =
      '<FlexStatement accountId="U246810" accountAlias="Saveliy Personal" >' +
      '<AccountInformation accountId="U246810" accountName="Saveliy Personal" currency="USD"/>' +
      "</FlexStatement>";

    const sanitizedXml = sanitizeFlexXml(rawXml);

    expect(sanitizedXml).not.toContain("U246810");
    expect(sanitizedXml).not.toContain("Saveliy Personal");
    expect(sanitizedXml).toContain('currency="USD"');
    expect(sanitizedXml).toContain('accountAlias="MASKED-ACCOUNT-2"');
    expect(sanitizedXml).toContain('accountName="MASKED-ACCOUNT-2"');
  });

  test("gives distinct account ids distinct masks in first-seen order", () => {
    const rawXml =
      '<FlexStatement accountId="U111" fromDate="20240102" toDate="20240131">' +
      '<CashTransaction accountId="U222" amount="1.00" currency="USD"/>' +
      '<CashTransaction accountId="U111" amount="2.00" currency="USD"/>' +
      "</FlexStatement>";

    const sanitizedXml = sanitizeFlexXml(rawXml);

    expect(sanitizedXml).toContain('accountId="MASKED-ACCOUNT-1"');
    expect(sanitizedXml).toContain('accountId="MASKED-ACCOUNT-2"');
    expect(sanitizedXml).toContain('amount="1.00"');
    expect(sanitizedXml).toContain('amount="2.00"');
    expect(sanitizedXml).not.toContain("U111");
    expect(sanitizedXml).not.toContain("U222");
  });

  test("leaves empty attribute values untouched", () => {
    const rawXml = '<Trade accountId="" quantity="1" tradePrice="2.00"/>';

    const sanitizedXml = sanitizeFlexXml(rawXml);

    expect(sanitizedXml).toBe(
      '<Trade accountId="" quantity="1" tradePrice="2.00"/>',
    );
  });
});
