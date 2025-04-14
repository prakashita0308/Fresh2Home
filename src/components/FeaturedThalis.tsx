
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ThaliCard, { ThaliItem } from "./ThaliCard";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const FeaturedThalis = () => {
  const [featuredThalis, setFeaturedThalis] = useState<ThaliItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedThalis = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('is_popular', { ascending: false })
          .limit(4);
        
        if (error) {
          throw error;
        }

        if (data) {
          // Map the database schema to our ThaliItem interface
          const thaliItems: ThaliItem[] = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || "",
            price: Number(item.price),
            image: item.image_url || "/images/default-food.jpg",
            category: item.category,
            isVeg: item.is_veg,
            isPopular: item.is_popular
          }));
          
          setFeaturedThalis(thaliItems);
        }
      } catch (error) {
        console.error("Error fetching featured thalis:", error);
        // Fallback to sample data if there's an error
        setFeaturedThalis([
          {
            id: "1",
            name: "Gujarati Thali",
            description: "A complete meal with dal, kadhi, rotis, rice, vegetables and sweet dish",
            price: 299,
            image: "/images/gujarati-thali.jpg",
            category: "thali",
            isVeg: true,
            isPopular: true
          },
          {
            id: "2",
            name: "Punjabi Thali",
            description: "Rich and flavorful thali with butter chicken, dal makhani, naan, pulao and more",
            price: 349,
            image: "/images/punjabi-thali.jpg",
            category: "thali",
            isVeg: false,
            isPopular: true
          },
          {
            id: "3",
            name: "South Indian Thali",
            description: "A delicious assortment of sambhar, rasam, rice, vegetables and payasam",
            price: 279,
            image: "/images/south-indian-thali.jpg",
            category: "thali",
            isVeg: true
          },
          {
            id: "4",
            name: "Bengali Thali",
            description: "Authentic Bengali dishes including fish curry, luchi, cholar dal and mishti doi",
            price: 329,
            image: "/images/bengali-thali.jpg",
            category: "thali",
            isVeg: false
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedThalis();
  }, []);

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
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-72 bg-gray-200 rounded-md animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredThalis.map(thali => (
            <ThaliCard key={thali.id} thali={thali} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedThalis;
