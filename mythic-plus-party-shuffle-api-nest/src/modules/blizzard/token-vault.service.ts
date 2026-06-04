import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BattlenetNotLinkedException } from './errors';

const GRANT_TYPE =
  'urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token';
const SUBJECT_TOKEN_TYPE = 'urn:ietf:params:oauth:token-type:access_token';
const REQUESTED_TOKEN_TYPE =
  'http://auth0.com/oauth/token-type/federated-connection-access-token';

/** Auth0 error identifiers that mean "the user has not linked the connection". */
const NOT_LINKED_ERRORS = new Set([
  'invalid_grant',
  'requires_connection',
  'federated_connection_not_linked',
]);

/** Refresh the cached token this many ms before its real expiry. */
const EXPIRY_SAFETY_MARGIN_MS = 60_000;

interface CachedToken {
  token: string;
  expiresAt: number;
}

/**
 * Exchanges the user's Auth0 access token (already present on the incoming
 * request) for a federated Battle.net access token via Auth0 Token Vault.
 * Auth0 stores and refreshes the underlying Blizzard token; we never persist it.
 */
@Injectable()
export class TokenVaultService {
  private readonly logger = new Logger(TokenVaultService.name);
  private readonly cache = new Map<number, CachedToken>();

  constructor(private readonly config: ConfigService) {}

  /**
   * @param authToken The Auth0 access token from the request (used as subject_token).
   *                  Passed in so switching to a refresh-token exchange later is a
   *                  caller change, not a rewrite.
   * @param userId    Cache key — the local user id.
   */
  async getBlizzardToken(authToken: string, userId: number): Promise<string> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    const issuer = this.config.get<string>('auth.issuerBaseUrl');
    const clientId = this.config.get<string>('tokenVault.clientId');
    const clientSecret = this.config.get<string>('tokenVault.clientSecret');
    const connection = this.config.get<string>('tokenVault.connection');

    if (!issuer || !clientId || !clientSecret) {
      throw new InternalServerErrorException('Token Vault is not configured');
    }

    const body = new URLSearchParams({
      grant_type: GRANT_TYPE,
      client_id: clientId,
      client_secret: clientSecret,
      subject_token: authToken,
      subject_token_type: SUBJECT_TOKEN_TYPE,
      requested_token_type: REQUESTED_TOKEN_TYPE,
      connection,
    });

    // issuerBaseUrl is stored with a trailing slash (e.g. https://tenant.auth0.com/).
    const url = `${issuer.replace(/\/$/, '')}/oauth/token`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch (e) {
      this.logger.error(`Token Vault request failed: ${(e as Error).message}`);
      throw new InternalServerErrorException('Token exchange request failed');
    }

    if (!response.ok) {
      const errorBody = await this.safeJson(response);
      const errorCode =
        typeof errorBody?.error === 'string' ? errorBody.error : undefined;

      if (response.status === 403 || (errorCode && NOT_LINKED_ERRORS.has(errorCode))) {
        throw new BattlenetNotLinkedException();
      }

      this.logger.warn(
        `Token Vault exchange rejected (status ${response.status}, error ${errorCode ?? 'unknown'})`,
      );
      throw new InternalServerErrorException('Token exchange rejected');
    }

    const data = await this.safeJson(response);
    if (!data?.access_token) {
      throw new InternalServerErrorException('Token exchange returned no token');
    }

    const expiresInMs = (Number(data.expires_in) || 0) * 1000;
    this.cache.set(userId, {
      token: data.access_token,
      expiresAt: Date.now() + Math.max(0, expiresInMs - EXPIRY_SAFETY_MARGIN_MS),
    });

    return data.access_token;
  }

  private async safeJson(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
}
