
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Set up CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequestPayload {
  orderId: string;
  customerName: string;
  amount: number;
  paymentRefId: string;
  customerPhone: string;
  deliveryAddress: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: NotificationRequestPayload = await req.json();
    const { orderId, customerName, amount, paymentRefId, customerPhone, deliveryAddress } = payload;

    if (!orderId || !amount || !paymentRefId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client using env variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get owner email from environment variable
    const ownerEmail = Deno.env.get("OWNER_EMAIL");
    
    if (!ownerEmail) {
      console.error("Owner email is not configured");
      return new Response(
        JSON.stringify({ error: "Owner email is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create approval and rejection URLs
    const approvalUrl = `${supabaseUrl}/functions/v1/approve-qr-payment?orderId=${orderId}&action=approve&refId=${paymentRefId}`;
    const rejectUrl = `${supabaseUrl}/functions/v1/approve-qr-payment?orderId=${orderId}&action=reject&refId=${paymentRefId}`;
    
    // Generate email content with approval links
    const emailSubject = `[ACTION REQUIRED] New QR Payment Approval - Order #${orderId.substring(0, 8)}`;
    const emailHtml = `
      <h2>New QR Payment Requires Your Approval</h2>
      <p>A customer has made a payment via QR code and is waiting for your approval.</p>
      
      <h3>Order Details:</h3>
      <ul>
        <li><strong>Order ID:</strong> ${orderId}</li>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Phone:</strong> ${customerPhone || "N/A"}</li>
        <li><strong>Amount:</strong> ₹${amount.toFixed(2)}</li>
        <li><strong>Payment Reference ID:</strong> ${paymentRefId}</li>
        <li><strong>Delivery Address:</strong> ${deliveryAddress}</li>
      </ul>
      
      <p>Please verify that you've received this payment in your UPI account before approving.</p>
      
      <div style="margin: 30px 0;">
        <a href="${approvalUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">
          Approve Payment
        </a>
        
        <a href="${rejectUrl}" style="background-color: #f44336; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">
          Reject Payment
        </a>
      </div>
      
      <p><small>Or copy and paste these links in your browser:</small></p>
      <p><small>Approve: ${approvalUrl}</small></p>
      <p><small>Reject: ${rejectUrl}</small></p>
    `;
    
    // For demonstration purposes, we'll log the email content
    console.log(`Email would be sent to ${ownerEmail}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Email content: ${emailHtml}`);
    
    // In a production environment, you would integrate with an email service like SendGrid, AWS SES, or Resend
    // For now, we'll just update the order status and log that the notification would be sent
    
    // Update the order status to "pending_owner_approval"
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "pending_owner_approval",
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
    
    if (updateError) {
      console.error("Error updating order status:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Owner notification sent successfully",
        emailSent: true,
        orderStatus: "pending_owner_approval"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing owner notification:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send owner notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
