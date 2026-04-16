import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { order_id, event } = await req.json();

    if (!order_id || !event) {
      return new Response(JSON.stringify({ error: "order_id and event required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if WhatsApp is enabled
    const { data: settings } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "whatsapp_settings")
      .maybeSingle();

    const wsSettings = settings?.value as any;
    if (!wsSettings?.enabled) {
      return new Response(JSON.stringify({ error: "WhatsApp is disabled" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instanceId = wsSettings?.instance_id;
    const token = wsSettings?.token;
    if (!instanceId || !token) {
      return new Response(JSON.stringify({ error: "Ultramsg not configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this event is enabled
    const enabledEvents: string[] = wsSettings?.events || [];
    if (!enabledEvents.includes(event)) {
      return new Response(JSON.stringify({ error: "Event not enabled", event }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check duplicate: was message already sent for this order+event?
    const { data: existing } = await supabase
      .from("whatsapp_message_logs")
      .select("id")
      .eq("order_id", order_id)
      .eq("status", "sent")
      .limit(1);

    // Find template matching the status (check template event matches the order event)
    const templateEvent = event; // 'confirmed', 'shipped', 'delivered'
    
    // Check if already sent for this specific event by looking at template
    const { data: sentLogs } = await supabase
      .from("whatsapp_message_logs")
      .select("id, template_id")
      .eq("order_id", order_id)
      .eq("status", "sent");

    const { data: template } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("event", templateEvent)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!template) {
      return new Response(JSON.stringify({ error: "No active template for event", event }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check duplicate for same template
    if (sentLogs?.some(l => l.template_id === template.id)) {
      return new Response(JSON.stringify({ error: "Message already sent", skipped: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order data
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order items for product names
    const { data: items } = await supabase
      .from("order_items")
      .select("product_name, quantity")
      .eq("order_id", order_id);

    const productNames = items?.map(i => `${i.product_name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join("، ") || "";

    // Replace template variables
    let messageBody = template.body
      .replace(/\{\{name\}\}/g, order.customer_name)
      .replace(/\{\{product\}\}/g, productNames)
      .replace(/\{\{phone\}\}/g, order.customer_phone);

    // Clean phone number
    const phone = order.customer_phone.replace(/[^0-9]/g, "");

    // Create log entry
    const { data: logEntry } = await supabase
      .from("whatsapp_message_logs")
      .insert({
        order_id: order_id,
        template_id: template.id,
        phone: phone,
        message_body: messageBody,
        status: "pending",
      })
      .select("id")
      .single();

    // Send via Ultramsg with retry
    let lastError = "";
    let sent = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, to: phone, body: messageBody }),
        });
        const result = await res.json();

        if (result.sent === "true" || result.sent === true || result.id) {
          sent = true;
          break;
        } else {
          lastError = result.error || result.message || JSON.stringify(result);
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }

      if (attempt < 2) await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }

    // Update log
    if (logEntry) {
      await supabase
        .from("whatsapp_message_logs")
        .update({
          status: sent ? "sent" : "failed",
          error_message: sent ? null : lastError,
        })
        .eq("id", logEntry.id);
    }

    return new Response(JSON.stringify({ success: sent, error: sent ? null : lastError }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-whatsapp error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
