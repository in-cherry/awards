import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const domain = host.split(".").slice(-2).join(".");
  const reservedSubdomains = [
    "www", "api", "admin", "mail", "ftp", "dev", "staging", "test", "beta", "alpha", "demo",
    "support", "help", "blog", "shop", "dashboard", "portal", "app", "client", "server",
    "static", "cdn", "assets", "media", "images", "videos", "docs", "wiki", "forum",
    "community", "news", "events", "careers", "about", "contact"
  ];

  if (host.endsWith(domain)) {
    const subdomain = host.replace(`.${domain}`, "");

    if (!reservedSubdomains.includes(subdomain)) {
      const url = req.nextUrl.clone();
      url.pathname = `/${subdomain}${pathname}`;

      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}