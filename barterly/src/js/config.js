// Environment config. Set <meta name="barterly-api-url"> in index.html (or window.__ENV__.API_URL)
// to point the app at a real backend; leave it empty to run on the built-in mock layer.
const meta = document.querySelector('meta[name="barterly-api-url"]')?.content?.trim();
const apiUrl = (meta || window.__ENV__?.API_URL || '').replace(/\/$/, '');

export const config = {
  API_URL: apiUrl,
  USE_MOCK: !apiUrl,
  MOCK_LATENCY: [260, 620],   // ms range simulated by the mock layer
};
