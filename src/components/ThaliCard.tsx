
import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CartContext } from "@/context/CartContext";

export interface ThaliItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isPopular?: boolean;
}

interface ThaliCardProps {
  thali: ThaliItem;
}

const ThaliCard = ({ thali }: ThaliCardProps) => {
  const { addToCart } = useContext(CartContext);

  return (
    <Card className="overflow-hidden thali-card transition-all duration-300">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thali.image}
          alt={thali.name}
          className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
        />
        {thali.isVeg ? (
          <Badge className="absolute top-2 right-2 bg-fresh-green text-white">Veg</Badge>
        ) : (
          <Badge className="absolute top-2 right-2 bg-fresh-red text-white">Non-Veg</Badge>
        )}
        {thali.isPopular && (
          <Badge className="absolute top-2 left-2 bg-fresh-yellow text-black">Popular</Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-xl font-semibold">{thali.name}</h3>
        <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{thali.description}</p>
        <p className="text-fresh-orange font-bold mt-2">₹{thali.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-fresh-orange hover:bg-fresh-red"
          onClick={() => addToCart(thali, 1)}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ThaliCard;
