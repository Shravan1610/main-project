import { createClient } from "npm:@supabase/supabase-js@2";

type InputType = "document" | "url" | "webpage";

type Claim = {
  text: string;
  type: string;
  category: string;
  confidence: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const ESG_MODEL_URL = Deno.env.get("ESG_MODEL_URL") ?? "https://greenverify-api.onrender.com";
const NLP_MODEL_URL = Deno.env.get("NLP_MODEL_URL") ?? "https://greenverifynlp-api.onrender.com";
const GEMINI_API_KEY = Deno.env.get("GOOGLE_AI_STUDIO_API_KEY") ?? "";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-3.1-flash-lite";

const CLAIM_PATTERNS: Record<string, string[]> = {
  carbon: ["carbon neutral", "net zero", "carbon offset", "scope 1", "scope 2", "scope 3", "ghg emissions"],
  renewable: ["100% renewable", "renewable energy", "solar", "wind", "clean energy"],
  waste: ["zero waste", "plastic-free", "circular economy", "recycling", "waste reduction"],
  diversity: ["gender parity", "women in leadership", "inclusive", "equity", "diversity"],
  water: ["water neutral", "reduce water", "water usage", "water stewardship"],
  certifications: ["iso 14001", "b corp", "leed", "gri", "cdp", "science based targets"],
};

const GREENWASH_PHRASES = [
  "committed to being 100% sustainable",
  "eco-friendly",
  "carbon neutral",
  "net zero",
  "green energy leader",
  "industry-leading sustainability",
  "best-in-class esg",
  "world-class environmental",
  "fully sustainable",
  "zero environmental impact",
  "completely green",
  "100% clean energy",
];

const VAGUE_CLAIM_PATTERNS = [
  /significantly\s+(?:reduc|improv|lower)/gi,
  /substantially\s+(?:reduc|improv|lower|better)/gi,
  /committed\s+to\s+(?:a\s+)?sustainable/gi,
  /striving\s+(?:for|to|towards)/gi,
  /working\s+towards?\s+(?:a\s+)?(?:greener|sustainable|better)/gi,
  /dedicated\s+to\s+(?:protect|preserv|sustain)/gi,
  /passionate\s+about\s+(?:the\s+)?environment/gi,
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseHtml(content: string) {
  const metaMatch = content.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const withoutBlockedTags = content
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ");

  const stripped = withoutBlockedTags
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  return normalizeWhitespace(`${metaMatch?.[1] ?? ""} ${stripped}`);
}

function validateUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported");
  }

  const hostname = parsed.hostname.toLowerCase();
  const privateHostPattern = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|::1$)/;
  if (privateHostPattern.test(hostname) || hostname.endsWith(".local")) {
    throw new Error("Private or local URLs are not allowed");
  }
}

