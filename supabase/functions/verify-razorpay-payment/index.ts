
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "https://deno.land/std@0.190.0/node/crypto.ts";

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
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      delivery_address,
      phone,
      order_id
    } = await req.json();

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required payment verification fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying Razorpay payment:", razorpay_payment_id, "for order:", order_id);

    // Get Razorpay secret key from environment variables
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeySecret) {
      console.error("Razorpay configuration missing");
      return new Response(
        JSON.stringify({ error: "Payment verification configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const payload = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = createHmac("sha256", razorpayKeySecret)
      .update(payload)
      .digest("hex");

    // Check if signature matches
    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      console.error("Invalid payment signature");
      return new Response(
        JSON.stringify({ error: "Invalid payment signature", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to update order status
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Database configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Find the order by Razorpay order ID
    let { data: orderData, error: findError } = await supabase
      .from("orders")
      .select("*")
      .eq("payment_ref_id", razorpay_order_id)
      .single();
      
    if (findError || !orderData) {
      console.error("Order not found:", findError);
      // If not found by payment_ref_id, try finding by the original order_id
      if (order_id) {
        const { data: orderByIdData, error: orderByIdError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", order_id)
          .single();
          
        if (!orderByIdError && orderByIdData) {
          orderData = orderByIdData;
        } else {
          return new Response(
            JSON.stringify({ error: "Order not found in database", success: false }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: "Order not found in database", success: false }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Update order with payment details and delivery information
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "completed",
        payment_ref_id: razorpay_payment_id,
        delivery_address: delivery_address || orderData.delivery_address,
        phone: phone || orderData.phone,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderData.id)
      .select();
      
    if (updateError) {
      console.error("Error updating order status:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order status", details: updateError, success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Payment verified successfully for order:", orderData.id);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully",
        order_id: orderData.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to verify payment", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
