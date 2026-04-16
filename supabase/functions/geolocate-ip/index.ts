import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache to avoid repeated API calls
const geoCache = new Map<string, { country: string; city: string; ts: number }>();
const CACHE_TTL = 3600_000; // 1 hour

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the client IP from the request headers
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    let country = "غير معروف";
    let city = "غير معروف";

    // Check cache
    const cached = geoCache.get(clientIp);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      country = cached.country;
      city = cached.city;
    } else if (clientIp !== "unknown" && clientIp !== "127.0.0.1") {
      // Call free IP geolocation API (no key needed)
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,city&lang=ar`);
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.status === "success") {
            country = geo.country || "غير معروف";
            city = geo.city || "غير معروف";
            geoCache.set(clientIp, { country, city, ts: Date.now() });
          }
        }
      } catch (e) {
        console.error("Geo API failed:", e);
      }
    }

    // Update order with IP data
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase
      .from("orders")
      .update({
        ip_address: clientIp,
        ip_country: country,
        ip_city: city,
      })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({ success: true, ip: clientIp, country, city }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
