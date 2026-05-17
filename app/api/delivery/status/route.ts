import { NextResponse } from "next/server";

import {
  deliveryStatusHeadline,
  getUserDeliveryStatus,
} from "@/lib/delivery/get-user-delivery-status";
import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** GET — scheduled delivery status for the signed-in user. */
export async function GET() {
  if (!hasSupabaseBrowserEnv()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const status = await getUserDeliveryStatus(user.id);

    return NextResponse.json({
      ...status,
      headline: deliveryStatusHeadline(status),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load delivery status." },
      { status: 500 },
    );
  }
}
