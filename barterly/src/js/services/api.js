// Single door to the backend. Every service goes through request():
//   - mock mode  -> runs the `mock` callback after a simulated delay
//   - live mode  -> fetch(API_URL + path) with the bearer token
// Errors always surface as ApiError so screens handle one shape.
import { config } from '../config.js';
import { read, rand, sleep } from '../util.js';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'error', field = null } = {}) {
    super(message);
    this.status = status; this.code = code; this.field = field;
  }
}

export const getToken = () => read('barterly:session', null)?.token || null;

export async function request({ mock, method = 'GET', path = '', body, latency = true }) {
  if (config.USE_MOCK) {
    if (latency) await sleep(rand(...config.MOCK_LATENCY));
    return mock();
  }
  try {
    const token = getToken();
    const res = await fetch(config.API_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new ApiError(data.message || 'Something went wrong. Please try again.', { status: res.status, code: data.code, field: data.field });
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(navigator.onLine ? 'We could not reach the server.' : 'You are offline.', { code: 'network' });
  }
}
