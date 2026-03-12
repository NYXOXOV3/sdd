import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// in‑process cache used for rate limiting. resets on cold start in serverless
// environments, but works per‑instance on any Node.js server.
interface RateLimitEntry {
  count: number;
  startTime: number;
}

const rateLimit = new Map<string, RateLimitEntry>();

const REQUEST_LIMIT = 150;           // max requests per window
const WINDOW_MS = 60 * 1000;          // 1‑minute rolling window

function getClientIp(request: NextRequest): string {
  // prefer x-forwarded-for header, fall back to loopback
  const header = request.headers.get('x-forwarded-for');
  let ip = header?.split(',')[0].trim() ?? '127.0.0.1';
  return ip === '::1' ? '127.0.0.1' : ip;
}

export function proxy(request: NextRequest) {
  // only rate‑limit API endpoints; let assets and pages through
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);

  let entry = rateLimit.get(ip);
  const now = Date.now();

  if (!entry) {
    entry = { count: 0, startTime: now };
    rateLimit.set(ip, entry);
  }

  // roll window if expired
  if (now - entry.startTime > WINDOW_MS) {
    entry.count = 0;
    entry.startTime = now;
  }

  entry.count += 1;

  if (entry.count > REQUEST_LIMIT) {
    const body = JSON.stringify({
      success: false,
      message: 'Too Many Requests',
      error: 'Terlalu banyak permintaan. Mohon tunggu sebentar.'
    });

    return new NextResponse(body, {
      status: 429,
      headers: { 'content-type': 'application/json' }
    });
  }

  return NextResponse.next();
}

// proxy applies to all sub‑paths of /api
export const config = {
  matcher: '/api/:path*',
};
