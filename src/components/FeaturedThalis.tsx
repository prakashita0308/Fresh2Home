
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThaliCard, { ThaliItem } from "./ThaliCard";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

// Sample data for featured thalis
const featuredThalis: ThaliItem[] = [
  {
    id: "1",
    name: "Gujarati Thali",
    description: "A complete meal with dal, kadhi, rotis, rice, vegetables and sweet dish",
    price: 299,
    image: "/placeholder.svg",
    category: "thali",
    isVeg: true,
    isPopular: true
  },
  {
    id: "2",
    name: "Punjabi Thali",
    description: "Rich and flavorful thali with butter chicken, dal makhani, naan, pulao and more",
    price: 349,
    image: "/placeholder.svg",
    category: "thali",
    isVeg: false,
    isPopular: true
  },
  {
    id: "3",
    name: "South Indian Thali",
    description: "A delicious assortment of sambhar, rasam, rice, vegetables and payasam",
    price: 279,
    image: "/placeholder.svg",
    category: "thali",
    isVeg: true
  },
  {
    id: "4",
    name: "Bengali Thali",
    description: "Authentic Bengali dishes including fish curry, luchi, cholar dal and mishti doi",
    price: 329,
    image: "/placeholder.svg",
    category: "thali",
    isVeg: false
  }
];

const FeaturedThalis = () => {
  return (
    <section className="py-16 container px-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Featured Thalis</h2>
        <Link to="/menu">
          <Button variant="ghost" className="gap-1 text-fresh-orange hover:text-fresh-red">
            See All <ChevronRight size={16} />
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredThalis.map(thali => (
          <ThaliCard key={thali.id} thali={thali} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedThalis;
