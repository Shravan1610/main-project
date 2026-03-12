"use client";

import { useParams, useSearchParams } from "next/navigation";

import { MarketDetailView } from "@/features/market-charting/components";
import type { MarketAssetType } from "@/features/market-charting/types";

export default function MarketDetailPage() {
  const params = useParams<{ symbol: string }>();
  const searchParams = useSearchParams();
  const symbol = Array.isArray(params.symbol) ? params.symbol[0] : params.symbol;
  const assetType = searchParams.get("asset") as MarketAssetType | null;
  const exchange = searchParams.get("exchange");

  return (
    <MarketDetailView
      symbol={symbol ?? ""}
      assetType={assetType ?? undefined}
      exchange={exchange}
    />
  );
}
