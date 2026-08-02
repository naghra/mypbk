import { createClient } from "@/lib/supabase/server";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return jsonOk({ signedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
