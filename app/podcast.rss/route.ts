import { type NextRequest, NextResponse } from "next/server";

/** Permanent redirect — same canonical feed as `/rss.xml`. */
export function GET(request: NextRequest) {
  const target = request.nextUrl.clone();
  target.pathname = "/rss.xml";
  target.search = "";

  return NextResponse.redirect(target, 308);
}
