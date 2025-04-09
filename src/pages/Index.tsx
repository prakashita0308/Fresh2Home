
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedThalis from "@/components/FeaturedThalis";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <FeaturedThalis />
        
        {/* How it works section */}
        <section className="bg-fresh-beige py-16">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-fresh-orange h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">1</div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Meal</h3>
                <p className="text-gray-600">Browse our extensive menu of authentic home-cooked Indian dishes and thalis.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-fresh-orange h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">2</div>
                <h3 className="text-xl font-semibold mb-2">Place Your Order</h3>
                <p className="text-gray-600">Select your favorite dishes, customize as needed, and proceed to checkout.</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-fresh-orange h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">3</div>
                <h3 className="text-xl font-semibold mb-2">Enjoy Your Food</h3>
                <p className="text-gray-600">We'll deliver your delicious meals right to your doorstep, fresh and ready to eat.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials section */}
        <section className="py-16 container px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex text-fresh-yellow mb-2">
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
              </div>
              <p className="italic mb-4">"The Gujarati Thali was absolutely delicious! It reminded me of my mom's cooking. Will definitely order again."</p>
              <p className="font-semibold">- Priya S.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex text-fresh-yellow mb-2">
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
              </div>
              <p className="italic mb-4">"Fast delivery and the food was still piping hot. The Punjabi Thali was flavorful and portions were generous."</p>
              <p className="font-semibold">- Rahul M.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex text-fresh-yellow mb-2">
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
                <Star className="fill-current" size={20} />
              </div>
              <p className="italic mb-4">"I've tried many food delivery services, but Fresh2Home truly stands out for the authentic homemade taste. Love it!"</p>
              <p className="font-semibold">- Ananya K.</p>
            </div>
          </div>
        </section>
        
        {/* CTA section */}
        <section className="bg-fresh-red text-white py-16">
          <div className="container px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience Authentic Home Cooking?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">Order now and taste the difference of fresh, homemade meals delivered to your doorstep.</p>
            <Button className="bg-white text-fresh-red hover:bg-fresh-beige hover:text-fresh-red text-lg px-8 py-6 h-auto">
              Order Now
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
