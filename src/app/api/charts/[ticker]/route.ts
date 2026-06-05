import { NextRequest, NextResponse } from "next/server";
import { TWELVE_DATA_BASE_URL } from "@/lib/constants";
import {
  millisecondsToSeconds,
  formatUtcDateString,
  parseUtcDateTimeToSeconds,
} from "@/lib/time";

type TwelveDataValue = {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const entryTime = searchParams.get("entry_time");
  const exitTime = searchParams.get("exit_time");
  const interval = searchParams.get("interval") || "5min";

  if (!entryTime || !exitTime) {
    return NextResponse.json(
      { error: "entry_time and exit_time required (unix milliseconds)" },
      { status: 400 },
    );
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TWELVE_DATA_API_KEY not configured" },
      { status: 500 },
    );
  }

  const entrySeconds = millisecondsToSeconds(Number(entryTime));
  const exitSeconds = millisecondsToSeconds(Number(exitTime));
  const paddingSeconds = 2 * 60 * 60;
  const startDate = formatUtcDateString(entrySeconds - paddingSeconds);
  const endDate = formatUtcDateString(exitSeconds + paddingSeconds);

  const url = `${TWELVE_DATA_BASE_URL}/time_series?symbol=${ticker}&interval=${interval}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&order=asc&timezone=UTC&apikey=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Twelve Data returned ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();

    if (data.status === "error") {
      return NextResponse.json({ candles: [], error: data.message });
    }

    const values: TwelveDataValue[] = data.values ?? [];

    const candles = values
      .map((value) => ({
        time: parseUtcDateTimeToSeconds(value.datetime),
        open: Number(value.open),
        high: Number(value.high),
        low: Number(value.low),
        close: Number(value.close),
      }))
      .filter(
        (candle) =>
          !Number.isNaN(candle.time) &&
          !Number.isNaN(candle.open) &&
          !Number.isNaN(candle.high) &&
          !Number.isNaN(candle.low) &&
          !Number.isNaN(candle.close),
      );

    return NextResponse.json({ candles });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 },
    );
  }
}
