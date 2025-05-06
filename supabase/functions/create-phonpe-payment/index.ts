
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Set up CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // For payment verification callbacks
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // Handle payment verification callback
    if (path === "verify") {
      const params = Object.fromEntries(url.searchParams);
      const { orderId, status } = params;
      
      if (!orderId) {
        return new Response(
          JSON.stringify({ error: "Missing order ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Create Supabase client using the service role key for admin access
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Update the order status with a transaction_id if available
      await supabase.from("orders").update({
        status: status === "success" ? "completed" : "failed",
        payment_ref_id: params.transactionId || null,
        updated_at: new Date().toISOString(),
      }).eq("id", orderId);
      
      // If payment was successful, redirect to success page
      if (status === "success") {
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            "Location": `${url.origin}/order-success?orderId=${orderId}&status=success`
          }
        });
      } else {
        // If payment failed, redirect to checkout with error
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            "Location": `${url.origin}/checkout?error=payment_failed`
          }
        });
      }
    }
    
    // Handle payment creation requests
    const { amount, redirectUrl, orderId, customerName, customerPhone, customerEmail } = await req.json();
    
    // Validate the request payload
    if (!amount || !redirectUrl || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create UPI payment URL with amount-specific parameters
    const upiId = "7680087955@ybl"; // Your PhonePe UPI ID
    const timestamp = new Date().getTime(); // Add timestamp for uniqueness
    
    const upiParams = new URLSearchParams({
      pa: upiId, // payee address (UPI ID)
      pn: "Restaurant", // payee name
      am: amount.toString(), // amount
      tn: `Order #${orderId.substring(0, 8)}`, // transaction note
      cu: "INR", // currency
      tr: `TR${orderId.substring(0, 6)}${timestamp.toString().substring(-6)}`, // Add unique transaction reference
    });
    
    const upiUrl = `upi://pay?${upiParams.toString()}`;
    
    // Generate QR code URL using a free QR code generation API
    // Add amount, orderId and timestamp to prevent caching and ensure uniqueness
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=200x200&amount=${amount}&orderId=${orderId}&ts=${timestamp}`;
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update the order status
    await supabase.from("orders").update({
      payment_method: "phonepe",
      status: "initiated",
      updated_at: new Date().toISOString()
    }).eq("id", orderId);
    
    console.log(`Generated unique QR for order ${orderId} with amount ₹${amount} at timestamp ${timestamp}`);
    
    // Return the PhonePe payment data
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          orderId: orderId,
          upiUrl: upiUrl,
          qrCodeUrl: qrCodeApiUrl,
          amount: amount,
          recipientUpiId: upiId,
          timestamp: timestamp // Return timestamp for reference
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing PhonePe payment:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process payment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
