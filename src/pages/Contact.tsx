
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you for your message! We'll get back to you soon.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero section */}
        <div className="relative bg-gradient-to-r from-fresh-green to-fresh-orange h-[300px] flex items-center justify-center text-white">
          <div className="container px-4 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto">
              We'd love to hear from you! Reach out with questions, feedback, or partnership inquiries.
            </p>
          </div>
        </div>
        
        {/* Contact form and info */}
        <section className="py-16 container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact form */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Your Name
                    </label>
                    <Input id="name" placeholder="John Doe" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input id="email" type="email" placeholder="john@example.com" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input id="subject" placeholder="How can we help you?" required />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Your Message
                  </label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us more about your inquiry..." 
                    rows={5}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-fresh-orange hover:bg-fresh-red text-white"
                >
                  Send Message
                </Button>
              </form>
            </div>
            
            {/* Contact information */}
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-fresh-beige p-3 rounded-full">
                      <MapPin className="h-6 w-6 text-fresh-orange" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Our Headquarters</h3>
                      <p className="text-gray-600">
                        Fresh2Home Building, 123 Food Street,<br />
                        Andheri East, Mumbai 400069,<br />
                        Maharashtra, India
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-fresh-beige p-3 rounded-full">
                      <Phone className="h-6 w-6 text-fresh-orange" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Phone Numbers</h3>
                      <p className="text-gray-600">
                        Customer Support: +91 1234567890<br />
                        Chef Partnerships: +91 9876543210<br />
                        Corporate Orders: +91 8765432109
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="bg-fresh-beige p-3 rounded-full">
                      <Mail className="h-6 w-6 text-fresh-orange" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Email Addresses</h3>
                      <p className="text-gray-600">
                        General Inquiries: info@fresh2home.com<br />
                        Customer Support: support@fresh2home.com<br />
                        Chef Applications: chef@fresh2home.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold mb-6">Operating Hours</h2>
                <div className="bg-fresh-beige p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">Monday - Friday:</div>
                    <div>9:00 AM - 10:00 PM</div>
                    
                    <div className="font-medium">Saturday:</div>
                    <div>8:00 AM - 10:00 PM</div>
                    
                    <div className="font-medium">Sunday:</div>
                    <div>8:00 AM - 9:00 PM</div>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    * Delivery times may vary based on your location and chef availability
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Map section */}
        <section className="py-8 container px-4">
          <div className="bg-gray-200 rounded-lg overflow-hidden h-[400px] relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/images/map.jpg" 
                alt="Map location" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
