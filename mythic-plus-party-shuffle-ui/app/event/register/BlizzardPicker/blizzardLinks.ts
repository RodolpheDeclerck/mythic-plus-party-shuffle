/**
 * Auth0 entry points for login and Battle.net linking.
 *
 * NOTE: the exact Connected Accounts (Token Vault) enrollment URL/params are
 * pending Auth0 dashboard setup (OpenSpec task 1.3). Until confirmed, linking
 * reuses the standard login route with the Battle.net connection, which is the
 * best-effort default; adjust `buildLinkBattlenetUrl` once 1.3 is settled.
 */

const BATTLENET_CONNECTION = 'battlenet';

export function buildLoginUrl(returnTo: string): string {
  return `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function buildLinkBattlenetUrl(returnTo: string): string {
  return (
    `/api/auth/login?connection=${BATTLENET_CONNECTION}` +
    `&returnTo=${encodeURIComponent(returnTo)}`
  );
}
