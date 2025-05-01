
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ShoppingBag } from "lucide-react";
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
            return;
          }
          
          if (data) {
            setOrderDetails(prev => ({
              ...prev,
              paymentMethod: data.payment_method === "phonpe" ? "PhonePe UPI" : 
                            data.payment_method === "upi" ? "UPI QR Code" : "Cash on Delivery",
              paymentStatus: data.status === "completed" ? "Paid" : 
                            data.status === "initiated" ? "Processing" : "Failed"
            }));
          }
        } catch (err) {
          console.error("Failed to check payment status:", err);
        }
      }
    };
    
    checkPaymentStatus();
  }, [orderId]);
  
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Status:</span>
              <span className={`font-medium ${
                orderDetails.paymentStatus === "Paid" ? "text-fresh-green" : 
                orderDetails.paymentStatus === "Processing" ? "text-amber-500" : "text-red-500"
              }`}>
                {orderDetails.paymentStatus}
              </span>
            </div>
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
