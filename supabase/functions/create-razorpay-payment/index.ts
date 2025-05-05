
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
    const { amount, orderId, customerName, customerEmail, customerPhone, userId } = await req.json();

    // Validate required fields
    if (!amount || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing Razorpay payment request for order:", orderId, "amount:", amount);

    // Get Razorpay API key and secret from environment variables
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Razorpay configuration missing");
      return new Response(
        JSON.stringify({ error: "Payment gateway configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to save order details
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase configuration missing");
      return new Response(
        JSON.stringify({ error: "Database configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to paisa (Razorpay uses smallest currency unit)
    const amountInPaisa = Math.round(amount * 100);
    
    // Create Razorpay order
    const razorpayOrderUrl = "https://api.razorpay.com/v1/orders";
    const credentials = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const razorpayResponse = await fetch(razorpayOrderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`
      },
      body: JSON.stringify({
        amount: amountInPaisa,
        currency: "INR",
        receipt: orderId,
        notes: {
          order_id: orderId,
          customer_name: customerName || "Guest",
          customer_email: customerEmail || "",
          customer_phone: customerPhone || "",
          user_id: userId || null
        }
      })
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error("Razorpay API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to create payment", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log("Razorpay order created:", razorpayOrder.id);

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Insert order into the database with initiated status
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        status: "initiated",
        payment_method: "razorpay",
        payment_ref_id: razorpayOrder.id,
        total: amount,
        delivery_address: "To be updated after payment",
        phone: customerPhone || "To be updated after payment",
        user_id: userId
      })
      .select();
    
    if (error) {
      console.error("Database error:", error);
      // We continue despite DB error since we can update the order later with the verify function
    }
    
    // Return the Razorpay order details to the client
    return new Response(
      JSON.stringify({
        success: true,
        order_id: razorpayOrder.id,
        key_id: razorpayKeyId,
        amount: amountInPaisa,
        currency: "INR",
        name: "Thali Express",
        description: "Food Order",
        order_receipt: orderId,
        prefill: {
          name: customerName || "Guest",
          email: customerEmail || "",
          contact: customerPhone || ""
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create payment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
