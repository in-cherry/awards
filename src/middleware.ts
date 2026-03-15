import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";

  const domain = "incherry.com.br";

  if (host.endsWith(domain)) {
    const subdomain = host.replace(`.${domain}`, "");

    if (subdomain && subdomain !== "www") {
      const url = req.nextUrl.clone();
      url.pathname = `/${subdomain}${url.pathname}`;

      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}