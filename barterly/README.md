# Barterly

Mobile-first barter marketplace demo. Plain HTML/CSS/ES modules, no build step.

## Run
ES modules and the service worker need http, not file://. Double-click `start.bat`, or:

    python -m http.server 5600

then open http://localhost:5600. Demo login: `demo@barterly.com` / `Barterly123`.

## Layout
    index.html              shell
    manifest.webmanifest    PWA manifest      sw.js  service worker
    src/styles/             tokens (design system) · base · components · screens · motion
    src/js/
      main.js router.js store.js theme.js actions.js util.js icons.js config.js
      data/mock.js          all fake data lives here
      services/             api.js (single backend door) · auth · listings · chats · profile · db (mock persistence)
      components/           ui · sheet · toast · fx (confetti) · tabbar · flows · listing-list · verify
      pages/                auth · home · explore · detail · post · chats · thread · profile

## Going live
1. Set `<meta name="barterly-api-url" content="https://api.example.com">` in index.html (or `window.__ENV__.API_URL`).
2. Each service method already declares its `method` + `path` for `request()` in `services/api.js`; with an API URL set it calls `fetch` with the bearer token and maps errors to `ApiError`. The `mock:` callbacks can then be deleted.
3. Before launch: real password hashing/auth server-side, real ID verification (Smile ID / Dojah), real image hosting.
