import { Test } from '@nestjs/testing';
import { PasswordHashingService } from './password-hashing.service';
import { legacyDeriveHex } from '../../shared/crypto/legacy-password';

describe('PasswordHashingService', () => {
  let service: PasswordHashingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PasswordHashingService],
    }).compile();
    service = module.get(PasswordHashingService);
  });

  it('hashPassword returns Argon2id-encoded hash and empty salt placeholder', async () => {
    const { password, salt } = await service.hashPassword('myPassword123');
    expect(password.startsWith('$argon2')).toBe(true);
    expect(salt).toBe('');
  });

  it('verify succeeds for Argon2 hash without upgrade', async () => {
    const { password, salt } = await service.hashPassword('x');
    const r = await service.verify(password, salt, 'x');
    expect(r.valid).toBe(true);
    expect(r.upgrade).toBeUndefined();
  });

  it('verify rejects wrong password for Argon2', async () => {
    const { password, salt } = await service.hashPassword('x');
    const r = await service.verify(password, salt, 'y');
    expect(r.valid).toBe(false);
  });

  it('verify legacy hash and returns upgrade payload', async () => {
    const salt = 's';
    const hex = legacyDeriveHex(salt, 'pw');
    const r = await service.verify(hex, salt, 'pw');
    expect(r.valid).toBe(true);
    expect(r.upgrade?.password.startsWith('$argon2')).toBe(true);
    expect(r.upgrade?.salt).toBe('');
  });

  it('verify rejects wrong password for legacy', async () => {
    const salt = 's';
    const hex = legacyDeriveHex(salt, 'pw');
    const r = await service.verify(hex, salt, 'no');
    expect(r.valid).toBe(false);
  });
});
