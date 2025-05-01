
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ShoppingBag, Clock, CircleCheck, CreditCard } from "lucide-react";
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
  
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (orderId) {
        try {
          // Check order status in DB
          const { data, error } = await supabase
            .from("orders")
            .select("status, payment_method")
            .eq("id", orderId)
            .single();
          
          if (error) {
            console.error("Error fetching order status:", error);
            toast.error("Failed to fetch order details");
            return;
          }
          
          if (data) {
            // Type guard to ensure we don't access properties that might not exist
            const orderData = data as { payment_method?: string, status?: string } | null;
            
            // Safely access the data properties
            const paymentMethod = orderData?.payment_method || "Cash on Delivery";
            const paymentStatus = orderData?.status || "Pending";
            
            setOrderDetails(prev => ({
              ...prev,
              paymentMethod: paymentMethod === "phonepe" ? "PhonePe UPI" : 
                            paymentMethod === "upi" ? "QR Code Payment" : 
                            paymentMethod === "myqr" ? "Owner's QR Payment" : "Cash on Delivery",
              paymentStatus: paymentStatus === "completed" ? "Paid" : 
                            paymentStatus === "initiated" ? "Processing" : 
                            paymentStatus === "awaiting_confirmation" ? "Awaiting Confirmation" : "Pending"
            }));
          }
        } catch (err) {
          console.error("Failed to check payment status:", err);
          toast.error("Something went wrong while checking payment status");
        }
      }
    };
    
    checkPaymentStatus();
  }, [orderId]);

  const handleVerifyPayment = async () => {
    if (!paymentRefId.trim()) {
      toast.error("Please enter a valid payment reference ID");
      return;
    }
    
    setVerifyingPayment(true);
    
    try {
      // Add a validation check to verify payment reference ID
      // This is a simple validation - replace with actual verification logic
      const isValidPayment = /^[A-Za-z0-9]{6,}$/.test(paymentRefId.trim());
      
      if (!isValidPayment) {
        toast.error("Invalid payment reference ID format");
        setVerifyingPayment(false);
        return;
      }
      
      // Update the order status in the database
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: "completed",
          payment_ref_id: paymentRefId.trim()
        })
        .eq("id", orderId);
      
      if (error) {
        console.error("Error verifying payment:", error);
        toast.error("Failed to verify payment. Please try again.");
        setVerifyingPayment(false);
        return;
      }
      
      toast.success("Payment verified successfully!");
      
      // Update the order details locally
      setOrderDetails(prev => ({
        ...prev,
        paymentStatus: "Paid"
      }));
      
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
      case "Awaiting Confirmation":
        return <Clock className="h-5 w-5 text-blue-500" />;
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
              <span className="font-medium">{orderId || orderDetails.orderNumber}</span>
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
                  orderDetails.paymentStatus === "Awaiting Confirmation" ? "text-blue-500" : "text-red-500"
                }`}>
                  {orderDetails.paymentStatus}
                </span>
              </div>
            </div>
            
            {orderDetails.paymentStatus === "Awaiting Confirmation" && (
              <div className="mt-4">
                <div className="p-3 bg-blue-50 rounded-md text-sm mb-4">
                  <p className="text-blue-700">
                    Your payment is awaiting confirmation. Please enter the UPI transaction reference ID to verify your payment.
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
                    This helps us verify your payment faster.
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
