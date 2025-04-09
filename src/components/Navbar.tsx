
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ShoppingCart, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import CartIcon from "./CartIcon";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-fresh-orange">Fresh2Home</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6">
            <Link to="/" className="text-sm font-medium hover:text-fresh-orange transition-colors">
              Home
            </Link>
            <Link to="/menu" className="text-sm font-medium hover:text-fresh-orange transition-colors">
              Menu
            </Link>
            <Link to="#" className="text-sm font-medium hover:text-fresh-orange transition-colors">
              About
            </Link>
            <Link to="#" className="text-sm font-medium hover:text-fresh-orange transition-colors">
              Contact
            </Link>
          </nav>

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
              <Link 
                to="/menu" 
                className="text-lg font-medium hover:text-fresh-orange transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Menu
              </Link>
              <Link 
                to="#" 
                className="text-lg font-medium hover:text-fresh-orange transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="#" 
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
