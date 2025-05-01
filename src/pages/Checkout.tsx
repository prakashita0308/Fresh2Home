
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
        await saveOrderDetails(orderId, "initiated", "phonepe");
        
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
  
  const handleQrPayment = async (orderId: string) => {
    try {
      setIsProcessing(true);
      
      const paymentType = selectedQr === "owner" ? "myqr" : "upi";
      
      // Save order with awaiting confirmation status
      await saveOrderDetails(orderId, "awaiting_confirmation", paymentType);
      
      toast.success("Order placed! Please wait for payment confirmation.");
      clearCart();
      navigate(`/order-success?orderId=${orderId}`);
      setIsProcessing(false);
      return true;
    } catch (err) {
      console.error("Payment processing error:", err);
      toast.error("Error processing payment");
      setIsProcessing(false);
      return false;
    }
  };
  
  const saveOrderDetails = async (orderId: string, status: string, payment_method: string) => {
    if (!isBackendConnected) return;
    
    try {
      // Create new order
      await supabase.from("orders").insert({
        id: orderId,
        status: status,
        payment_method: payment_method,
        total: total,
        delivery_address: `${address.street}, ${address.city}, ${address.state}, ${address.pincode}`,
        phone: address.phone,
        user_id: user?.id
      });
      
      // Save order items and details if needed
      // This would typically be done on the server side after payment confirmation
      // But for COD, we can do it immediately
    } catch (err) {
      console.error("Error saving order details:", err);
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
    if (paymentMethod === "qr") {
      if (showQrDialog) {
        if (!paymentConfirmationNumber) {
          toast.error("Please enter the payment confirmation number");
          return;
        }
        const success = await handleQrPayment(newOrderId);
        if (success) return;
      } else {
        // Show QR code dialog
        setShowQrDialog(true);
        return;
      }
    } else if (paymentMethod === "phonepe") {
      const success = await handlePhonePePayment(newOrderId);
      if (success) return; // User will be redirected to PhonePe
    }
    
    // Process order for COD payment
    setIsProcessing(true);
    
    try {
      // For COD, we confirm the order immediately
      await saveOrderDetails(newOrderId, "pending", "cod");
      
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
              
              {/* Payment Method Section - Completely Redesigned */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <CreditCard className="h-5 w-5 mr-2 text-fresh-orange" />
                  <h2 className="text-xl font-semibold">Payment Method</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        After scanning and paying via QR code, your order will be in "Awaiting Confirmation" status 
                        until the restaurant owner confirms receipt of the payment. This usually takes just a few minutes.
                      </p>
                    </div>
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
              
              <div className="space-y-2">
                <Label htmlFor="confirmationNumber">Enter UPI Reference Number</Label>
                <Input 
                  id="confirmationNumber"
                  value={paymentConfirmationNumber}
                  onChange={(e) => setPaymentConfirmationNumber(e.target.value)}
                  placeholder="e.g., UPI123456789"
                  required
                />
                <p className="text-xs text-gray-500">
                  This helps us verify your payment quickly
                </p>
              </div>
              
              <Button 
                className="w-full bg-fresh-orange hover:bg-fresh-red"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e as any);
                }}
                disabled={!paymentConfirmationNumber}
              >
                Confirm Payment & Place Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Checkout;
