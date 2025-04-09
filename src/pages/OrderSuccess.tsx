
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const OrderSuccess = () => {
  // Generate a random order number
  const orderNumber = Math.floor(100000 + Math.random() * 900000);
  
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
              <span className="font-medium">{orderNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Estimated Delivery:</span>
              <span className="font-medium">30-45 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">Cash on Delivery</span>
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
