const CALLBACK_PATH = '/api/auth/mercadopago/callback';

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAppBaseUrl(): string {
  const rawUrl = getRequiredEnv('NEXT_PUBLIC_APP_URL').trim();

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_APP_URL: ${rawUrl}`);
  }

  const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  const isHttps = parsed.protocol === 'https:';

  if (!isLocalhost && !isHttps) {
    throw new Error('NEXT_PUBLIC_APP_URL must use HTTPS outside localhost');
  }

  return rawUrl.replace(/\/$/, '');
}

export function getMercadoPagoRedirectUri(): string {
  return `${getAppBaseUrl()}${CALLBACK_PATH}`;
}