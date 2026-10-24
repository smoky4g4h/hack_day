import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const RAZORPAY_SECRET = Deno.env.get("RAZORPAY_SECRET") || ""

serve(async (req) => {
  const signature = req.headers.get("x-razorpay-signature")
  const body = await req.text()

  // Verify signature
  const hmac = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(RAZORPAY_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const generatedSignatureBuffer = await crypto.subtle.sign(
    "HMAC",
    hmac,
    new TextEncoder().encode(body)
  )
  const generatedSignature = Array.from(new Uint8Array(generatedSignatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  if (generatedSignature !== signature) {
    return new Response("Invalid signature", { status: 400 })
  }

  const payload = JSON.parse(body)
  const { event, payload: { payment: { entity } } } = payload

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  )

  if (event === "order.paid") {
    const orderId = entity.order_id
    // Check idempotency: fetch payment by order_id
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", orderId) // Assuming id or a separate order_id column
      .single()

    if (payment && payment.status === "pending") {
      // Mark as paid and update wallet/payout
      await supabase
        .from("payments")
        .update({ status: "paid" })
        .eq("id", orderId)
    }
  }

  return new Response("OK", { status: 200 })
})
