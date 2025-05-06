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
    const { orderId, approved, rejectionReason } = await req.json();

    // Validate required fields
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Missing order ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    
    // Get the order details first
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();
    
    if (orderError || !orderData) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: orderError?.message || "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Update the order status based on approval decision
    const newStatus = approved ? "completed" : "rejected";
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    
    // Add rejection reason if provided
    if (!approved && rejectionReason) {
      updateData.notes = `Payment rejected: ${rejectionReason}`;
    }
    
    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select();
    
    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Failed to update order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Send notification to customer about payment approval/rejection
    // This could be implemented with another service like email, SMS, or push notifications
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: approved ? "Payment approved" : "Payment rejected",
        order: data[0]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing QR payment approval:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process payment approval" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
