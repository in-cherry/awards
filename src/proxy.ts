import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const host = req.headers.get("host")?.split(":")[0] || "";

  const isDevelopment = process.env.NODE_ENV === "development";
  const rootDomain = isDevelopment ? "localhost" : "seu-dominio-producao.com";

  const reservedSubdomains = [
    "www", "api", "admin", "mail", "ftp", "dev", "staging", "test", "beta", "alpha", "demo",
    "support", "help", "blog", "shop", "dashboard", "portal", "app", "client", "server",
    "static", "cdn", "assets", "media", "images", "videos", "docs", "wiki", "forum",
    "community", "news", "events", "careers", "about", "contact"
  ];

  let subdomain = "";

  if (isDevelopment) {
    if (host !== "localhost") {
      subdomain = host.replace(".localhost", "");
    }
  } else {
    if (host.endsWith(`.${rootDomain}`)) {
      subdomain = host.replace(`.${rootDomain}`, "");
    }
  }

  if (subdomain && !reservedSubdomains.includes(subdomain)) {
    const rewriteUrl = new URL(`/${subdomain}${pathname}`, req.url);
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};