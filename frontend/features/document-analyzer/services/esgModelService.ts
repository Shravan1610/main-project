import { API_BASE_URL } from "@/shared/constants";

export type ESGFeatures = {
  gdp: number;
  population: number;
  coal_consumption: number;
  gas_consumption: number;
  oil_consumption: number;
  renewables_consumption: number;
  solar_consumption: number;
  wind_consumption: number;
  hydro_consumption: number;
};

export type ESGModelResponse = {
  prediction?: string | number;
  risk_score?: number;
  score?: number;
  confidence?: number;
  risk_level?: string;
  label?: string;
  error?: string;
  status?: string;
};

const ESG_MODEL_URL = "https://greenverify-api.onrender.com";

export async function checkEsgModelHealth(): Promise<boolean> {
  try {
    const res = await fetch(ESG_MODEL_URL, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function predictEsgRisk(features: ESGFeatures): Promise<ESGModelResponse> {
  const res = await fetch(`${ESG_MODEL_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(features),
  });

  if (!res.ok) {
    throw new Error(`ESG model request failed: ${res.status}`);
  }

  return res.json() as Promise<ESGModelResponse>;
}
