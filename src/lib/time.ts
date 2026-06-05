export function millisecondsToSeconds(milliseconds: number): number {
  return Math.floor(milliseconds / 1000);
}

export function secondsToMilliseconds(seconds: number): number {
  return seconds * 1000;
}

export function formatUtcDateString(seconds: number): string {
  const date = new Date(secondsToMilliseconds(seconds));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const utcSeconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${utcSeconds}`;
}

export function parseUtcDateTimeToSeconds(dateTime: string): number {
  return millisecondsToSeconds(new Date(`${dateTime.replace(" ", "T")}Z`).getTime());
}
