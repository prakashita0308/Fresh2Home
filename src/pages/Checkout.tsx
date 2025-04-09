
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
import { Check, CreditCard, MapPin } from "lucide-react";

const Checkout = () => {
  const { items, subtotal, clearCart } = useContext(CartContext);
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
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!address.fullName || !address.phone || !address.street || 
        !address.city || !address.state || !address.pincode) {
      toast.error("Please fill in all address fields");
      return;
    }
    
    // Process order - In a real application, this would send data to a server
    console.log("Order placed:", {
      items,
      address,
      paymentMethod,
      specialInstructions,
      total
    });
    
    toast.success("Order placed successfully!");
    
    // Clear cart and redirect to success page
    clearCart();
    navigate("/order-success");
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online">Online Payment (Credit/Debit Card, UPI)</Label>
                  </div>
                </RadioGroup>
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
                >
                  Place Order
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
