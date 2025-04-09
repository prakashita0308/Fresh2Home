
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-fresh-orange">Fresh2Home</h3>
            <p className="text-gray-300 mb-4">
              Bringing authentic home-cooked Indian meals right to your doorstep. 
              Taste the tradition, feel the love in every bite.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-fresh-orange transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-300 hover:text-fresh-orange transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-fresh-orange transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-fresh-orange transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-gray-300 hover:text-fresh-orange transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-fresh-orange transition-colors">
                  Delivery Information
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-fresh-orange transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-gray-300 hover:text-fresh-orange transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <address className="not-italic text-gray-300 space-y-2">
              <p>123 Flavor Street</p>
              <p>Foodie Lane, Culinary City</p>
              <p>Phone: +91 9876543210</p>
              <p>Email: hello@fresh2home.com</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Fresh2Home. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
