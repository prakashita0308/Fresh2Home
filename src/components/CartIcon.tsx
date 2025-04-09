
import { useContext } from "react";
import { ShoppingCart } from "lucide-react";
import { CartContext } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";

const CartIcon = () => {
  const { items } = useContext(CartContext);
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="relative">
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-fresh-red text-white p-0 text-xs">
          {itemCount}
        </Badge>
      )}
    </div>
  );
};

export default CartIcon;
