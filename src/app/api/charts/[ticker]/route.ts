import { NextRequest, NextResponse } from "next/server";
import { ALPACA_DATA_BASE_URL } from "@/lib/constants";
import { millisecondsToSeconds } from "@/lib/time";

type AlpacaBar = {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
  vw: number;
};

const INTERVAL_MAP: Record<string, string> = {
  "1min": "1Min",
  "5min": "5Min",
  "15min": "15Min",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const entryTime = searchParams.get("entry_time");
  const exitTime = searchParams.get("exit_time");
  const rawInterval = searchParams.get("interval") || "5min";

  if (!entryTime || !exitTime) {
    return NextResponse.json(
      { error: "entry_time and exit_time required (unix milliseconds)" },
      { status: 400 },
    );
  }

  const apiKeyId = process.env.ALPACA_API_KEY;
  const apiSecretKey = process.env.ALPACA_SECRET_KEY;
  if (!apiKeyId || !apiSecretKey) {
    return NextResponse.json(
      { error: "ALPACA_API_KEY and ALPACA_SECRET_KEY not configured" },
      { status: 500 },
    );
  }

  const timeframe = INTERVAL_MAP[rawInterval] || "5Min";

  const paddingMs = 2 * 60 * 60 * 1000;
  const start = new Date(Number(entryTime) - paddingMs).toISOString();
  const end = new Date(Number(exitTime) + paddingMs).toISOString();

  const url = `${ALPACA_DATA_BASE_URL}/v2/stocks/${ticker}/bars?timeframe=${timeframe}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&feed=iex&sort=asc`;

  try {
    const response = await fetch(url, {
      headers: {
        "APCA-API-KEY-ID": apiKeyId,
        "APCA-API-SECRET-KEY": apiSecretKey,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        { error: `Alpaca returned ${response.status}: ${body}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const bars: AlpacaBar[] = data.bars ?? [];

    const candles = bars
      .map((bar) => ({
        time: millisecondsToSeconds(new Date(bar.t).getTime()),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
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
