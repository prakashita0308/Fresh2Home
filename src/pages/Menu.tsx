
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThaliCard, { ThaliItem } from "@/components/ThaliCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

// Sample menu data
const menuItems: ThaliItem[] = [
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
  },
  {
    id: "5",
    name: "Rajasthani Thali",
    description: "Traditional Rajasthani dishes like dal baati churma, gatte ki sabzi, and more",
    price: 319,
    image: "/placeholder.svg",
    category: "thali",
    isVeg: true
  },
  {
    id: "6",
    name: "Butter Chicken",
    description: "Tender chicken cooked in a rich tomato and butter gravy",
    price: 249,
    image: "/placeholder.svg",
    category: "main",
    isVeg: false,
    isPopular: true
  },
  {
    id: "7",
    name: "Paneer Tikka Masala",
    description: "Grilled paneer cubes in a creamy tomato sauce with bell peppers",
    price: 229,
    image: "/placeholder.svg",
    category: "main",
    isVeg: true,
    isPopular: true
  },
  {
    id: "8",
    name: "Dal Makhani",
    description: "Creamy black lentils slow-cooked with butter and spices",
    price: 179,
    image: "/placeholder.svg",
    category: "main",
    isVeg: true
  },
  {
    id: "9",
    name: "Masala Dosa",
    description: "Crispy rice crepe filled with spiced potato filling, served with sambar and chutney",
    price: 159,
    image: "/placeholder.svg",
    category: "breakfast",
    isVeg: true,
    isPopular: true
  },
  {
    id: "10",
    name: "Pav Bhaji",
    description: "Mashed vegetable curry served with butter-toasted buns",
    price: 149,
    image: "/placeholder.svg",
    category: "breakfast",
    isVeg: true
  },
  {
    id: "11",
    name: "Gulab Jamun",
    description: "Soft milk solids dumplings soaked in rose-scented sugar syrup",
    price: 99,
    image: "/placeholder.svg",
    category: "dessert",
    isVeg: true
  },
  {
    id: "12",
    name: "Rasgulla",
    description: "Soft and spongy cottage cheese balls in sugar syrup",
    price: 99,
    image: "/placeholder.svg",
    category: "dessert",
    isVeg: true
  }
];

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vegFilter, setVegFilter] = useState<boolean | null>(null);
  
  // Filter and search functionality
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVegFilter = vegFilter === null || item.isVeg === vegFilter;
    return matchesSearch && matchesVegFilter;
  });
  
  // Get all categories
  const categories = ["all", ...new Set(menuItems.map(item => item.category))];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Menu header */}
        <div className="bg-fresh-orange text-white py-12">
          <div className="container px-4">
            <h1 className="text-4xl font-bold mb-4">Our Menu</h1>
            <p className="text-lg max-w-2xl">
              Discover our wide range of authentic Indian dishes made with love and traditional recipes.
              From thalis to individual dishes, we have something for everyone.
            </p>
          </div>
        </div>
        
        {/* Filters and search */}
        <div className="container px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            <div className="relative w-full md:w-auto flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for dishes..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button 
                variant={vegFilter === null ? "default" : "outline"} 
                onClick={() => setVegFilter(null)}
                className={vegFilter === null ? "bg-fresh-orange hover:bg-fresh-red" : ""}
              >
                All
              </Button>
              <Button 
                variant={vegFilter === true ? "default" : "outline"} 
                onClick={() => setVegFilter(true)}
                className={vegFilter === true ? "bg-fresh-green hover:bg-fresh-green/90" : ""}
              >
                Veg Only
              </Button>
              <Button 
                variant={vegFilter === false ? "default" : "outline"} 
                onClick={() => setVegFilter(false)}
                className={vegFilter === false ? "bg-fresh-red hover:bg-fresh-red/90" : ""}
              >
                Non-Veg
              </Button>
            </div>
          </div>
          
          {/* Menu categories */}
          <Tabs defaultValue="all">
            <TabsList className="mb-8 flex flex-wrap">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* All items tab */}
            <TabsContent value="all">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                  <ThaliCard key={item.id} thali={item} />
                ))}
              </div>
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-semibold mb-2">No items found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </TabsContent>
            
            {/* Category tabs */}
            {categories.filter(cat => cat !== "all").map(category => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems
                    .filter(item => item.category === category)
                    .map(item => (
                      <ThaliCard key={item.id} thali={item} />
                    ))}
                </div>
                {filteredItems.filter(item => item.category === category).length === 0 && (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold mb-2">No items found in this category</h3>
                    <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Menu;
