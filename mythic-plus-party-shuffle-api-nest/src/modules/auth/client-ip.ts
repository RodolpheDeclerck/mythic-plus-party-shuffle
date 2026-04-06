import { Request } from 'express';

/** Client IP for rate limiting; prefers X-Forwarded-For when trust proxy is enabled. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return sanitizeIpSegment(first);
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return sanitizeIpSegment(forwarded[0].split(',')[0].trim());
  }
  const ip = req.ip || req.socket?.remoteAddress;
  if (ip) return sanitizeIpSegment(ip);
  return 'unknown';
}

function sanitizeIpSegment(ip: string): string {
  return ip.replace(/[^0-9a-fA-F.:]/g, '_').slice(0, 128);
}
