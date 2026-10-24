const sensitiveAttributePattern =
  /(accountId|accountAlias|accountName)="([^"]*)"/g;

export function sanitizeFlexXml(rawXml: string): string {
  const maskedValues = new Map<string, string>();
  return rawXml.replace(
    sensitiveAttributePattern,
    (attribute: string, attributeName: string, value: string) => {
      if (value === "") {
        return attribute;
      }
      const existingMask = maskedValues.get(value);
      if (existingMask !== undefined) {
        return `${attributeName}="${existingMask}"`;
      }
      const mask = `MASKED-ACCOUNT-${maskedValues.size + 1}`;
      maskedValues.set(value, mask);
      return `${attributeName}="${mask}"`;
    },
  );
}
