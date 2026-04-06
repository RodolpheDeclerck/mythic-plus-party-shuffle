import { Request } from 'express';
import { getClientIp } from './client-ip';

function mockReq(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('getClientIp', () => {
  it('uses first X-Forwarded-For hop', () => {
    const req = mockReq({
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
      ip: '127.0.0.1',
    });
    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('falls back to req.ip', () => {
    const req = mockReq({
      headers: {},
      ip: '192.168.1.1',
      socket: { remoteAddress: '10.0.0.2' } as any,
    });
    expect(getClientIp(req)).toBe('192.168.1.1');
  });

  it('returns unknown when nothing is set', () => {
    const req = mockReq({ headers: {} });
    expect(getClientIp(req)).toBe('unknown');
  });
});
