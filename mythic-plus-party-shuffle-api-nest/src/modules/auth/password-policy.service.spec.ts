import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PasswordPolicyService } from './password-policy.service';

type FetchLike = typeof globalThis.fetch;

describe('PasswordPolicyService', () => {
  const realFetch = globalThis.fetch;

  function createService(overrides: Partial<Record<string, unknown>> = {}) {
    const config = {
      get: (key: string) => {
        const defaults: Record<string, unknown> = {
          'passwordPolicy.hibpCheck': false,
          'passwordPolicy.hibpTimeoutMs': 2000,
        };
        return overrides[key] ?? defaults[key];
      },
    } as unknown as ConfigService;
    return new PasswordPolicyService(config);
  }

  function mockFetch(impl: jest.Mock): jest.Mock {
    (globalThis as { fetch: FetchLike }).fetch = impl as unknown as FetchLike;
    return impl;
  }

  afterEach(() => {
    (globalThis as { fetch: FetchLike }).fetch = realFetch;
  });

  describe('validateSync', () => {
    it('accepts a compliant password', () => {
      const service = createService();
      expect(() => service.validateSync('Str0ngPassw0rd!')).not.toThrow();
    });

    it('rejects shorter than 10 chars', () => {
      const service = createService();
      expect(() => service.validateSync('Abc1!')).toThrow(BadRequestException);
    });

    it('rejects only 2 classes (lower + digit)', () => {
      const service = createService();
      expect(() => service.validateSync('password1234')).toThrow(BadRequestException);
    });

    it('accepts 3 classes without special char', () => {
      const service = createService();
      expect(() => service.validateSync('Azertyuiop9')).not.toThrow();
    });

    it('rejects common password even with 3 classes', () => {
      const service = createService();
      expect(() => service.validateSync('Password1!')).toThrow(BadRequestException);
    });

    it('rejects non-string input', () => {
      const service = createService();
      expect(() => service.validateSync(undefined as unknown as string)).toThrow(BadRequestException);
    });
  });

  describe('validate (async)', () => {
    it('passes sync checks and skips HIBP when disabled', async () => {
      const service = createService();
      const fetchMock = mockFetch(jest.fn());
      await expect(service.validate('Str0ngPassw0rd!')).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a password that HIBP reports as pwned', async () => {
      const service = createService({ 'passwordPolicy.hibpCheck': true });
      const plain = 'Str0ngPassw0rd!';
      const sha1 = createHash('sha1').update(plain).digest('hex').toUpperCase();
      const suffix = sha1.slice(5);
      const body = `${suffix}:42\nAAAAABBBBBCCCCCDDDDDEEEEEFFFFFGGGGG:0`;
      mockFetch(
        jest.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve(body),
        }),
      );
      await expect(service.validate(plain)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts a password that HIBP does not list', async () => {
      const service = createService({ 'passwordPolicy.hibpCheck': true });
      mockFetch(
        jest.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('0000000000000000000000000000000000A:1\n'),
        }),
      );
      await expect(service.validate('Str0ngPassw0rd!')).resolves.toBeUndefined();
    });

    it('fail-open on HIBP network error', async () => {
      const service = createService({ 'passwordPolicy.hibpCheck': true });
      mockFetch(jest.fn().mockRejectedValue(new Error('ECONNRESET')));
      await expect(service.validate('Str0ngPassw0rd!')).resolves.toBeUndefined();
    });

    it('fail-open on HIBP abort/timeout', async () => {
      const service = createService({ 'passwordPolicy.hibpCheck': true });
      const abortErr = new Error('aborted');
      abortErr.name = 'AbortError';
      mockFetch(jest.fn().mockRejectedValue(abortErr));
      await expect(service.validate('Str0ngPassw0rd!')).resolves.toBeUndefined();
    });

    it('fail-open on HIBP non-ok response', async () => {
      const service = createService({ 'passwordPolicy.hibpCheck': true });
      mockFetch(
        jest.fn().mockResolvedValue({
          ok: false,
          status: 503,
          text: () => Promise.resolve(''),
        }),
      );
      await expect(service.validate('Str0ngPassw0rd!')).resolves.toBeUndefined();
    });

    it('still rejects shorter passwords before HIBP', async () => {
      const service = createService({ 'passwordPolicy.hibpCheck': true });
      const fetchMock = mockFetch(jest.fn());
      await expect(service.validate('Abc1!')).rejects.toBeInstanceOf(BadRequestException);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
