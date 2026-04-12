import { NextResponse } from "next/server";

export function jsonNoStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return jsonNoStore(
    {
      success: false,
      error: message,
      ...(extra || {}),
    },
    status,
  );
}
