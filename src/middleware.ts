import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/webhooks/mercadopago" || pathname === "/webhooks/mercadopago/") {
    const url = request.nextUrl.clone();
    url.pathname = "/api/webhooks/mercadopago";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/webhooks/mercadopago", "/webhooks/mercadopago/"],
};


