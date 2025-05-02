
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Set up CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple email sending function
async function sendEmail(to: string, subject: string, body: string) {
  try {
    console.log(`Sending email to ${to} with subject: ${subject}`);
    console.log(`Email body: ${body}`);
    
    // In a production environment, you'd integrate with an email service like SendGrid or Resend
    // This is a placeholder for now - the logs will show what would be sent
    
    return { success: true, message: "Email notification would be sent (check logs)" };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

// Basic UPI reference ID validation
function isValidReferenceId(refId: string): boolean {
  if (!refId || refId.trim().length < 6) {
    return false;
  }
  
  // Basic format check for common UPI reference formats
  // UPI ids are typically alphanumeric and at least 6 characters
  const upiRegex = /^[A-Za-z0-9]{6,}$/;
  return upiRegex.test(refId.trim());
}

serve(async (req) => {
  // Get query parameters from URL
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  const action = url.searchParams.get("action");
  const refId = url.searchParams.get("refId");

  if (!orderId || !action || !["approve", "reject"].includes(action)) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing parameters" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Create Supabase client using env variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if the order exists and is in the pending_owner_approval state
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select("*, profiles(first_name, last_name, email)")
      .eq("id", orderId)
      .eq("status", "pending_owner_approval")
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error fetching order:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve order details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!orderData) {
      return new Response(
        JSON.stringify({ error: "Order not found or already processed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate reference ID if approving
    if (action === "approve" && refId) {
      if (!isValidReferenceId(refId)) {
        return new Response(
          JSON.stringify({ error: "Invalid payment reference ID format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Check if this reference ID has been used in another order
      const { data: existingOrder, error: refCheckError } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_ref_id", refId)
        .eq("status", "completed")
        .neq("id", orderId)
        .maybeSingle();
        
      if (refCheckError) {
        console.error("Error checking reference ID:", refCheckError);
      } else if (existingOrder) {
        return new Response(
          JSON.stringify({ error: "This payment reference ID has already been used for another order" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Update the order status based on the action
    const newStatus = action === "approve" ? "completed" : "rejected";
    
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        payment_ref_id: refId || orderData.payment_ref_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
    
    if (updateError) {
      console.error("Error updating order:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Send confirmation email to the owner if the payment was approved
    if (action === "approve") {
      const ownerEmail = Deno.env.get("OWNER_EMAIL") || "";
      
      if (ownerEmail) {
        const subject = `Payment Approved for Order #${orderId.substring(0, 8)}`;
        const emailBody = `
          <h2>Payment Approved Successfully</h2>
          <p>You have approved the payment for order #${orderId.substring(0, 8)}.</p>
          
          <h3>Order Details:</h3>
          <ul>
            <li><strong>Order ID:</strong> ${orderId}</li>
            <li><strong>Amount:</strong> ₹${orderData.total.toFixed(2)}</li>
            <li><strong>Payment Reference:</strong> ${refId || orderData.payment_ref_id || 'N/A'}</li>
            <li><strong>Delivery Address:</strong> ${orderData.delivery_address || 'N/A'}</li>
          </ul>
          
          <p>The customer has been notified that their payment was approved.</p>
        `;
        
        await sendEmail(ownerEmail, subject, emailBody);
      }
    }
    
    // Return a simple HTML response with the result
    const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment ${action === "approve" ? "Approved" : "Rejected"}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem;
          line-height: 1.6;
          color: #333;
        }
        .card {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          padding: 2rem;
          text-align: center;
          margin-top: 2rem;
        }
        .success {
          color: #10b981;
        }
        .error {
          color: #ef4444;
        }
        h1 {
          margin-bottom: 1rem;
        }
        .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .details {
          margin-top: 1.5rem;
          text-align: left;
          background-color: #f9fafb;
          padding: 1rem;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon ${action === "approve" ? "success" : "error"}">
          ${action === "approve" ? "✓" : "✗"}
        </div>
        <h1>Payment ${action === "approve" ? "Approved" : "Rejected"}</h1>
        <p>
          You have successfully ${action === "approve" ? "approved" : "rejected"} 
          the payment for order #${orderId.substring(0, 8)}.
        </p>
        <div class="details">
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Status:</strong> ${newStatus}</p>
          <p><strong>Action taken:</strong> ${action}</p>
          ${refId ? `<p><strong>Payment Reference:</strong> ${refId}</p>` : ''}
        </div>
      </div>
    </body>
    </html>
    `;
    
    return new Response(htmlResponse, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
    
  } catch (error) {
    console.error("Error processing approval action:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process approval" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
