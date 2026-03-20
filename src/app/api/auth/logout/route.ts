import { getActiveTenantCookieName, getCookieName } from "@/lib/auth/jwt";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logout realizado com sucesso" }, { status: 200 });

  response.cookies.set({
    name: getCookieName(),
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  })

  response.cookies.set({
    name: getActiveTenantCookieName(),
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  })

  return response;
}