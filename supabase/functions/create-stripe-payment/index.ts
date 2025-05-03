
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { amount, redirectUrl, orderId, customerName, customerPhone, customerEmail } = await req.json();

    if (!amount || !redirectUrl || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe with the secret key from environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ error: "Payment gateway configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: "Food Order",
              description: `Order #${orderId.substring(0, 8)}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to paise (smallest Indian currency unit)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${redirectUrl}?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectUrl}?payment_status=cancelled`,
      customer_email: customerEmail || undefined,
      client_reference_id: orderId,
      metadata: {
        orderId: orderId,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
      },
    });

    // Create Supabase client using env variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Supabase configuration missing");
      // Still return success with the Stripe session URL even if we can't update the order
      return new Response(
        JSON.stringify({ 
          success: true, 
          url: session.url,
          session_id: session.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // Create Supabase client with service role key to bypass RLS
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      
      // Update the order status to initiated
      await supabase
        .from("orders")
        .update({
          status: "initiated",
          payment_method: "stripe",
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId);
    } catch (dbError) {
      console.error("Database update error:", dbError);
      // Continue even if the database update fails
      // The payment can still be processed and verified later
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: session.url,
        session_id: session.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error creating Stripe payment:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create payment session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
