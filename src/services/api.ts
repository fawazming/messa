import { DEFAULT_API_BASE_URL } from '@/constants/config';
import { getSetting, setSetting } from '@/db/database';

const TOKEN_KEY = 'api_token';
const BASE_KEY = 'api_base_url';

let memoryToken: string | null = null;
let memoryBase: string | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getApiToken(): Promise<string | null> {
  if (memoryToken !== null) return memoryToken || null;
  const value = await getSetting(TOKEN_KEY);
  memoryToken = value ?? '';
  return value;
}

export async function setApiToken(token: string | null): Promise<void> {
  memoryToken = token ?? '';
  await setSetting(TOKEN_KEY, token);
}

export async function getApiBaseUrl(): Promise<string> {
  if (memoryBase) return memoryBase;
  const value = await getSetting(BASE_KEY);
  memoryBase = value && value.trim() ? value.trim() : DEFAULT_API_BASE_URL;
  return memoryBase;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  const normalized = url.trim().replace(/\/+$/, '') || DEFAULT_API_BASE_URL;
  memoryBase = normalized;
  await setSetting(BASE_KEY, normalized);
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const base = (await getApiBaseUrl()).replace(/\/+$/, '');

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getApiToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach the MESSA server. Check your internet connection.", 0);
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // Non-JSON response (e.g. HTML error page).
  }

  const payload = json as { ok?: boolean; error?: string } | null;
  if (!response.ok || payload?.ok === false) {
    throw new ApiError(payload?.error || `Request failed (${response.status}).`, response.status);
  }

  return json as T;
}
