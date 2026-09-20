import type { Env } from '../config/env.js';
import type {
  ApiEnvelope,
  ApiErrorKind,
  Category,
  CreateTransactionBody,
  LoginResponse,
  ParsedTransaction,
  PeriodSummary,
  Transaction,
} from '../types/api.js';

const TIMEZONE = 'America/Sao_Paulo';

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.kind = kind;
    this.status = status;
  }
}

let baseUrl = '';
let apiEmail = '';
let apiPassword = '';
let token: string | null = null;
let defaultCategoryId: string | null = null;

/** Format a Date as YYYY-MM-DD in America/Sao_Paulo. */
export function toLocalDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function todayLocal(): string {
  return toLocalDateString(new Date());
}

/** Shift a YYYY-MM-DD date by `days` (calendar days in local TZ approximation). */
export function shiftDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

export function currentMonthRange(): { from: string; to: string } {
  const today = todayLocal();
  const [y, m] = today.split('-').map(Number);
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  return { from, to: today };
}

async function login(): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: apiEmail, password: apiPassword }),
    });
  } catch (err) {
    throw new ApiClientError(
      'network',
      `Login request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!response.ok) {
    throw new ApiClientError('auth', `Login failed with status ${response.status}`, response.status);
  }

  const envelope = (await response.json()) as ApiEnvelope<LoginResponse>;
  if (!envelope.data?.token) {
    throw new ApiClientError('auth', 'Login response missing token');
  }

  token = envelope.data.token;
}

async function resolveDefaultCategory(): Promise<void> {
  const categories = await request<Category[]>('/categories');
  const other = categories.find((c) => c.name.toLowerCase() === 'other');
  if (!other) {
    throw new ApiClientError('http', 'Default category "Other" not found');
  }
  defaultCategoryId = other.id;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  if (!token) {
    await login();
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiClientError(
      'network',
      `Request to ${path} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (response.status === 401 && !retried) {
    await login();
    return request<T>(path, options, true);
  }

  if (!response.ok) {
    const kind: ApiErrorKind = response.status === 401 ? 'auth' : 'http';
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) detail = String(body.message);
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiClientError(kind, detail, response.status);
  }

  const envelope = (await response.json()) as ApiEnvelope<T>;
  return envelope.data;
}

export async function initApiClient(env: Env): Promise<void> {
  baseUrl = env.API_URL;
  apiEmail = env.API_EMAIL;
  apiPassword = env.API_PASSWORD;
  token = null;
  defaultCategoryId = null;

  await login();
  await resolveDefaultCategory();
  console.log('API client ready (authenticated, default category resolved)');
}

export async function createTransaction(parsed: ParsedTransaction): Promise<Transaction> {
  if (!defaultCategoryId) {
    throw new ApiClientError('http', 'Default category not initialized');
  }

  const body: CreateTransactionBody = {
    categoryId: defaultCategoryId,
    type: parsed.type,
    amount: parsed.amount,
    date: todayLocal(),
    note: parsed.description,
  };

  return request<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getTodayTransactions(): Promise<Transaction[]> {
  const today = todayLocal();
  const params = new URLSearchParams({ from: today, to: today });
  return request<Transaction[]>(`/transactions?${params}`);
}

export async function getRecentTransactions(days: number): Promise<Transaction[]> {
  const to = todayLocal();
  const from = shiftDate(to, -(days - 1));
  const params = new URLSearchParams({
    from,
    to,
    limit: '200',
  });
  return request<Transaction[]>(`/transactions?${params}`);
}

export async function getSummary(from?: string, to?: string): Promise<PeriodSummary> {
  const range = from && to ? { from, to } : currentMonthRange();
  const params = new URLSearchParams({ from: range.from, to: range.to });
  return request<PeriodSummary>(`/summary?${params}`);
}
