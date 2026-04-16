import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    // Verify admin
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, supabaseKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();
    if (!roleData) throw new Error("Unauthorized - Admin only");

    const { productId, productName, productCategory, count = 50, dialect } = await req.json();
    if (!productId || !productName) throw new Error("productId and productName required");

    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const dialectInstruction = dialect
      ? `- جميع المراجعات يجب أن تكون بلهجة ${dialect === "khaliji" ? "خليجية" : dialect === "egyptian" ? "مصرية" : dialect === "moroccan" ? "مغربية" : "شامية"} فقط
- اجعل كل المراجعات تحمل "dialect": "${dialect}"`
      : `- استخدم لهجات متنوعة: خليجي، مصري، مغربي، شامي`;

    const prompt = `أنت مولد مراجعات منتجات عربية. أنشئ ${count} مراجعة واقعية لمنتج "${productName}" (فئة: ${productCategory || "عام"}).

القواعد:
- المراجعات يجب أن تبدو بشرية 100%
${dialectInstruction}
- اجعل بعض المراجعات قصيرة (جملة واحدة) وبعضها طويلة (2-3 جمل)
- أضف أخطاء إملائية بسيطة أحياناً لتبدو واقعية
- 70% تقييم 5 نجوم، 25% تقييم 4 نجوم، 5% تقييم 3 نجوم
- استخدم أسماء عربية متنوعة (رجال ونساء)
- اجعل التعليقات تتحدث عن جودة المنتج، التغليف، سرعة التوصيل، القيمة مقابل السعر

أرجع JSON array فقط بدون أي نص إضافي. كل عنصر يحتوي:
{
  "reviewer_name": "الاسم",
  "reviewer_gender": "male" أو "female",
  "rating": 3-5,
  "comment": "التعليق",
  "dialect": "${dialect || "khaliji أو egyptian أو moroccan أو shami"}",
  "badge_type": "verified_purchase" أو "trusted_customer"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "أنت مساعد متخصص في إنشاء مراجعات منتجات واقعية باللغة العربية. أرجع JSON فقط." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI response content");

    let reviews: any[];
    try {
      // Strip markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      const parsed = JSON.parse(cleanContent);
      reviews = Array.isArray(parsed) ? parsed : parsed.reviews || parsed.data || Object.values(parsed)[0];
      if (!Array.isArray(reviews)) throw new Error("Not an array");
    } catch (parseErr) {
      console.error("Parse error:", parseErr, "Content:", content?.substring(0, 200));
      throw new Error("Failed to parse AI response");
    }

    // Generate random dates within last 30 days and insert
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const rows = reviews.map((r: any, i: number) => ({
      product_id: productId,
      reviewer_name: r.reviewer_name || "عميل",
      reviewer_gender: r.reviewer_gender || "male",
      rating: Math.min(5, Math.max(1, r.rating || 5)),
      comment: r.comment || "",
      dialect: r.dialect || "khaliji",
      badge_type: r.badge_type || "verified_purchase",
      is_highlighted: i < 2,
      highlight_label: i === 0 ? "أفضل تعليق" : i === 1 ? "الأكثر فائدة" : null,
      review_date: new Date(now - Math.random() * thirtyDays).toISOString(),
      sort_order: i,
    }));

    const { error: insertError } = await adminClient
      .from("product_reviews")
      .insert(rows);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-reviews error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
