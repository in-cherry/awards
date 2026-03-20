import type { JWTPayload } from "./jwt";
import { getClientCookieName, getCookieName, verifyToken } from "./jwt";
import { cookies } from "next/headers";

export async function getAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getCookieName())?.value;

    if (!token) return null;

    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Não autorizado");
  }
  return user;
}

export async function getClientAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getClientCookieName())?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || payload.type !== "client") return null;

    return payload;
  } catch {
    return null;
  }
}