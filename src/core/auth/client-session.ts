const CLIENT_SESSION_COOKIE = 'client_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type ClientSessionPayload = {
  tenantId: string;
  tenantSlug: string;
  cpf: string;
  exp: number;
};

function getClientSessionSecret(): string {
  const secret = process.env.CLIENT_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('CLIENT_SESSION_SECRET is missing or too short');
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
  return createHmac('sha256', getClientSessionSecret()).update(payloadPart).digest('base64url');
}

export async function createClientSessionToken(payload: Omit<ClientSessionPayload, 'exp'>): Promise<string> {
  const completePayload: ClientSessionPayload = {
    ...payload,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadPart = toBase64Url(Buffer.from(JSON.stringify(completePayload), 'utf8'));
  const signature = await sign(payloadPart);
  return `${payloadPart}.${signature}`;
}

export async function verifyClientSessionToken(token: string): Promise<ClientSessionPayload | null> {
  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = await sign(payloadPart);
  if (signaturePart !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadPart).toString('utf8')) as ClientSessionPayload;

    if (!payload.tenantId || !payload.tenantSlug || !payload.cpf || !payload.exp) {
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

export const clientSessionCookieName = CLIENT_SESSION_COOKIE;