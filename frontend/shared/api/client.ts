import { API_BASE_URL } from "@/shared/constants";

type Primitive = string | number | boolean | null | undefined;
type QueryParams = Record<string, Primitive>;

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path: string, params?: QueryParams): string {
  const basePath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${basePath}`);

  if (!params) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function request<TResponse>(path: string, init?: RequestInit, params?: QueryParams): Promise<TResponse> {
  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (payload as { error?: { message?: string } } | null)?.error?.message ?? response.statusText;
    throw new ApiError(message || "Request failed", response.status, payload);
  }

  return payload as TResponse;
}

export const apiClient = {
  get<TResponse>(path: string, options?: { params?: QueryParams }) {
    return request<TResponse>(path, { method: "GET" }, options?.params);
  },
  post<TResponse, TBody = unknown>(path: string, body?: TBody) {
    return request<TResponse>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};
