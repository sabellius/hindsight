import { getAnalyticsData } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const days = params.range === "7" ? 7 : params.range === "all" ? 365 : 30;
  const data = await getAnalyticsData(days);

  return <AnalyticsCharts data={data} days={days} />;
}
