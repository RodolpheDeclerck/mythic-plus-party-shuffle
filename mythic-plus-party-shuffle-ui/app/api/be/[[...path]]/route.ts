import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@auth0/nextjs-auth0';

/** Node runtime so `Headers#getSetCookie()` is available (multiple Set-Cookie). */
export const runtime = 'nodejs';

const FORWARD_REQUEST_HEADERS = [
  'content-type',
  'accept',
  'accept-language',
] as const;

function backendBase(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.REACT_APP_API_URL ||
    'http://localhost:8080'
  ).replace(/\/$/, '');
}

function buildUpstreamUrl(
  pathSegments: string[] | undefined,
  search: string,
): string {
  const base = backendBase();
  const pathPart = pathSegments?.length
    ? pathSegments.map((s) => encodeURIComponent(s)).join('/')
    : '';
  const pathSuffix = pathPart ? `/${pathPart}` : '';
  return `${base}${pathSuffix}${search}`;
}

async function buildForwardHeaders(request: NextRequest): Promise<Headers> {
  const out = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const v = request.headers.get(name);
    if (v) {
      out.set(name, v);
    }
  }

  // Inject Auth0 access token as Bearer header
  try {
    const { accessToken } = await getAccessToken();
    if (accessToken) {
      out.set('Authorization', `Bearer ${accessToken}`);
    }
  } catch {
    // Not authenticated — forward without token
  }

  return out;
}

async function proxy(
  request: NextRequest,
  pathSegments: string[] | undefined,
  method: string,
): Promise<NextResponse> {
  const url = buildUpstreamUrl(pathSegments, request.nextUrl.search);
  const forwardHeaders = await buildForwardHeaders(request);

  const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  const init: RequestInit = {
    method,
    headers: forwardHeaders,
    redirect: 'manual',
  };

  if (hasBody) {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) {
      init.body = buf;
    }
  }

  const upstream = await fetch(url, init);
  const body = method === 'HEAD' ? null : await upstream.arrayBuffer();

  const res = new NextResponse(body, { status: upstream.status });

  const ct = upstream.headers.get('content-type');
  if (ct) {
    res.headers.set('Content-Type', ct);
  }

  const cacheControl = upstream.headers.get('cache-control');
  if (cacheControl) {
    res.headers.set('Cache-Control', cacheControl);
  }

  return res;
}

type RouteParams = { params: { path?: string[] } };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return proxy(request, params.path, 'GET');
}

export async function HEAD(request: NextRequest, { params }: RouteParams) {
  return proxy(request, params.path, 'HEAD');
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return proxy(request, params.path, 'POST');
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return proxy(request, params.path, 'PUT');
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return proxy(request, params.path, 'PATCH');
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return proxy(request, params.path, 'DELETE');
}

export async function OPTIONS(request: NextRequest, { params }: RouteParams) {
  return proxy(request, params.path, 'OPTIONS');
}
