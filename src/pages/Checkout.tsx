import { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartContext } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Check, CreditCard, MapPin, Smartphone, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

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
  const [upiId, setUpiId] = useState("");
  const [upiProvider, setUpiProvider] = useState("phonepe");
  const [showQrCode, setShowQrCode] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState("");
  
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  // Check for payment errors
  useEffect(() => {
    if (paymentError === 'payment_failed') {
      toast.error("Payment failed. Please try again.");
    }
  }, [paymentError]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePhonePePayment = async (orderId: string) => {
    try {
      setIsProcessing(true);
      
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
          customerEmail: user?.email || ""
        }
      });
      
      if (error) {
        console.error("Payment error:", error);
        toast.error("Failed to initiate payment: " + (error.message || "Unknown error"));
        setIsProcessing(false);
        return false;
      }
      
      if (data && data.success && data.data && data.data.instrumentResponse && data.data.instrumentResponse.redirectInfo) {
        // Save order details before redirecting
        await saveOrderDetails(orderId, "initiated");
        
        // Redirect the user to the PhonePe payment page
        window.location.href = data.data.instrumentResponse.redirectInfo.url;
        return true;
      } else {
        console.error("Invalid payment response:", data);
        toast.error("Payment gateway returned an invalid response");
        setIsProcessing(false);
        return false;
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      toast.error("Error processing payment");
      setIsProcessing(false);
      return false;
    }
  };
  
  const handleUpiQrPayment = async (orderId: string) => {
    try {
      setIsProcessing(true);
      
      // Show toast message to user about scanning QR code
      toast.success("Please scan the QR code and complete payment");
      
      // Save order with pending status
      await saveOrderDetails(orderId, "pending");
      
      // In a real scenario, you would implement a webhook or callback verification
      // For now, we'll use a simple timer to simulate payment verification
      setTimeout(() => {
        // Update payment status
        updatePaymentStatus(orderId, "completed");
        
        toast.success("Payment received! Your order has been placed.");
        clearCart();
        navigate(`/order-success?orderId=${orderId}&status=success`);
        setIsProcessing(false);
      }, 5000);
      
      return true;
    } catch (err) {
      console.error("Payment processing error:", err);
      toast.error("Error processing payment");
      setIsProcessing(false);
      return false;
    }
  };
  
  const saveOrderDetails = async (orderId: string, status: string) => {
    if (!isBackendConnected) return;
    
    try {
      // Log payment transaction
      await supabase.from("payment_transactions").insert({
        order_id: orderId,
        amount: total,
        payment_method: paymentMethod === "upi" ? (showQrCode ? "upi" : upiProvider) : paymentMethod,
        status: status,
        customer_details: {
          name: address.fullName,
          phone: address.phone,
          email: user?.email || "",
          address: `${address.street}, ${address.city}, ${address.state}, ${address.pincode}`
        }
      });
      
      // Save order items and details if needed
      // This would typically be done on the server side after payment confirmation
      // But for COD, we can do it immediately
    } catch (err) {
      console.error("Error saving order details:", err);
    }
  };
  
  const updatePaymentStatus = async (orderId: string, status: string) => {
    if (!isBackendConnected) return;
    
    try {
      await supabase.from("payment_transactions").update({
        status: status,
        updated_at: new Date().toISOString()
      }).eq("order_id", orderId);
    } catch (err) {
      console.error("Error updating payment status:", err);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    if (paymentMethod === "upi") {
      if (showQrCode) {
        // Handle QR code payment
        const success = await handleUpiQrPayment(newOrderId);
        if (success) return;
      } else if (upiProvider === "phonepe" && !showQrCode) {
        const success = await handlePhonePePayment(newOrderId);
        if (success) return; // User will be redirected to PhonePe
      } else if (!upiId) {
        // Validate UPI ID for other UPI options
        toast.error("Please enter a valid UPI ID");
        return;
      }
    }
    
    // Process order for COD payment
    setIsProcessing(true);
    
    try {
      // For COD, we confirm the order immediately
      await saveOrderDetails(newOrderId, "pending");
      
      // Simulate processing time
      setTimeout(() => {
        toast.success("Order placed successfully!");
        clearCart();
        navigate(`/order-success?orderId=${newOrderId}`);
        setIsProcessing(false);
      }, 1500);
    } catch (err) {
      console.error("Error processing order:", err);
      toast.error("Failed to place order. Please try again.");
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
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
                <div className="flex items-center mb-4">
                  <CreditCard className="h-5 w-5 mr-2 text-fresh-orange" />
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod">Cash on Delivery</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online">Online Payment (Credit/Debit Card)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi">UPI Payment</Label>
                  </div>
                </RadioGroup>
                
                {/* UPI Payment Options - Show only when UPI is selected */}
                {paymentMethod === "upi" && (
                  <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <Label>Payment Method</Label>
                      <div className="flex items-center space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className={!showQrCode ? "bg-fresh-orange/10 border-fresh-orange text-fresh-orange" : ""}
                          onClick={() => setShowQrCode(false)}
                        >
                          UPI Apps
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className={showQrCode ? "bg-fresh-orange/10 border-fresh-orange text-fresh-orange" : ""}
                          onClick={() => setShowQrCode(true)}
                        >
                          QR Code
                        </Button>
                      </div>
                    </div>

                    {!showQrCode ? (
                      // ... keep existing code (UPI apps section)
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="upiId">UPI ID</Label>
                          <Input
                            id="upiId"
                            placeholder="yourname@upi"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            required={paymentMethod === "upi" && upiProvider !== "phonepe"}
                            disabled={upiProvider === "phonepe"}
                          />
                          {upiProvider === "phonepe" && (
                            <p className="text-sm text-gray-500">UPI ID not needed for PhonePe direct payment</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Select UPI Provider</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                            <div
                              className={`cursor-pointer border rounded-md p-4 flex items-center justify-center ${
                                upiProvider === "phonepe" ? "border-fresh-orange bg-fresh-orange/10" : "border-gray-200"
                              }`}
                              onClick={() => setUpiProvider("phonepe")}
                            >
                              <div className="text-center">
                                <img 
                                  src="/images/phonepe-logo.png" 
                                  alt="PhonePe" 
                                  className="h-8 mx-auto mb-2" 
                                />
                                <span className="text-sm font-medium">PhonePe</span>
                                {upiProvider === "phonepe" && (
                                  <div className="flex items-center justify-center mt-1">
                                    <span className="text-xs text-fresh-orange">Direct Payment</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div
                              className={`cursor-pointer border rounded-md p-4 flex items-center justify-center ${
                                upiProvider === "googlepay" ? "border-fresh-orange bg-fresh-orange/10" : "border-gray-200"
                              }`}
                              onClick={() => setUpiProvider("googlepay")}
                            >
                              <div className="text-center">
                                <img 
                                  src="/images/googlepay-logo.png" 
                                  alt="Google Pay" 
                                  className="h-8 mx-auto mb-2" 
                                />
                                <span className="text-sm font-medium">Google Pay</span>
                              </div>
                            </div>
                            
                            <div
                              className={`cursor-pointer border rounded-md p-4 flex items-center justify-center ${
                                upiProvider === "paytm" ? "border-fresh-orange bg-fresh-orange/10" : "border-gray-200"
                              }`}
                              onClick={() => setUpiProvider("paytm")}
                            >
                              <div className="text-center">
                                <img 
                                  src="/images/paytm-logo.png" 
                                  alt="Paytm" 
                                  className="h-8 mx-auto mb-2" 
                                />
                                <span className="text-sm font-medium">Paytm</span>
                              </div>
                            </div>
                            
                            <div
                              className={`cursor-pointer border rounded-md p-4 flex items-center justify-center ${
                                upiProvider === "other" ? "border-fresh-orange bg-fresh-orange/10" : "border-gray-200"
                              }`}
                              onClick={() => setUpiProvider("other")}
                            >
                              <div className="text-center">
                                <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                <span className="text-sm font-medium">Other UPI</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {upiProvider === "phonepe" && (
                          <div className="mt-4 space-y-4 p-4 bg-white rounded-md border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <img 
                                src="/images/phonepe-logo.png" 
                                alt="PhonePe" 
                                className="h-8" 
                              />
                              <div>
                                <p className="font-medium">Pay using PhonePe</p>
                                <p className="text-sm text-gray-500">You'll be redirected to PhonePe to complete your payment</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-md border border-gray-200">
                        <div className="mb-4">
                          <QrCode className="h-6 w-6 text-fresh-orange mb-2 mx-auto" />
                          <h3 className="text-lg font-medium text-center">Scan & Pay</h3>
                        </div>
                        
                        <div className="bg-white p-4 rounded-md border border-gray-200 mb-4">
                          <img 
                            src="/lovable-uploads/34adac09-d329-4b09-9f69-e59ff0a5cb02.png" 
                            alt="PhonePe QR Code" 
                            className="h-64 w-auto"
                          />
                        </div>
                        
                        <div className="text-center space-y-2">
                          <p className="font-medium">Total Amount: ₹{total.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Scan this QR code with any UPI app</p>
                          <p className="text-sm font-medium text-fresh-orange">Pay to: ******7955</p>
                        </div>
                      </div>
                    )}
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
      <Footer />
    </div>
  );
};

export default Checkout;
