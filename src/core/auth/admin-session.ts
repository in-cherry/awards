const ADMIN_SESSION_COOKIE = 'admin_session';

export type AdminSessionPayload = {
  tenantId: string;
  tenantSlug: string;
  userId: string;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_SESSION_SECRET is missing or too short');
  }
  return secret;
}

function toBase64Url(input: Buffer): string {
  return input.toString('base64url');
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

async function sign(payloadPart: string): Promise<string> {
  const { createHmac } = await import('crypto');
  return createHmac('sha256', getSessionSecret()).update(payloadPart).digest('base64url');
}

export async function createAdminSessionToken(payload: AdminSessionPayload): Promise<string> {
  const payloadPart = toBase64Url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const signature = await sign(payloadPart);
  return `${payloadPart}.${signature}`;
}

export async function verifyAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = await sign(payloadPart);
  if (signaturePart !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8')) as AdminSessionPayload;

    if (!payload.tenantId || !payload.tenantSlug || !payload.userId || !payload.exp) {
      return null;
    }

    if (Date.now() >= payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function readCookieFromHeader(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(';').map((item) => item.trim());
  const match = parts.find((item) => item.startsWith(`${cookieName}=`));
  if (!match) {
    return null;
  }

  const value = match.slice(cookieName.length + 1);
  return value.length > 0 ? decodeURIComponent(value) : null;
}

export async function getAdminSessionFromRequest(request: Request): Promise<AdminSessionPayload | null> {
  const cookieHeader = request.headers.get('cookie');
  const rawToken = readCookieFromHeader(cookieHeader, ADMIN_SESSION_COOKIE);
  if (!rawToken) {
    return null;
  }

  return verifyAdminSessionToken(rawToken);
}

export const adminSessionCookieName = ADMIN_SESSION_COOKIE;