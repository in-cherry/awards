import { NextResponse } from "next/server";
import { getClientCookieName } from "@/lib/auth/jwt";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: getClientCookieName(),
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
