
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Chef profiles data
const chefs = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Founder & Head Chef",
    specialty: "North Indian Cuisine",
    location: "Mumbai",
    image: "/images/chef-priya.jpg",
    bio: "With over 15 years of cooking experience, Priya specializes in authentic Punjabi and Gujarati cuisine. Her butter chicken and dal makhani are customer favorites."
  },
  {
    id: 2,
    name: "Rajesh Patel",
    role: "Senior Chef",
    specialty: "Gujarati Cuisine",
    location: "Ahmedabad",
    image: "/images/chef-rajesh.jpg",
    bio: "Rajesh comes from a family of traditional Gujarati cooks. His thalis are known for their perfect balance of sweet, spicy, and savory flavors."
  },
  {
    id: 3,
    name: "Lakshmi Rao",
    role: "Regional Chef",
    specialty: "South Indian Cuisine",
    location: "Bangalore",
    image: "/images/chef-lakshmi.jpg",
    bio: "Lakshmi brings authentic South Indian flavors to Fresh2Home. Her dosas, idlis, and sambhar have earned her a loyal customer following."
  },
  {
    id: 4,
    name: "Anita Desai",
    role: "Dessert Specialist",
    specialty: "Indian Sweets",
    location: "Delhi",
    image: "/images/chef-anita.jpg",
    bio: "A pastry chef by training, Anita combines traditional Indian sweet-making techniques with modern presentation. Her gulab jamun and rasgulla are bestsellers."
  },
  {
    id: 5,
    name: "Mohammed Khan",
    role: "Regional Chef",
    specialty: "Mughlai Cuisine",
    location: "Lucknow",
    image: "/images/chef-mohammed.jpg",
    bio: "Mohammed is a third-generation chef specializing in Mughlai cuisine. His biryani, kebabs, and korma dishes transport customers to the royal kitchens of the Mughal era."
  },
  {
    id: 6,
    name: "Suman Chatterjee",
    role: "Regional Chef",
    specialty: "Bengali Cuisine",
    location: "Kolkata",
    image: "/images/chef-suman.jpg",
    bio: "Suman is passionate about Bengali cuisine. Her fish curry, mishti doi, and rasgulla are prepared following traditional recipes passed down in her family."
  }
];

const Chefs = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero section */}
        <div className="relative bg-gradient-to-r from-fresh-red to-fresh-orange h-[400px] flex items-center justify-center text-white">
          <div className="container px-4 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Meet Our Chefs</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 opacity-90">
              The talented culinary artists behind our delicious home-cooked meals
            </p>
          </div>
        </div>
        
        {/* Chef profiles */}
        <section className="py-16 container px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {chefs.map(chef => (
              <div key={chef.id} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="h-64 overflow-hidden">
                  <img 
                    src={chef.image} 
                    alt={chef.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{chef.name}</h3>
                  <p className="text-fresh-orange font-medium mb-2">{chef.role}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-fresh-beige text-fresh-orange text-xs px-2 py-1 rounded-full">
                      {chef.specialty}
                    </span>
                    <span className="bg-fresh-beige text-gray-700 text-xs px-2 py-1 rounded-full">
                      {chef.location}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{chef.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Join us section */}
        <section className="py-16 bg-fresh-beige">
          <div className="container px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Become a Fresh2Home Chef</h2>
            <p className="text-lg max-w-2xl mx-auto mb-8">
              Are you passionate about cooking? Join our network of home chefs and turn your 
              culinary skills into an income while working from the comfort of your home.
            </p>
            <Button className="bg-fresh-orange hover:bg-fresh-red text-white">
              Apply Now
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Chefs;
