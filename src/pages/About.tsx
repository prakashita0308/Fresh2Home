
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero section */}
        <div className="relative bg-gradient-to-r from-fresh-orange to-fresh-red h-[400px] flex items-center justify-center text-white">
          <div className="container px-4 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Story</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 opacity-90">
              From humble beginnings to India's favorite home-cooked food delivery service
            </p>
          </div>
        </div>
        
        {/* Company history */}
        <section className="py-16 container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">How We Started</h2>
              <p className="mb-4 text-gray-700">
                Fresh2Home began in 2020 when our founder, Priya Sharma, realized there was a gap in the 
                food delivery market. While restaurant food was readily available for delivery, 
                authentic home-cooked meals were not.
              </p>
              <p className="mb-4 text-gray-700">
                Having grown up in a family where food was an expression of love, Priya wanted to bring 
                that same feeling to busy professionals and families who craved home-style cooking but lacked 
                the time to prepare it themselves.
              </p>
              <p className="mb-4 text-gray-700">
                Starting with just five home chefs in Mumbai, Fresh2Home has grown to partner with over 500 
                talented home cooks across 10 major cities in India, serving thousands of customers daily.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img 
                src="/images/about-story.jpg" 
                alt="Fresh2Home founders" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>
        
        {/* Our mission */}
        <section className="py-16 bg-fresh-beige">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg max-w-3xl mx-auto text-gray-700">
                To connect talented home cooks with food lovers seeking authentic, homemade meals, 
                preserving culinary traditions while providing convenient, healthy alternatives to 
                restaurant food.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <img 
                  src="/images/mission-authenticity.jpg" 
                  alt="Authentic cooking" 
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Authenticity</h3>
                <p className="text-gray-600">
                  We believe in preserving authentic recipes and traditional cooking methods passed 
                  down through generations.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <img 
                  src="/images/mission-community.jpg" 
                  alt="Community of chefs" 
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Community</h3>
                <p className="text-gray-600">
                  We empower home chefs, particularly women, to turn their cooking skills into 
                  sustainable livelihoods while working from home.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <img 
                  src="/images/mission-quality.jpg" 
                  alt="Quality ingredients" 
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <h3 className="text-xl font-semibold mb-2">Quality</h3>
                <p className="text-gray-600">
                  We use fresh, locally sourced ingredients and maintain strict quality standards for 
                  all meals prepared by our network of home chefs.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-16 bg-white text-center">
          <div className="container px-4">
            <h2 className="text-3xl font-bold mb-4">Join Our Fresh2Home Family</h2>
            <p className="text-lg max-w-2xl mx-auto mb-8">
              Experience the taste of authentic home-cooked meals delivered to your doorstep.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/menu">
                <Button className="bg-fresh-orange hover:bg-fresh-red text-white">
                  Explore Our Menu
                </Button>
              </Link>
              <Link to="/chefs">
                <Button variant="outline">
                  Meet Our Chefs
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
