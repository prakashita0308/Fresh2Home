
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ShoppingBag, Clock, CircleCheck, CreditCard, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OrderSuccess = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status');
  const { user } = useAuth();
  
  const [orderDetails, setOrderDetails] = useState({
    orderNumber: Math.floor(100000 + Math.random() * 900000),
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pending"
  });
  
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentRefId, setPaymentRefId] = useState("");
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());
  const [isPolling, setIsPolling] = useState(false);
  
  // Function to check payment status
  const checkPaymentStatus = async () => {
    if (orderId) {
      try {
        // Check order status in DB
        const { data, error } = await supabase
          .from("orders")
          .select("status, payment_method, payment_ref_id")
          .eq("id", orderId)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching order status:", error);
          toast.error("Failed to fetch order details");
          return null;
        }
        
        if (data) {
          // Type guard to ensure we don't access properties that might not exist
          const paymentMethod = data.payment_method || "Cash on Delivery";
          const paymentStatus = data.status || "Pending";
          const paymentRefId = data.payment_ref_id || "";
          
          if (paymentRefId) {
            setPaymentRefId(paymentRefId);
          }
          
          setOrderDetails(prev => ({
            ...prev,
            paymentMethod: paymentMethod === "phonepe" ? "PhonePe UPI" : 
                        paymentMethod === "upi" ? "QR Code Payment" : 
                        paymentMethod === "myqr" ? "Owner's QR Payment" : "Cash on Delivery",
            paymentStatus: paymentStatus === "completed" ? "Paid" : 
                        paymentStatus === "initiated" ? "Processing" : 
                        paymentStatus === "pending_owner_approval" ? "Awaiting Owner Approval" :
                        paymentStatus === "rejected" ? "Payment Rejected" : "Pending"
          }));
          
          return paymentStatus;
        }
      } catch (err) {
        console.error("Failed to check payment status:", err);
        toast.error("Something went wrong while checking payment status");
      }
    }
    return null;
  };
  
  // Initial status check
  useEffect(() => {
    checkPaymentStatus();
  }, [orderId]);
  
  // Polling for status updates when in "pending_owner_approval" state
  useEffect(() => {
    if (!isPolling && orderDetails.paymentStatus === "Awaiting Owner Approval") {
      setIsPolling(true);
      
      const pollInterval = setInterval(async () => {
        // Only poll if at least 5 seconds have passed since last check
        if (Date.now() - lastCheckTime >= 5000) {
          setLastCheckTime(Date.now());
          
          const currentStatus = await checkPaymentStatus();
          
          // If status changed from pending approval, stop polling
          if (currentStatus !== "pending_owner_approval") {
            clearInterval(pollInterval);
            setIsPolling(false);
            
            if (currentStatus === "completed") {
              toast.success("Payment approved! Your order has been confirmed.");
            } else if (currentStatus === "rejected") {
              toast.error("Your payment was rejected. Please contact the restaurant.");
            }
          }
        }
      }, 5000);
      
      return () => clearInterval(pollInterval);
    }
  }, [orderDetails.paymentStatus, isPolling]);

  const validatePaymentRefId = (refId: string) => {
    // Basic validation: At least 6 alphanumeric characters, common patterns for UPI IDs
    const refIdRegex = /^[A-Za-z0-9]{6,}$/;
    return refIdRegex.test(refId.trim());
  };

  const handleVerifyPayment = async () => {
    if (!paymentRefId.trim()) {
      toast.error("Please enter a valid payment reference ID");
      return;
    }
    
    // Validate payment reference ID
    if (!validatePaymentRefId(paymentRefId)) {
      toast.error("Invalid reference ID format. Please check and try again.");
      return;
    }
    
    setVerifyingPayment(true);
    
    try {
      // Check if the payment reference ID already exists in another completed order
      const { data: existingOrder, error: checkError } = await supabase
        .from("orders")
        .select("id")
        .eq("payment_ref_id", paymentRefId.trim())
        .eq("status", "completed")
        .neq("id", orderId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking existing payment:", checkError);
      }
      
      if (existingOrder) {
        toast.error("This payment reference has already been used for another order");
        setVerifyingPayment(false);
        return;
      }
      
      // Update the order status in the database
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "pending_owner_approval",
          payment_ref_id: paymentRefId.trim()
        })
        .eq("id", orderId);
      
      if (error) {
        console.error("Error updating payment:", error);
        toast.error("Failed to update payment information. Please try again.");
        setVerifyingPayment(false);
        return;
      }
      
      // Send notification to owner about the payment
      const { error: notificationError } = await supabase.functions.invoke("send-owner-notification", {
        body: {
          orderId,
          customerName: "Customer", // We don't have the name at this point
          amount: 0, // We don't have the amount at this point
          paymentRefId: paymentRefId.trim(),
          customerPhone: "N/A", // We don't have the phone at this point
          deliveryAddress: "N/A" // We don't have the address at this point
        }
      });
      
      if (notificationError) {
        console.error("Error sending owner notification:", notificationError);
        // We still show success to user since the payment was recorded
      }
      
      toast.success("Payment information updated. Awaiting owner approval.");
      
      // Update the order details locally
      setOrderDetails(prev => ({
        ...prev,
        paymentStatus: "Awaiting Owner Approval"
      }));
      
      // Start polling for status updates
      setIsPolling(true);
      setLastCheckTime(Date.now());
      
    } catch (err) {
      console.error("Payment verification failed:", err);
      toast.error("Something went wrong while verifying payment");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const getPaymentStatusIcon = () => {
    switch (orderDetails.paymentStatus) {
      case "Paid":
        return <CircleCheck className="h-5 w-5 text-fresh-green" />;
      case "Processing":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "Awaiting Owner Approval":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "Payment Rejected":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container px-4 py-12 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="h-20 w-20 bg-fresh-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-fresh-green" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Order Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your order. Your order has been placed and is being processed.
          </p>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Order Number:</span>
              <span className="font-medium">{orderId ? orderId.substring(0, 8) : orderDetails.orderNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Estimated Delivery:</span>
              <span className="font-medium">30-45 minutes</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">{orderDetails.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment Status:</span>
              <div className="flex items-center gap-2">
                {getPaymentStatusIcon()}
                <span className={`font-medium ${
                  orderDetails.paymentStatus === "Paid" ? "text-fresh-green" : 
                  orderDetails.paymentStatus === "Processing" ? "text-amber-500" : 
                  orderDetails.paymentStatus === "Awaiting Owner Approval" ? "text-blue-500" :
                  orderDetails.paymentStatus === "Payment Rejected" ? "text-red-500" : "text-gray-500"
                }`}>
                  {orderDetails.paymentStatus}
                </span>
              </div>
            </div>
            
            {orderDetails.paymentStatus === "Awaiting Owner Approval" && (
              <div className="mt-4">
                <div className="p-3 bg-blue-50 rounded-md text-sm mb-4">
                  <p className="text-blue-700">
                    Your payment is awaiting approval from the restaurant owner. This usually takes a few minutes.
                    You don't need to do anything - we'll update this page when your payment is approved.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <div className="animate-pulse flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-1" style={{ animationDelay: '0.2s' }}></div>
                    <div className="h-2 w-2 rounded-full bg-blue-500" style={{ animationDelay: '0.4s' }}></div>
                    <span className="ml-2 text-sm text-blue-500">Awaiting owner approval</span>
                  </div>
                </div>
              </div>
            )}
            
            {orderDetails.paymentStatus === "Payment Rejected" && (
              <div className="mt-4">
                <div className="p-3 bg-red-50 rounded-md text-sm mb-4">
                  <p className="text-red-700">
                    Your payment has been rejected by the restaurant owner. This could be because:
                  </p>
                  <ul className="list-disc list-inside text-red-700 mt-2">
                    <li>The payment reference ID couldn't be verified</li>
                    <li>The payment amount didn't match the order total</li>
                    <li>There might have been an issue with the payment processing</li>
                  </ul>
                  <p className="mt-2 text-red-700">
                    Please contact the restaurant directly or try placing a new order.
                  </p>
                </div>
              </div>
            )}
            
            {(orderDetails.paymentStatus === "Pending" || !orderDetails.paymentStatus) && (
              <div className="mt-4">
                <div className="p-3 bg-blue-50 rounded-md text-sm mb-4">
                  <p className="text-blue-700">
                    If you've already paid via QR code but haven't entered the payment reference, 
                    please enter the UPI transaction reference ID to verify your payment.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      value={paymentRefId}
                      onChange={(e) => setPaymentRefId(e.target.value)}
                      placeholder="UPI Transaction ID"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <Button 
                      onClick={handleVerifyPayment}
                      disabled={verifyingPayment || !paymentRefId.trim()}
                      className="bg-fresh-orange hover:bg-fresh-red text-sm"
                    >
                      {verifyingPayment ? "Verifying..." : "Verify Payment"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter the UPI reference ID you received after completing the payment.
                    This helps the restaurant owner verify your payment faster.
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="outline" className="w-full">
                Return to Home
              </Button>
            </Link>
            <Link to="/menu">
              <Button className="w-full bg-fresh-orange hover:bg-fresh-red">
                Order More Food
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
