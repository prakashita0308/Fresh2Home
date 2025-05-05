import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Clock, X, RefreshCw, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface OrderDetails {
  id: string;
  status: string;
  total: number;
  delivery_address: string;
  created_at: string;
  payment_method: string;
  payment_ref_id: string | null;
  customer_name?: string;
}

const OrderSuccess = () => {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isBackendConnected } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const paymentStatus = searchParams.get('payment_status');
  const sessionId = searchParams.get('session_id');
  const status = searchParams.get('status');
  
  // Check for payment status from URL parameters
  useEffect(() => {
    if (status === 'failed') {
      toast.error("Payment failed or was cancelled. Please try again.");
    } else if (status === 'unknown') {
      toast.warning("Payment status unknown. We'll update you once confirmed.");
    }
  }, [status]);
  
  // Determine if we need to verify Stripe payment
  useEffect(() => {
    if (paymentStatus === "success" && sessionId) {
      verifyStripePayment(sessionId);
    }
  }, [paymentStatus, sessionId]);
  
  // Verify Stripe payment
  const verifyStripePayment = async (stripeSessionId: string) => {
    if (!isBackendConnected) {
      toast.error("Cannot verify payment: Backend is not connected");
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke("verify-stripe-payment", {
        body: { sessionId: stripeSessionId }
      });
      
      if (error) {
        console.error("Payment verification error:", error);
        toast.error("Failed to verify payment: " + error.message);
        return;
      }
      
      if (data.success) {
        toast.success("Payment verified successfully!");
        // Fetch the updated order details
        fetchOrder(data.order_id);
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      toast.error("Error verifying payment");
    }
  };

  // Handle order fetch
  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setLoading(false);
      setError("No order ID provided");
      setTimeout(() => navigate('/'), 5000); // Redirect after 5 seconds
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    if (!isBackendConnected) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) {
        console.error("Error fetching order:", error);
        setError("Could not find your order. Please contact customer support.");
        setLoading(false);
        return;
      }
      
      setOrder(data as OrderDetails);
    } catch (err) {
      console.error("Error in order fetch:", err);
      setError("An error occurred while fetching your order.");
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusIcon = () => {
    if (!order) return null;
    
    switch(order.status) {
      case "completed":
        return <Check className="w-12 h-12 text-green-500" />;
      case "pending":
      case "initiated":
      case "pending_owner_approval":
        return <Clock className="w-12 h-12 text-amber-500" />;
      case "rejected":
      case "failed":
        return <X className="w-12 h-12 text-red-500" />;
      default:
        return <Clock className="w-12 h-12 text-amber-500" />;
    }
  };
  
  const getStatusText = () => {
    if (!order) return "";
    
    switch(order.status) {
      case "completed":
        return "Order Confirmed";
      case "pending":
        return "Order Pending";
      case "initiated":
        return "Payment Initiated";
      case "pending_owner_approval":
        return "Awaiting Payment Verification";
      case "rejected":
        return "Payment Rejected";
      case "failed":
        return "Payment Failed";
      default:
        return "Processing Order";
    }
  };
  
  const getStatusDescription = () => {
    if (!order) return "";
    
    switch(order.status) {
      case "completed":
        return "Your payment has been confirmed and your order is being processed!";
      case "pending":
        return "Your order has been placed and is awaiting processing.";
      case "initiated":
        return "Your payment has been initiated. Please complete the payment process.";
      case "pending_owner_approval":
        return "Your payment is being verified by the restaurant owner. This usually takes a few minutes.";
      case "rejected":
        return "Your payment was rejected. Please try a different payment method.";
      case "failed":
        return "Your payment has failed. Please try again or choose a different payment method.";
      default:
        return "We're processing your order. Please wait.";
    }
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getPaymentMethodDisplay = (method: string | null) => {
    switch(method) {
      case "cod":
        return "Cash on Delivery";
      case "phonepe":
        return "PhonePe";
      case "stripe":
        return "Card Payment (Stripe)";
      case "razorpay":
        return "Razorpay";
      case "myqr":
        return "UPI QR Code (Owner)";
      case "upi":
        return "UPI QR Code";
      default:
        return "Other";
    }
  };
  
  const handleRefreshStatus = () => {
    if (orderId) {
      setLoading(true);
      fetchOrder(orderId);
      toast.info("Refreshing order status...");
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin mb-4 mx-auto">
              <RefreshCw className="w-12 h-12 text-fresh-orange" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Loading your order...</h2>
            <p className="text-gray-600">Please wait while we fetch your order details.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="text-center max-w-lg">
            <div className="mb-6 mx-auto">
              <X className="w-16 h-16 text-red-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Something Went Wrong</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                variant="outline" 
                className="border-fresh-orange text-fresh-orange hover:bg-fresh-orange/5"
                onClick={() => navigate('/contact')}
              >
                Contact Support
              </Button>
              <Button 
                className="bg-fresh-orange hover:bg-fresh-red"
                onClick={() => navigate('/')}
              >
                Return Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Status Header */}
          <div 
            className={`p-8 text-center ${
              order?.status === "completed" 
                ? "bg-green-50" 
                : order?.status === "rejected" || order?.status === "failed"
                  ? "bg-red-50"
                  : "bg-amber-50"
            }`}
          >
            <div className="inline-flex items-center justify-center rounded-full bg-white p-3 shadow-sm mb-4">
              {getStatusIcon()}
            </div>
            <h1 className="text-3xl font-bold mb-2">{getStatusText()}</h1>
            <p className="text-gray-600">{getStatusDescription()}</p>
            
            {order && ["pending_owner_approval", "initiated"].includes(order.status) && (
              <Button
                onClick={handleRefreshStatus}
                variant="outline"
                className="mt-4 mx-auto flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status Again
              </Button>
            )}
          </div>
          
          {/* Order Details */}
          {order && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Order Details</h2>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Order ID</div>
                  <div className="font-medium">{order.id.substring(0, 8)}</div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Order Date</h3>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Total Amount</h3>
                    <p className="font-medium">₹{order.total.toFixed(2)}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Payment Method</h3>
                    <p className="font-medium">{getPaymentMethodDisplay(order.payment_method)}</p>
                    
                    {order.payment_ref_id && (
                      <div className="mt-1 text-xs text-gray-500">
                        Ref: {order.payment_ref_id}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Delivery Address</h3>
                    <p className="font-medium">{order.delivery_address}</p>
                  </div>
                </div>

                {order.customer_name && (
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Customer</h3>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/menu')}
                  className="flex items-center justify-center"
                >
                  Continue Shopping
                </Button>
                <Button
                  className="bg-fresh-orange hover:bg-fresh-red flex items-center justify-center"
                  onClick={() => navigate('/')}
                >
                  Return Home
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess;
