const IBKR_GATEWAY_URL = process.env.IBKR_GATEWAY_URL ?? "https://localhost:5000";

async function ibkrFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${IBKR_GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`IBKR API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function checkConnection(): Promise<{
  connected: boolean;
  authenticated: boolean;
  accountId?: string;
}> {
  try {
    const authStatus = await ibkrFetch("/iserver/auth/status");
    return {
      connected: true,
      authenticated: authStatus.authenticated ?? false,
      accountId: authStatus?.accountId,
    };
  } catch {
    return { connected: false, authenticated: false };
  }
}

export async function getOpenTrades() {
  const data = await ibkrFetch("/iserver/account/trades");
  return data ?? [];
}

export async function getPositions(accountId: string) {
  const data = await ibkrFetch(`/portfolio/${accountId}/positions`);
  return data ?? [];
}

export async function getOrders() {
  const data = await ibkrFetch("/iserver/account/orders");
  return data ?? [];
}
