const DATE_OPTIONS = "en-US";

function toDate(value: Date | number | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number, decimals = 2): string {
  return `$${value.toFixed(decimals)}`;
}

export function formatSignedCurrency(value: number): string {
  return `${value >= 0 ? "+" : ""}$${value.toFixed(2)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatRiskMultiple(value: number): string {
  return `${value.toFixed(1)}R`;
}

export function formatShortDate(value: Date | number | string): string {
  return toDate(value).toLocaleDateString(DATE_OPTIONS, {
    month: "short",
    day: "numeric",
  });
}

export function formatShortDateWithYear(value: Date | number | string): string {
  return toDate(value).toLocaleDateString(DATE_OPTIONS, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatHeaderDate(value: Date | number | string): string {
  return toDate(value).toLocaleDateString(DATE_OPTIONS, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatLongDate(value: Date | number | string): string {
  return toDate(value).toLocaleDateString(DATE_OPTIONS, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatWeekday(value: Date | number | string): string {
  return toDate(value).toLocaleDateString(DATE_OPTIONS, {
    weekday: "short",
  });
}

export function formatTime(value: Date | number | string): string {
  return toDate(value).toLocaleTimeString(DATE_OPTIONS, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
