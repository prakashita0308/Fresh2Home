
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Check, CreditCard, MapPin, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

const Checkout = () => {
  const { items, subtotal, clearCart } = useContext(CartContext);
  const { user, isBackendConnected } = useAuth();
  const navigate = useNavigate();
  
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
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!address.fullName || !address.phone || !address.street || 
        !address.city || !address.state || !address.pincode) {
      toast.error("Please fill in all address fields");
      return;
    }
    
    // Generate a unique order ID
    const orderId = uuidv4();
    
    // Handle different payment methods
    if (paymentMethod === "upi") {
      // Check if it's PhonePe UPI option
      if (upiProvider === "phonepe") {
        const success = await handlePhonePePayment(orderId);
        if (success) return; // User will be redirected to PhonePe
      } else if (!upiId) {
        // Validate UPI ID for other UPI options
        toast.error("Please enter a valid UPI ID");
        return;
      }
    }
    
    // Process order for other payment methods
    setIsProcessing(true);
    
    // In a real application, this would send data to a server
    console.log("Order placed:", {
      orderId,
      items,
      address,
      paymentMethod,
      upiDetails: paymentMethod === "upi" ? { upiId, provider: upiProvider } : null,
      specialInstructions,
      total
    });
    
    // Simulate processing time
    setTimeout(() => {
      toast.success("Order placed successfully!");
      clearCart();
      navigate("/order-success");
      setIsProcessing(false);
    }, 1500);
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
