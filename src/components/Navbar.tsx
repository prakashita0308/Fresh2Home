
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ShoppingCart, User, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import CartIcon from "./CartIcon";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-fresh-orange">Fresh2Home</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/" className="text-sm font-medium hover:text-fresh-orange transition-colors p-2">
                  Home
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium">Menu</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid grid-cols-2 gap-3 p-4 w-[400px]">
                    <Link to="/menu" className="flex flex-col space-y-1 p-3 hover:bg-accent rounded-md">
                      <div className="font-medium">All Items</div>
                      <div className="text-xs text-muted-foreground">Our complete menu selection</div>
                    </Link>
                    <Link to="/menu?category=thali" className="flex flex-col space-y-1 p-3 hover:bg-accent rounded-md">
                      <div className="font-medium">Thalis</div>
                      <div className="text-xs text-muted-foreground">Complete meal combinations</div>
                    </Link>
                    <Link to="/menu?category=main" className="flex flex-col space-y-1 p-3 hover:bg-accent rounded-md">
                      <div className="font-medium">Main Courses</div>
                      <div className="text-xs text-muted-foreground">Delicious entrees and curries</div>
                    </Link>
                    <Link to="/menu?category=breakfast" className="flex flex-col space-y-1 p-3 hover:bg-accent rounded-md">
                      <div className="font-medium">Breakfast</div>
                      <div className="text-xs text-muted-foreground">Morning specialties</div>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium">About</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid grid-cols-1 gap-3 p-4 w-[300px]">
                    <Link to="/about" className="flex flex-col space-y-1 p-3 hover:bg-accent rounded-md">
                      <div className="font-medium">Our Story</div>
                      <div className="text-xs text-muted-foreground">Learn about Fresh2Home</div>
                    </Link>
                    <Link to="/chefs" className="flex flex-col space-y-1 p-3 hover:bg-accent rounded-md">
                      <div className="font-medium">Our Chefs</div>
                      <div className="text-xs text-muted-foreground">Meet the team behind the food</div>
                    </Link>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/contact" className="text-sm font-medium hover:text-fresh-orange transition-colors p-2">
                  Contact
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            <Link to="/cart">
              <CartIcon />
            </Link>
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <User size={16} />
                <span>Login</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-4">
          <Link to="/cart">
            <CartIcon />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-fresh-orange">Fresh2Home</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="mt-6 flex flex-col gap-4">
              <Link 
                to="/" 
                className="text-lg font-medium hover:text-fresh-orange transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-lg font-medium">Menu</span>
                  <ChevronDown size={16} className="ml-1"/>
                </div>
                <div className="pl-4 space-y-2">
                  <Link 
                    to="/menu" 
                    className="block text-muted-foreground hover:text-fresh-orange"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    All Items
                  </Link>
                  <Link 
                    to="/menu?category=thali" 
                    className="block text-muted-foreground hover:text-fresh-orange"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Thalis
                  </Link>
                  <Link 
                    to="/menu?category=main" 
                    className="block text-muted-foreground hover:text-fresh-orange"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Main Courses
                  </Link>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-lg font-medium">About</span>
                  <ChevronDown size={16} className="ml-1"/>
                </div>
                <div className="pl-4 space-y-2">
                  <Link 
                    to="/about" 
                    className="block text-muted-foreground hover:text-fresh-orange"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Our Story
                  </Link>
                  <Link 
                    to="/chefs" 
                    className="block text-muted-foreground hover:text-fresh-orange"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Our Chefs
                  </Link>
                </div>
              </div>
              
              <Link 
                to="/contact" 
                className="text-lg font-medium hover:text-fresh-orange transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                to="/login" 
                className="text-lg font-medium hover:text-fresh-orange transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
