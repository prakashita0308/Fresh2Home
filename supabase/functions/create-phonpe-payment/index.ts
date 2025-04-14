
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
    const { amount, redirectUrl, orderId, customerName, customerPhone, customerEmail } = await req.json();
    
    // Validate the request payload
    if (!amount || !redirectUrl || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PhonePe integration parameters
    const PHONPE_MERCHANT_ID = Deno.env.get("PHONPE_MERCHANT_ID") || "";
    const PHONPE_SALT_KEY = Deno.env.get("PHONPE_SALT_KEY") || "";
    const PHONPE_SALT_INDEX = Deno.env.get("PHONPE_SALT_INDEX") || "1";
    
    if (!PHONPE_MERCHANT_ID || !PHONPE_SALT_KEY) {
      return new Response(
        JSON.stringify({ error: "PhonePe configuration is missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the PhonePe payload
    const payload = {
      merchantId: PHONPE_MERCHANT_ID,
      merchantTransactionId: orderId,
      amount: amount * 100, // Convert to paise (PhonePe expects amount in paise)
      merchantUserId: "MERCHANT_USER_ID", // You can replace this with an actual user ID if available
      redirectUrl: redirectUrl,
      redirectMode: "REDIRECT",
      callbackUrl: redirectUrl, // Can be different from redirectUrl if needed
      paymentInstrument: {
        type: "PAY_PAGE"
      },
      customerMobileNumber: customerPhone || "",
      customerEmail: customerEmail || "",
      customerName: customerName || "",
    };

    // Convert payload to base64
    const payloadBase64 = btoa(JSON.stringify(payload));
    
    // Create the checksum (payload base64 + "/pg/v1/pay" + salt key)
    const string = payloadBase64 + "/pg/v1/pay" + PHONPE_SALT_KEY;
    
    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    
    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Create the X-VERIFY header
    const xVerify = `${checksum}###${PHONPE_SALT_INDEX}`;
    
    // Make the request to PhonePe
    const response = await fetch("https://api.phonepe.com/apis/hermes/pg/v1/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      body: JSON.stringify({
        request: payloadBase64
      }),
    });
    
    const responseData = await response.json();
    
    // Create Supabase client using the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Log the payment attempt in the database
    await supabase.from("payment_transactions").insert({
      order_id: orderId,
      amount: amount,
      payment_method: "phonpe",
      status: responseData.success ? "initiated" : "failed",
      transaction_details: responseData
    });
    
    // Return the PhonePe response
    return new Response(
      JSON.stringify(responseData),
      { 
        status: response.status, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error processing PhonePe payment:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process payment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