async function scrapeUrl(rawUrl: string) {
  validateUrl(rawUrl);
  const response = await fetch(rawUrl, {
    redirect: "follow",
    headers: { "User-Agent": "GreenTrust-DocumentAnalyzer/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Failed to scrape URL: ${response.status}`);
  }
  const html = await response.text();
  return parseHtml(html);
}

function classifyClaim(sentence: string) {
  const lowered = sentence.toLowerCase();
  if (/\b\d+(?:\.\d+)?\s?(?:%|percent|tonnes|tons|kg|kwh|mwh|co2)\b/.test(lowered)) {
    return { type: "metric", confidence: 0.9 };
  }
  if (["certified", "awarded", "accredited", "verified"].some((item) => lowered.includes(item))) {
    return { type: "certification", confidence: 0.85 };
  }
  if ([" by ", "will", "plan", "target", "commit", "pledge", "roadmap", "goal"].some((item) => lowered.includes(item))) {
    return { type: "commitment", confidence: 0.8 };
  }
  return { type: "assertion", confidence: 0.75 };
}

function extractClaims(text: string): Claim[] {
  const sentences = text.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean);
  const claims: Claim[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    const lowered = sentence.toLowerCase();
    for (const [category, patterns] of Object.entries(CLAIM_PATTERNS)) {
      if (!patterns.some((pattern) => lowered.includes(pattern))) continue;
      const key = `${category}:${lowered}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const classification = classifyClaim(sentence);
      claims.push({
        text: sentence,
        type: classification.type,
        category,
        confidence: classification.confidence,
      });
    }
  }

  return claims.slice(0, 40);
}

function fallbackExtract(text: string) {
  const emails = Array.from(new Set(text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [])).slice(0, 10);
  const urls = Array.from(new Set(text.match(/https?:\/\/[^\s)]+/g) ?? [])).slice(0, 10);
  const dates = Array.from(new Set(text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [])).slice(0, 10);
  const organizations = Array.from(new Set(text.match(/\b[A-Z][A-Za-z0-9&.-]{2,}(?:\s+[A-Z][A-Za-z0-9&.-]{2,})*\b/g) ?? [])).slice(0, 10);

  return {
    entities: {
      emails,
      urls,
      dates,
      organizations,
    },
    summary: text.slice(0, 450).trim(),
  };
}

async function summarizeWithGemini(text: string, claims: Claim[]) {
  if (!GEMINI_API_KEY || !text.trim()) return null;

  const prompt = [
    "Analyze the following ESG-related content.",
    "Return ONLY valid JSON with this shape:",
    '{"summary":"string","entities":{"organizations":["string"],"locations":["string"],"certifications":["string"]}}',
    "Keep the summary under 280 characters and factual.",
    "Claims already detected:",
    JSON.stringify(claims.slice(0, 8)),
    "Content:",
    text.slice(0, 12000),
  ].join("\n");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof rawText !== "string") return null;

  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(rawText.slice(start, end + 1));
  } catch {
    return null;
  }
}

function findNumberNear(text: string, keywords: string[], fallback: number) {
  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escaped}[\\s:=\\-–—]*\\$?\\s*(\\d[\\d,]*\\.?\\d*)`, "i");
    const match = text.match(pattern);
    if (match?.[1]) {
      return Number(match[1].replace(/,/g, "")) || fallback;
    }
  }
  return fallback;
}

function extractMetrics(text: string) {
  const normalized = text.toLowerCase();
  return {
    gdp: findNumberNear(normalized, ["revenue", "gdp", "turnover", "total revenue", "annual revenue"], 1000),
    population: findNumberNear(normalized, ["employees", "workforce", "headcount", "staff", "personnel"], 50000),
    coal_consumption: findNumberNear(normalized, ["coal consumption", "coal usage", "coal energy", "coal"], 30),
    gas_consumption: findNumberNear(normalized, ["gas consumption", "natural gas", "gas usage"], 40),
    oil_consumption: findNumberNear(normalized, ["oil consumption", "petroleum", "oil usage", "crude oil"], 35),
    renewables_consumption: findNumberNear(normalized, ["renewable consumption", "renewable energy", "renewables", "clean energy"], 20),
    solar_consumption: findNumberNear(normalized, ["solar consumption", "solar energy", "solar power", "solar capacity"], 5),
    wind_consumption: findNumberNear(normalized, ["wind consumption", "wind energy", "wind power", "wind capacity"], 5),
    hydro_consumption: findNumberNear(normalized, ["hydro consumption", "hydroelectric", "hydro energy", "hydropower"], 8),
  };
}

function detectGreenwashing(text: string) {
  const lowered = text.toLowerCase();
  const suspicious: string[] = [];
  const sentences = text.split(/[.!?]\s+/).map((item) => item.trim()).filter(Boolean);

  for (const phrase of GREENWASH_PHRASES) {
    if (!lowered.includes(phrase)) continue;
    const sentence = sentences.find((item) => item.toLowerCase().includes(phrase));
    if (sentence && !suspicious.includes(sentence)) suspicious.push(sentence.slice(0, 200));
  }

  let vagueCount = 0;
  for (const pattern of VAGUE_CLAIM_PATTERNS) {
    const matches = lowered.match(pattern) ?? [];
    vagueCount += matches.length;
  }

  const specificCount = (lowered.match(/\d+\.?\d*\s*(?:%|percent|tonnes?|tons?|mw|gw|kwh|mwh|twh|co2|million|billion)/g) ?? []).length;
  const total = suspicious.length + vagueCount + specificCount;
  const probability = total === 0 ? 0.1 : Math.min(0.95, ((suspicious.length + vagueCount) / Math.max(total, 1)) * 0.8 + 0.05);

  return {
    probability: Number(probability.toFixed(3)),
    suspicious_statements: suspicious.slice(0, 10),
  };
}

async function fetchJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function fetchEsgScores(subject: string) {
  try {
    const data = await fetchJson(`${ESG_MODEL_URL.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: subject }),
    });

    const overall = Number(data?.overall_score ?? data?.score ?? 55);
    const scores = data?.scores ?? {};
    return {
      entity_id: subject.toUpperCase() || "UNKNOWN",
      overall_score: Math.max(0, Math.min(100, overall)),
      scores: {
        environmental: Number(scores?.environmental ?? overall),
        social: Number(scores?.social ?? overall),
        governance: Number(scores?.governance ?? overall),
      },
      raw_response: data,
    };
  } catch {
    return {
      entity_id: subject.toUpperCase() || "UNKNOWN",
      overall_score: 55,
      scores: { environmental: 55, social: 55, governance: 55 },
      raw_response: { source: "fallback" },
    };
  }
}

async function callEsgModel(metrics: Record<string, number>) {
  try {
    return await fetchJson(`${ESG_MODEL_URL.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metrics),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "ESG unavailable", status: "unavailable" };
  }
}

async function callNlpModel(metrics: Record<string, number>) {
  try {
    return await fetchJson(`${NLP_MODEL_URL.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metrics),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "NLP unavailable", status: "unavailable" };
  }
}

function deriveSubject(text: string) {
  const token = text.split(/\s+/).find((item) => /^[A-Za-z][A-Za-z0-9&.-]{2,}$/.test(item.replace(/[,.()[\]{}]/g, "")));
  return token?.replace(/[,.()[\]{}]/g, "") ?? "Document";
}

function computeAnalytics(analysisEngine: string, esgResp: Record<string, unknown>, nlpResp: Record<string, unknown>, greenwash: { probability: number; suspicious_statements: string[] }, metrics: Record<string, number>) {
  let esgScore = Number((esgResp.risk_score ?? esgResp.score ?? esgResp.prediction_score) ?? NaN);
  if (!Number.isFinite(esgScore)) {
    const fossil = metrics.coal_consumption + metrics.gas_consumption + metrics.oil_consumption;
    const renew = metrics.renewables_consumption + metrics.solar_consumption + metrics.wind_consumption + metrics.hydro_consumption;
    esgScore = Number((((fossil / Math.max(fossil + renew, 1)) * 100) || 50).toFixed(1));
  } else if (esgScore <= 1) {
    esgScore *= 100;
  }

  let esgRiskLevel = String(esgResp.prediction ?? esgResp.risk_level ?? esgResp.label ?? "N/A");
  if (esgRiskLevel === "N/A") {
    esgRiskLevel = esgScore < 30 ? "Low Risk" : esgScore < 60 ? "Medium Risk" : "High Risk";
  }

  let esgConfidence = Number((esgResp.confidence ?? esgResp.probability) ?? NaN);
  if (!Number.isFinite(esgConfidence)) {
    esgConfidence = "error" in esgResp ? 0.5 : 0.75;
  } else if (esgConfidence > 1) {
    esgConfidence /= 100;
  }

  let climateCredibility = 0.5;
  const nlpScore = Number((nlpResp.risk_score ?? nlpResp.score ?? nlpResp.prediction_score) ?? NaN);
  if (Number.isFinite(nlpScore)) {
    const adjusted = nlpScore <= 1 ? nlpScore * 100 : nlpScore;
    climateCredibility = Number(((100 - adjusted) / 100).toFixed(3));
  }

  const fossil = metrics.coal_consumption + metrics.gas_consumption + metrics.oil_consumption;
  const renew = metrics.renewables_consumption + metrics.solar_consumption + metrics.wind_consumption + metrics.hydro_consumption;
  const carbonExposure = Number((((fossil / Math.max(fossil + renew, 1)) * 100) || 50).toFixed(1));
  const environmentalRisk = Number((esgScore * 0.6 + carbonExposure * 0.4).toFixed(1));
  const governanceRisk = Number((greenwash.probability * 80 + (1 - esgConfidence) * 20).toFixed(1));

  const verificationStatus =
    "error" in esgResp && "error" in nlpResp
      ? "unavailable"
      : greenwash.probability > 0.6
        ? "flagged"
        : "verified";

  return {
    analysisEngine,
    esgRiskScore: Number(esgScore.toFixed(1)),
    esgRiskLevel,
    aiConfidence: Number(esgConfidence.toFixed(3)),
    greenwashingProbability: Number(greenwash.probability.toFixed(3)),
    climateClaimCredibility: Number(climateCredibility.toFixed(3)),
    suspiciousStatements: greenwash.suspicious_statements,
    riskBreakdown: {
      environmentalRisk,
      governanceRisk,
      carbonExposure,
      greenwashingRisk: Number((greenwash.probability * 100).toFixed(1)),
    },
    esgModelResponse: esgResp,
    nlpModelResponse: nlpResp,
    verificationStatus,
    extractedMetrics: metrics,
  };
}

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function persistRun(result: Record<string, unknown>, text: string) {
  const { data, error } = await supabaseAdmin
    .from("document_analyzer_runs")
    .insert({
      input_type: result.inputType,
      analysis_engine: result.analysisEngine,
      model_status: result.modelStatus,
      source: result.source ?? {},
      content_length: result.contentLength ?? 0,
      content_preview: text.slice(0, 2000),
      extraction: result.extraction ?? {},
      claims: result.claims ?? [],
      esg: result.esg ?? null,
      ai_analytics: result.aiAnalytics ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { status: "error", id: null, message: error.message };
  }

  return { status: "stored", id: data?.id ?? null };
}

async function resolveText(inputType: InputType, body: Record<string, unknown>) {
  if (inputType === "document") {
    return normalizeWhitespace(String(body.text ?? ""));
  }
  if (inputType === "url") {
    return scrapeUrl(String(body.url ?? ""));
  }
  return parseHtml(String(body.webpage ?? ""));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ detail: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json();
    const inputType = String(body.inputType ?? "").toLowerCase() as InputType;
    if (!["document", "url", "webpage"].includes(inputType)) {
      return jsonResponse({ detail: "inputType must be one of document, url, webpage" }, 400);
    }

    const text = await resolveText(inputType, body);
    const analysisEngine = inputType === "document" ? "nlp+esg" : "esg";

    if (!text) {
      return jsonResponse({
        analysisEngine,
        inputType,
        contentLength: 0,
        esg: null,
        esk: null,
        extraction: { entities: {}, summary: "" },
        claims: [],
        modelStatus: "empty_input",
        source: { url: body.url ?? null },
        storage: { status: "not_stored", id: null },
        aiAnalytics: null,
      });
    }

    const claims = extractClaims(text);
    const heuristicExtraction = fallbackExtract(text);
    const geminiExtraction = await summarizeWithGemini(text, claims);
    const extraction = {
      ...heuristicExtraction,
      summary: typeof geminiExtraction?.summary === "string" ? geminiExtraction.summary : heuristicExtraction.summary,
      entities: {
        ...(heuristicExtraction.entities ?? {}),
        ...(geminiExtraction?.entities ?? {}),
      },
    };

    const subject = deriveSubject(text);
    const esg = await fetchEsgScores(subject);
    const metrics = extractMetrics(text);
    const greenwash = detectGreenwashing(text);

    let esgModelResponse: Record<string, unknown>;
    let nlpModelResponse: Record<string, unknown>;
    let modelStatus: string;

    if (inputType === "document") {
      nlpModelResponse = await callNlpModel(metrics) as Record<string, unknown>;
      esgModelResponse = await callEsgModel(metrics) as Record<string, unknown>;
      modelStatus =
        "error" in nlpModelResponse && "error" in esgModelResponse
          ? "nlp_and_esg_unavailable"
          : "error" in nlpModelResponse || "error" in esgModelResponse
            ? "partial_document_analysis"
            : "nlp_and_esg_loaded";
    } else {
      esgModelResponse = await callEsgModel(metrics) as Record<string, unknown>;
      nlpModelResponse = { status: "skipped", reason: "web_inputs_use_esg_model" };
      modelStatus = "error" in esgModelResponse ? "esg_model_unavailable" : "esg_model_loaded";
    }

    const aiAnalytics = computeAnalytics(analysisEngine, esgModelResponse, nlpModelResponse, greenwash, metrics);
    const result: Record<string, unknown> = {
      analysisEngine,
      inputType,
      contentLength: text.length,
      esg,
      esk: esg,
      extraction,
      claims,
      modelStatus,
      source: { url: body.url ?? null },
      aiAnalytics,
    };

    result.storage = await persistRun(result, text);
    return jsonResponse(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ detail: message }, 500);
  }
});
