
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div 
      className="relative h-[500px] flex items-center justify-center text-white"
      style={{
        backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url('/images/hero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="container px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in">
          Authentic Home-Cooked <span className="text-fresh-yellow">Indian Delights</span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 opacity-90">
          Experience the rich flavors of homemade Indian cuisine delivered fresh to your doorstep
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/menu">
            <Button className="bg-fresh-orange hover:bg-fresh-red text-white">
              Explore Menu
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Hero;
