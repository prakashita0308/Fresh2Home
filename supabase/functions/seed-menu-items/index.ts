
// Follow this setup guide to integrate the Deno runtime and Supabase functions in your project:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Sample menu items data
const menuItems = [
  {
    name: "Gujarati Thali",
    description: "A complete meal with dal, kadhi, rotis, rice, vegetables and sweet dish",
    price: 299,
    image_url: "/images/gujarati-thali.jpg",
    category: "thali",
    is_veg: true,
    is_popular: true
  },
  {
    name: "Punjabi Thali",
    description: "Rich and flavorful thali with butter chicken, dal makhani, naan, pulao and more",
    price: 349,
    image_url: "/images/punjabi-thali.jpg",
    category: "thali",
    is_veg: false,
    is_popular: true
  },
  {
    name: "South Indian Thali",
    description: "A delicious assortment of sambhar, rasam, rice, vegetables and payasam",
    price: 279,
    image_url: "/images/south-indian-thali.jpg",
    category: "thali",
    is_veg: true,
    is_popular: false
  },
  {
    name: "Bengali Thali",
    description: "Authentic Bengali dishes including fish curry, luchi, cholar dal and mishti doi",
    price: 329,
    image_url: "/images/bengali-thali.jpg",
    category: "thali",
    is_veg: false,
    is_popular: false
  },
  {
    name: "Rajasthani Thali",
    description: "Traditional Rajasthani dishes with dal baati churma, gatte ki sabzi, and more",
    price: 319,
    image_url: "/images/rajasthani-thali.jpg",
    category: "thali",
    is_veg: true,
    is_popular: true
  },
  {
    name: "Butter Chicken",
    description: "Tender chicken in a rich and creamy tomato-based sauce",
    price: 249,
    image_url: "/images/butter-chicken.jpg",
    category: "main",
    is_veg: false,
    is_popular: true
  },
  {
    name: "Paneer Tikka",
    description: "Chunks of paneer marinated in spices and grilled to perfection",
    price: 199,
    image_url: "/images/paneer-tikka.jpg",
    category: "main",
    is_veg: true,
    is_popular: true
  },
  {
    name: "Dal Makhani",
    description: "Black lentils cooked with butter and cream",
    price: 149,
    image_url: "/images/dal-makhani.jpg",
    category: "main",
    is_veg: true,
    is_popular: false
  },
  {
    name: "Masala Dosa",
    description: "Crispy rice pancake filled with spiced potatoes",
    price: 129,
    image_url: "/images/masala-dosa.jpg",
    category: "breakfast",
    is_veg: true,
    is_popular: true
  },
  {
    name: "Pav Bhaji",
    description: "Spiced vegetable mash served with butter-toasted rolls",
    price: 99,
    image_url: "/images/pav-bhaji.jpg",
    category: "breakfast",
    is_veg: true,
    is_popular: false
  },
  {
    name: "Gulab Jamun",
    description: "Soft milk solids balls soaked in rose scented syrup",
    price: 69,
    image_url: "/images/gulab-jamun.jpg",
    category: "dessert",
    is_veg: true,
    is_popular: true
  },
  {
    name: "Rasgulla",
    description: "Soft and spongy cottage cheese balls in sugar syrup",
    price: 69,
    image_url: "/images/rasgulla.jpg",
    category: "dessert",
    is_veg: true,
    is_popular: false
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete existing menu items if requested
    const url = new URL(req.url);
    const clearExisting = url.searchParams.get("clear") === "true";
    
    if (clearExisting) {
      await supabase.from("menu_items").delete().not("id", "is", null);
    }

    // Insert the menu items
    const { data, error } = await supabase.from("menu_items").insert(menuItems);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Menu items seeded successfully" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
