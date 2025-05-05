
import { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Check, CreditCard, MapPin, Smartphone, QrCode, AlertCircle, Timer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const { items, subtotal, clearCart } = useContext(CartContext);
  const { user, isBackendConnected } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const paymentError = searchParams.get('error');
  
  // If cart is empty, redirect to cart page
  if (items.length === 0) {
    navigate("/cart");
    return null;
  }
  
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });
  
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [showQrCode, setShowQrCode] = useState(false);
  const [selectedQr, setSelectedQr] = useState("default"); // "default" or "owner"
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [paymentConfirmationNumber, setPaymentConfirmationNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [countdownActive, setCountdownActive] = useState(false);
  
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  // Add script for Razorpay
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Check for payment errors
  useEffect(() => {
    if (paymentError === 'payment_failed') {
      toast.error("Payment failed. Please try again.");
    }
  }, [paymentError]);
  
  // Countdown timer for QR payment confirmation
  useEffect(() => {
    let timer: number | undefined;
    
    if (showQrDialog && countdownActive && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && countdownActive) {
      setShowPaymentConfirmation(true);
      setCountdownActive(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, showQrDialog, countdownActive]);
  
  // Start countdown when QR code dialog is shown
  useEffect(() => {
    if (showQrDialog) {
      setCountdown(15);
      setCountdownActive(true);
    } else {
      setCountdownActive(false);
      setCountdown(15);
    }
  }, [showQrDialog]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePhonePePayment = async (orderId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage("");
      
      // Check backend connection
      if (!isBackendConnected) {
        toast.error("Cannot process payment: Backend is not connected");
        setIsProcessing(false);
        return false;
      }
      
      // Call the Supabase edge function to create a PhonePe payment
      const { data, error } = await supabase.functions.invoke("create-phonpe-payment", {
        body: {
          amount: total,
          redirectUrl: `${window.location.origin}/order-success?orderId=${orderId}`,
          orderId,
          customerName: address.fullName,
          customerPhone: address.phone,
          customerEmail: user?.email || "",
          userId: user?.id || null
        }
      });
      
      if (error) {
        console.error("Payment error:", error);
        setErrorMessage(`Failed to initiate payment: ${error.message || "Unknown error"}`);
        toast.error("Failed to initiate payment: " + (error.message || "Unknown error"));
        setIsProcessing(false);
        return false;
      }
      
      if (data && data.success && data.data && data.data.instrumentResponse && data.data.instrumentResponse.redirectInfo) {
        // Save order details before redirecting
        await saveOrderDetails(orderId, "initiated", "phonepe");
        
        // Redirect the user to the PhonePe payment page
        window.location.href = data.data.instrumentResponse.redirectInfo.url;
        return true;
      } else {
        console.error("Invalid payment response:", data);
        setErrorMessage("Payment gateway returned an invalid response");
        toast.error("Payment gateway returned an invalid response");
        setIsProcessing(false);
        return false;
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      setErrorMessage(`Error processing payment: ${err instanceof Error ? err.message : String(err)}`);
      toast.error("Error processing payment");
      setIsProcessing(false);
      return false;
    }
  };

  const handleStripePayment = async (orderId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage("");
      
      if (!isBackendConnected) {
        toast.error("Cannot process payment: Backend is not connected");
        setIsProcessing(false);
        return false;
      }
      
      console.log("Processing Stripe payment for order:", orderId, "with user ID:", user?.id || "guest");
      
      // Call the Supabase edge function to create a Stripe payment
      const { data, error } = await supabase.functions.invoke("create-stripe-payment", {
        body: {
          amount: total,
          redirectUrl: `${window.location.origin}/order-success?orderId=${orderId}`,
          orderId,
          customerName: address.fullName,
          customerPhone: address.phone,
          customerEmail: user?.email || "",
          userId: user?.id || null
        }
      });
      
      if (error) {
        console.error("Payment error:", error);
        setErrorMessage(`Failed to initiate payment: ${error.message || "Unknown error"}`);
        toast.error("Failed to initiate payment: " + (error.message || "Unknown error"));
        setIsProcessing(false);
        return false;
      }
      
      if (data && data.success && data.url) {
        // The edge function will handle saving the order with the correct user_id
        // We can try locally too, but if it fails, we can still proceed with payment
        try {
          await saveOrderDetails(orderId, "initiated", "stripe");
        } catch (saveErr) {
          console.log("Local order saving failed, but stripe function will handle it", saveErr);
        }
        
        // Redirect the user to the Stripe checkout page
        window.location.href = data.url;
        return true;
      } else {
        console.error("Invalid payment response:", data);
        setErrorMessage("Payment gateway returned an invalid response");
        toast.error("Payment gateway returned an invalid response");
        setIsProcessing(false);
        return false;
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      setErrorMessage(`Error processing payment: ${err instanceof Error ? err.message : String(err)}`);
      toast.error("Error processing payment");
      setIsProcessing(false);
      return false;
    }
  };
  
  const handleRazorpayPayment = async (orderId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage("");
      
      if (!isBackendConnected) {
        toast.error("Cannot process payment: Backend is not connected");
        setIsProcessing(false);
        return false;
      }
      
      console.log("Processing Razorpay payment for order:", orderId);
      
      // Call the Supabase edge function to create a Razorpay order
      const { data, error } = await supabase.functions.invoke("create-razorpay-payment", {
        body: {
          amount: total,
          orderId,
          customerName: address.fullName,
          customerEmail: user?.email || "",
          customerPhone: address.phone,
          userId: user?.id || null
        }
      });
      
      if (error) {
        console.error("Payment error:", error);
        setErrorMessage(`Failed to initiate payment: ${error.message || "Unknown error"}`);
        toast.error("Failed to initiate payment: " + (error.message || "Unknown error"));
        setIsProcessing(false);
        return false;
      }
      
      if (data && data.success) {
        // Open Razorpay checkout form
        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: data.name,
          description: data.description,
          order_id: data.order_id,
          prefill: {
            name: data.prefill.name,
            email: data.prefill.email,
            contact: data.prefill.contact
          },
          handler: async function(response: any) {
            try {
              // Verify payment
              const verifyResponse = await supabase.functions.invoke("verify-razorpay-payment", {
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  delivery_address: `${address.street}, ${address.city}, ${address.state}, ${address.pincode}`,
                  phone: address.phone,
                  order_id: orderId
                }
              });
              
              if (verifyResponse.error) {
                toast.error("Payment verification failed: " + verifyResponse.error.message);
                navigate(`/order-success?orderId=${orderId}&status=failed`);
                return;
              }
              
              if (verifyResponse.data.success) {
                toast.success("Payment successful!");
                clearCart();
                navigate(`/order-success?orderId=${orderId}`);
              } else {
                toast.error("Payment verification failed");
                navigate(`/order-success?orderId=${orderId}&status=failed`);
              }
            } catch (verifyError) {
              console.error("Verification error:", verifyError);
              toast.error("Error verifying payment");
              navigate(`/order-success?orderId=${orderId}&status=unknown`);
            }
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
              toast.info("Payment cancelled");
            }
          }
        };
        
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        return true;
      } else {
        console.error("Invalid payment response:", data);
        setErrorMessage("Payment gateway returned an invalid response");
        toast.error("Payment gateway returned an invalid response");
        setIsProcessing(false);
        return false;
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      setErrorMessage(`Error processing payment: ${err instanceof Error ? err.message : String(err)}`);
      toast.error("Error processing payment");
      setIsProcessing(false);
      return false;
    }
  };
  
  const handleQrPayment = async (orderId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage("");
      
      const paymentType = selectedQr === "owner" ? "myqr" : "upi";
      
      if (!paymentConfirmationNumber) {
        toast.error("Please enter the payment reference ID");
        setIsProcessing(false);
        return false;
      }
      
      // Validate UPI reference ID format
      const upiRegex = /^[A-Za-z0-9]{6,}$/;
      if (!upiRegex.test(paymentConfirmationNumber.trim())) {
        toast.error("Invalid payment reference ID format. Please check and try again.");
        setIsProcessing(false);
        return false;
      }
      
      // First, try to save the order
      const saveSuccess = await saveOrderDetails(orderId, "pending_owner_approval", paymentType);
      
      if (!saveSuccess) {
        console.warn("Failed to save order details in database, but continuing with owner notification");
      }
      
      // Now send notification to the owner via the edge function
      const { data, error } = await supabase.functions.invoke("send-owner-notification", {
        body: {
          orderId,
          customerName: address.fullName,
          amount: total,
          paymentRefId: paymentConfirmationNumber,
          customerPhone: address.phone,
          userId: user?.id || null,
          deliveryAddress: `${address.street}, ${address.city}, ${address.state}, ${address.pincode}`
        }
      });
      
      if (error) {
        console.error("Owner notification error:", error);
        setErrorMessage(`Failed to send notification to restaurant owner: ${error.message || "Unknown error"}`);
        toast.error("Failed to send notification to restaurant owner: " + (error.message || "Unknown error"));
        setIsProcessing(false);
        return false;
      }
      
      toast.success("Order placed! Waiting for payment approval from the restaurant.");
      clearCart();
      navigate(`/order-success?orderId=${orderId}`);
      setIsProcessing(false);
      return true;
    } catch (err) {
      console.error("Payment processing error:", err);
      setErrorMessage(`Error processing payment: ${err instanceof Error ? err.message : String(err)}`);
      toast.error("Error processing payment");
      setIsProcessing(false);
      return false;
    }
  };
  
  const saveOrderDetails = async (orderId: string, status: string, payment_method: string): Promise<boolean> => {
    if (!isBackendConnected) return false;
    
    try {
      console.log("Saving order with ID:", orderId);
      console.log("User ID for order:", user?.id || "null (guest checkout)");
      
      // Create new order directly using edge function to bypass RLS issues
      const { data, error } = await supabase.functions.invoke("save-order", {
        body: {
          orderId,
          status,
          payment_method,
          payment_ref_id: paymentMethod === "qr" ? paymentConfirmationNumber : null,
          total,
          delivery_address: `${address.street}, ${address.city}, ${address.state}, ${address.pincode}`,
          phone: address.phone,
          user_id: user?.id || null,
          customer_name: address.fullName
        }
      });
      
      if (error) {
        console.error("Error saving order details:", error);
        const errorMsg = error.message || "Database error occurred";
        setErrorMessage(`Error saving order: ${errorMsg}`);
        toast.error(`Error saving order: ${errorMsg}`);
        return false;
      }
      
      console.log("Order saved successfully:", data);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Error saving order details:", errorMsg);
      setErrorMessage(`Error saving order: ${errorMsg}`);
      toast.error(`Error saving order: ${errorMsg}`);
      return false;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    
    // Validate form
    if (!address.fullName || !address.phone || !address.street || 
        !address.city || !address.state || !address.pincode) {
      toast.error("Please fill in all address fields");
      return;
    }
    
    // Generate a unique order ID
    const newOrderId = uuidv4();
    setOrderId(newOrderId);
    
    // Handle different payment methods
    if (paymentMethod === "qr") {
      if (showQrDialog) {
        if (paymentConfirmationNumber || showPaymentConfirmation) {
          const success = await handleQrPayment(newOrderId);
          if (success) return;
        } else {
          toast.error("Please enter the payment confirmation number or confirm your payment");
          return;
        }
      } else {
        // Show QR code dialog
        setShowQrDialog(true);
        return;
      }
    } else if (paymentMethod === "phonepe") {
      const success = await handlePhonePePayment(newOrderId);
      if (success) return; // User will be redirected to PhonePe
    } else if (paymentMethod === "stripe") {
      const success = await handleStripePayment(newOrderId);
      if (success) return; // User will be redirected to Stripe
    } else if (paymentMethod === "razorpay") {
      const success = await handleRazorpayPayment(newOrderId);
      if (success) return; // Razorpay modal will open
    }
    
    // Process order for COD payment
    setIsProcessing(true);
    
    try {
      // For COD, we confirm the order immediately
      const saveSuccess = await saveOrderDetails(newOrderId, "pending", "cod");
      
      if (!saveSuccess) {
        setIsProcessing(false);
        return;
      }
      
      // Simulate processing time
      setTimeout(() => {
        toast.success("Order placed successfully!");
        clearCart();
        navigate(`/order-success?orderId=${newOrderId}`);
        setIsProcessing(false);
      }, 1500);
    } catch (err) {
      console.error("Error processing order:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Failed to place order: ${errorMsg}`);
      toast.error("Failed to place order. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleIHavePaid = () => {
    setShowPaymentConfirmation(true);
    setCountdownActive(false);
  };
  
  const confirmPayment = () => {
    // Auto-generate a reference ID if user hasn't provided one
    if (!paymentConfirmationNumber) {
      const autoRefId = `AUTO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setPaymentConfirmationNumber(autoRefId);
    }
    
    // Close the payment confirmation dialog
    setShowPaymentConfirmation(false);
    
    // Submit the form to complete payment
    handleSubmit({
      preventDefault: () => {}
    } as React.FormEvent);
  };
  
  const cancelPayment = () => {
    setShowPaymentConfirmation(false);
    setCountdownActive(false);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Delivery Address Section */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 mr-2 text-fresh-orange" />
                  <h2 className="text-xl font-semibold">Delivery Address</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={address.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={address.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Textarea
                    id="street"
                    name="street"
                    value={address.street}
                    onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={address.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={address.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={address.pincode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Payment Method Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <CreditCard className="h-5 w-5 mr-2 text-fresh-orange" />
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Cash on Delivery */}
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'cod' ? 'border-fresh-orange bg-fresh-orange/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'cod' ? 'border-fresh-orange' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'cod' && <div className="w-3 h-3 rounded-full bg-fresh-orange"></div>}
                        </div>
                        <span className="ml-2 font-medium">Cash on Delivery</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-gray-100 rounded-md py-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">Pay with cash upon delivery</p>
                  </div>

                  {/* PhonePe */}
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'phonepe' ? 'border-fresh-orange bg-fresh-orange/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('phonepe')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'phonepe' ? 'border-fresh-orange' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'phonepe' && <div className="w-3 h-3 rounded-full bg-fresh-orange"></div>}
                        </div>
                        <span className="ml-2 font-medium">PhonePe</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-gray-100 rounded-md py-3">
                      <img 
                        src="/images/phonepe-logo.png" 
                        alt="PhonePe" 
                        className="h-6" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">Secure online payment</p>
                  </div>

                  {/* Stripe (NEW) */}
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'stripe' ? 'border-fresh-orange bg-fresh-orange/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('stripe')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'stripe' ? 'border-fresh-orange' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'stripe' && <div className="w-3 h-3 rounded-full bg-fresh-orange"></div>}
                        </div>
                        <span className="ml-2 font-medium">Card Payment</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-gray-100 rounded-md py-3">
                      <CreditCard className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">Pay with credit/debit card</p>
                  </div>

                  {/* Razorpay (NEW) */}
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'razorpay' ? 'border-fresh-orange bg-fresh-orange/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('razorpay')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'razorpay' ? 'border-fresh-orange' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'razorpay' && <div className="w-3 h-3 rounded-full bg-fresh-orange"></div>}
                        </div>
                        <span className="ml-2 font-medium">Razorpay</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-gray-100 rounded-md py-3">
                      <img 
                        src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/razorpay-logo.svg" 
                        alt="Razorpay" 
                        className="h-6" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://razorpay.com/assets/razorpay-glyph.svg";
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">UPI, Cards, NetBanking</p>
                  </div>

                  {/* QR Code Payment */}
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      paymentMethod === 'qr' ? 'border-fresh-orange bg-fresh-orange/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setPaymentMethod('qr')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'qr' ? 'border-fresh-orange' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'qr' && <div className="w-3 h-3 rounded-full bg-fresh-orange"></div>}
                        </div>
                        <span className="ml-2 font-medium">QR Code</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center bg-gray-100 rounded-md py-3">
                      <QrCode className="h-6 w-6 text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">Scan QR code to pay</p>
                  </div>
                </div>

                {paymentMethod === 'razorpay' && (
                  <div className="mt-6 p-4 border rounded-lg border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-2 mb-3">
                      <img 
                        src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/razorpay-logo.svg" 
                        alt="Razorpay" 
                        className="h-5" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://razorpay.com/assets/razorpay-glyph.svg";
                        }}
                      />
                      <h3 className="text-sm font-medium">Pay with Razorpay</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <img src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/payment-upi.svg" alt="UPI" className="h-8" />
                      <img src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/payment-visa.svg" alt="Visa" className="h-8" />
                      <img src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/payment-mastercard.svg" alt="Mastercard" className="h-8" />
                      <img src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/payment-rupay.svg" alt="Rupay" className="h-8" />
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      Pay securely with Razorpay. You can use UPI, credit/debit cards, net banking, and more payment methods.
                    </p>
                  </div>
                )}

                {paymentMethod === 'qr' && (
                  <div className="mt-6 p-4 border rounded-lg border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-medium mb-3">Select QR Code Type</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Owner's QR */}
                      <div 
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedQr === 'owner' ? 'border-fresh-orange bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedQr('owner')}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            selectedQr === 'owner' ? 'border-fresh-orange' : 'border-gray-300'
                          }`}>
                            {selectedQr === 'owner' && <div className="w-2 h-2 rounded-full bg-fresh-orange"></div>}
                          </div>
                          <span className="ml-2 font-medium">Owner's Personal UPI</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-6">Pay directly to restaurant owner's UPI ID</p>
                      </div>
                      
                      {/* Generic UPI QR */}
                      <div 
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedQr === 'default' ? 'border-fresh-orange bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedQr('default')}
                      >
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            selectedQr === 'default' ? 'border-fresh-orange' : 'border-gray-300'
                          }`}>
                            {selectedQr === 'default' && <div className="w-2 h-2 rounded-full bg-fresh-orange"></div>}
                          </div>
                          <span className="ml-2 font-medium">Restaurant UPI</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 ml-6">Pay to restaurant's business UPI ID</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-sm text-fresh-orange">
                      <p className="font-medium">Important Note:</p>
                      <p className="text-xs text-gray-600 mt-1">
                        After scanning and paying via QR code, you'll need to enter the UPI transaction reference ID.
                        Your order will require approval from the restaurant owner before it's confirmed.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'stripe' && (
                  <div className="mt-6 p-4 border rounded-lg border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-2 mb-3">
                      <CreditCard className="h-4 w-4 text-fresh-orange" />
                      <h3 className="text-sm font-medium">Secure Card Payment</h3>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <img src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/payment-visa.svg" alt="Visa" className="h-8" />
                      <img src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/payment-mastercard.svg" alt="Mastercard" className="h-8" />
                      <img src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/payment-amex.svg" alt="American Express" className="h-8" />
                      <img src="https://cdn.jsdelivr.net/gh/AzadatRahimov/master@main/src/img/payment-rupay.svg" alt="Rupay" className="h-8" />
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      Your card details will be securely processed by Stripe. 
                      You'll be redirected to a secure payment page to complete your purchase.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Special Instructions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Special Instructions (Optional)</h2>
                <Textarea
                  placeholder="Any special requests or delivery instructions..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="max-h-64 overflow-y-auto mb-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div className="flex items-center">
                        <span className="font-medium">{item.quantity} x</span>
                        <span className="ml-2">{item.name}</span>
                      </div>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span>₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full mt-6 bg-fresh-orange hover:bg-fresh-red"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : `Place Order (₹${total.toFixed(2)})`}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
      
      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan & Pay</DialogTitle>
            <DialogDescription>
              Scan the QR code below to complete your payment of ₹{total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
              <img 
                src={selectedQr === "owner" 
                  ? "/lovable-uploads/34adac09-d329-4b09-9f69-e59ff0a5cb02.png" 
                  : "/lovable-uploads/34adac09-d329-4b09-9f69-e59ff0a5cb02.png"} 
                alt="QR Code" 
                className="h-64 w-auto"
              />
            </div>
            
            <div className="w-full space-y-4">
              <div className="text-center">
                <p className="font-medium text-lg">Total: ₹{total.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedQr === "owner" 
                    ? "Pay to: Restaurant Owner (PersonalID@upi)" 
                    : "Pay to: Restaurant Business (BusinessID@upi)"}
                </p>
              </div>
              
              {countdownActive && (
                <div className="flex items-center justify-center gap-2 text-amber-500">
                  <Timer size={16} />
                  <span>Auto-confirm in {countdown} seconds</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="confirmationNumber">Enter UPI Reference Number</Label>
                <Input 
                  id="confirmationNumber"
                  value={paymentConfirmationNumber}
                  onChange={(e) => setPaymentConfirmationNumber(e.target.value)}
                  placeholder="e.g., UPI123456789"
                />
                <p className="text-xs text-gray-500">
                  This helps the restaurant owner verify your payment. You can find this in your UPI payment history.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={handleIHavePaid}
                  disabled={isProcessing}
                >
                  I've Paid
                </Button>
                
                <Button 
                  className="w-full bg-fresh-orange hover:bg-fresh-red"
                  onClick={(e) => {
                    e.preventDefault();
                    if (paymentConfirmationNumber) {
                      handleSubmit(e as any);
                    } else {
                      toast.error("Please enter the payment confirmation number");
                    }
                  }}
                  disabled={!paymentConfirmationNumber || isProcessing}
                >
                  {isProcessing ? "Processing..." : "Confirm Payment"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Payment Confirmation Dialog */}
      <AlertDialog open={showPaymentConfirmation} onOpenChange={setShowPaymentConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Have you completed the payment of ₹{total.toFixed(2)} using the QR code?
              {!paymentConfirmationNumber && (
                <p className="mt-2 text-amber-500">
                  Note: You haven't entered a UPI reference ID. We'll create an auto-generated ID for tracking.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPayment}>No, Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPayment}
              className="bg-fresh-orange hover:bg-fresh-red"
            >
              Yes, I've Paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Footer />
    </div>
  );
};

export default Checkout;
