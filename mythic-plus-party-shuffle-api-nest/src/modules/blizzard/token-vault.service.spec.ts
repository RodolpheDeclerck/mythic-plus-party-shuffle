import { TokenVaultService } from './token-vault.service';
import { BattlenetNotLinkedException } from './errors';

function createConfig(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    'auth.issuerBaseUrl': 'https://tenant.auth0.com/',
    'tokenVault.clientId': 'client-id',
    'tokenVault.clientSecret': 'client-secret',
    'tokenVault.connection': 'battlenet',
    ...overrides,
  };
  return { get: jest.fn((key: string) => values[key]) };
}

function okResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function errorResponse(status: number, body: unknown) {
  return {
    ok: false,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('TokenVaultService', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    jest.restoreAllMocks();
  });

  describe('getBlizzardToken', () => {
    it('exchanges the Auth0 token and returns the Blizzard access token', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(okResponse({ access_token: 'blizz-token', expires_in: 3600 }));
      global.fetch = fetchMock as unknown as typeof fetch;
      const service = new TokenVaultService(createConfig() as any);

      const token = await service.getBlizzardToken('auth0-token', 1);

      expect(token).toBe('blizz-token');
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://tenant.auth0.com/oauth/token');
      const sent = (init.body as URLSearchParams);
      expect(sent.get('subject_token')).toBe('auth0-token');
      expect(sent.get('connection')).toBe('battlenet');
      expect(sent.get('grant_type')).toContain('federated-connection-access-token');
    });

    it('caches the token and does not call fetch again within its lifetime', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(okResponse({ access_token: 'cached', expires_in: 3600 }));
      global.fetch = fetchMock as unknown as typeof fetch;
      const service = new TokenVaultService(createConfig() as any);

      await service.getBlizzardToken('auth0-token', 42);
      await service.getBlizzardToken('auth0-token', 42);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('re-exchanges once the cached token has expired', async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValue(okResponse({ access_token: 'short', expires_in: 0 }));
      global.fetch = fetchMock as unknown as typeof fetch;
      const service = new TokenVaultService(createConfig() as any);

      await service.getBlizzardToken('auth0-token', 7);
      await service.getBlizzardToken('auth0-token', 7);

      // expires_in 0 → safety margin pushes expiry into the past → no cache hit
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('throws BattlenetNotLinkedException on a 403', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(errorResponse(403, { error: 'access_denied' })) as unknown as typeof fetch;
      const service = new TokenVaultService(createConfig() as any);

      await expect(service.getBlizzardToken('auth0-token', 1)).rejects.toBeInstanceOf(
        BattlenetNotLinkedException,
      );
    });

    it('throws BattlenetNotLinkedException on a not-linked error code', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(errorResponse(400, { error: 'invalid_grant' })) as unknown as typeof fetch;
      const service = new TokenVaultService(createConfig() as any);

      await expect(service.getBlizzardToken('auth0-token', 1)).rejects.toBeInstanceOf(
        BattlenetNotLinkedException,
      );
    });

    it('throws a generic error on other non-ok responses', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(errorResponse(500, { error: 'server_error' })) as unknown as typeof fetch;
      const service = new TokenVaultService(createConfig() as any);

      await expect(service.getBlizzardToken('auth0-token', 1)).rejects.toThrow(
        'Token exchange rejected',
      );
    });

    it('throws when the network request itself fails', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;
      const service = new TokenVaultService(createConfig() as any);

      await expect(service.getBlizzardToken('auth0-token', 1)).rejects.toThrow(
        'Token exchange request failed',
      );
    });

    it('throws when Token Vault is not configured', async () => {
      const service = new TokenVaultService(
        createConfig({ 'tokenVault.clientId': undefined }) as any,
      );

      await expect(service.getBlizzardToken('auth0-token', 1)).rejects.toThrow(
        'Token Vault is not configured',
      );
    });
  });
});
