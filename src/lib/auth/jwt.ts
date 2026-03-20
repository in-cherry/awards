import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_secret_key_for_development"
);

const COOKIE_NAME = "auth_token";
const CLIENT_COOKIE_NAME = "client_auth_token";
const ACTIVE_TENANT_COOKIE_NAME = "active_tenant";
const TOKEN_EXPIRATION = "7d";

export type JWTPayload = {
  userId: string;
  email: string;
  type: "user" | "client";
  tenantId?: string;
};

export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as JWTPayload;
  } catch {
    return null;
  }
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getActiveTenantCookieName(): string {
  return ACTIVE_TENANT_COOKIE_NAME;
}

export function getClientCookieName(): string {
  return CLIENT_COOKIE_NAME;
}