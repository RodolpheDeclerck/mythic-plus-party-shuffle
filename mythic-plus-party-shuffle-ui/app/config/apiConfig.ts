// REST base URL and Socket.IO origin.
// next.config.js maps REACT_APP_API_URL into NEXT_PUBLIC_API_URL (CRA parity).
// Browser (client): same-origin /api/be → BFF (app/api/be/[[...path]]/route.ts) → Nest (BACKEND_URL / NEXT_PUBLIC_*).
// Server (RSC, etc.): direct backend origin via serverBackend().
// Socket.IO: always getSocketUrl() (not proxied).

function serverBackend(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    'http://localhost:8080'
  ).replace(/\/$/, '');
}

function computeRestBase(): string {
  if (typeof window === 'undefined') {
    return serverBackend();
  }
  return '/api/be';
}

const apiUrl = computeRestBase();

if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  serverBackend().includes('localhost')
) {
  // eslint-disable-next-line no-console
  console.error(
    '[mythic-plus] Production API URL resolves to localhost. Set NEXT_PUBLIC_API_URL or REACT_APP_API_URL before `next build`.',
  );
}

export default apiUrl;

/** Real API origin for Socket.IO (not proxied). */
export function getSocketUrl(): string {
  return serverBackend();
}
