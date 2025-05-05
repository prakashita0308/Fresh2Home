
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
    const {
      orderId,
      status,
      payment_method,
      payment_ref_id,
      total,
      delivery_address,
      phone,
      user_id,
      customer_name
    } = await req.json();

    // Validate required fields
    if (!orderId || !status || !total || !delivery_address || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing order save request for:", orderId);
    console.log("User ID:", user_id || "guest (null)");
    
    // Create Supabase client using service role key to bypass RLS
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
    
    // Insert order into the database
    const { data, error } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        status: status,
        payment_method: payment_method,
        payment_ref_id: payment_ref_id,
        total: total,
        delivery_address: delivery_address,
        phone: phone,
        user_id: user_id,
        customer_name: customer_name
      })
      .select();
    
    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Failed to save order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Order saved successfully:", orderId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order saved successfully",
        order: data
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error saving order:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to save order" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
