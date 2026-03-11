export type ClimateInput = {
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

export type NLPModelResponse = {
  prediction?: string | number;
  risk_score?: number;
  score?: number;
  confidence?: number;
  risk_level?: string;
  label?: string;
  error?: string;
  status?: string;
};

const NLP_MODEL_URL = "https://greenverifynlp-api.onrender.com";

export async function checkNlpModelHealth(): Promise<boolean> {
  try {
    const res = await fetch(NLP_MODEL_URL, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function predictClimateRisk(input: ClimateInput): Promise<NLPModelResponse> {
  const res = await fetch(`${NLP_MODEL_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`NLP model request failed: ${res.status}`);
  }

  return res.json() as Promise<NLPModelResponse>;
}
