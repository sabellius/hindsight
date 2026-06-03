import { getAnalyticsData } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { getActiveAccountId } from "@/lib/auth";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const days = params.range === "7" ? 7 : params.range === "all" ? 365 : 30;
  const accountId = await getActiveAccountId();
  const data = await getAnalyticsData(days, accountId);

  return <AnalyticsCharts data={data} days={days} />;
}
