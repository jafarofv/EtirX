export interface Perfume {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  description: string;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  size: string;
  inStock: boolean;
}

export const perfumes: Perfume[] = [
  {
    id: 1,
    name: "Midnight Essence",
    brand: "AuraX",
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.8,
    reviews: 342,
    image: "https://images.unsplash.com/photo-1643797519086-cc9a821fbcfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Oriental",
    description: "A captivating blend of dark mysteries and elegant sophistication. Perfect for evening wear.",
    notes: {
      top: ["Bergamot", "Black Pepper", "Cardamom"],
      heart: ["Oud Wood", "Rose", "Jasmine"],
      base: ["Amber", "Vanilla", "Musk"]
    },
    size: "100ml",
    inStock: true
  },
  {
    id: 2,
    name: "Noir Royale",
    brand: "AuraX",
    price: 149.99,
    rating: 4.9,
    reviews: 567,
    image: "https://images.unsplash.com/photo-1778058505620-6911582e5a9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Woody",
    description: "Embody luxury with this regal fragrance featuring rare woods and precious spices.",
    notes: {
      top: ["Saffron", "Nutmeg", "Lavender"],
      heart: ["Cedarwood", "Patchouli", "Vetiver"],
      base: ["Sandalwood", "Leather", "Tonka Bean"]
    },
    size: "100ml",
    inStock: true
  },
  {
    id: 3,
    name: "Velvet Aura",
    brand: "AuraX",
    price: 119.99,
    rating: 4.7,
    reviews: 289,
    image: "https://images.unsplash.com/photo-1643797517590-c44cb552ddcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Floral",
    description: "Soft and sensual, this fragrance wraps you in a veil of delicate florals and warm vanilla.",
    notes: {
      top: ["Peach", "Mandarin", "Pink Pepper"],
      heart: ["Tuberose", "Orange Blossom", "Ylang-Ylang"],
      base: ["Vanilla", "Benzoin", "White Musk"]
    },
    size: "75ml",
    inStock: true
  },
  {
    id: 4,
    name: "Carbon Elite",
    brand: "AuraX",
    price: 169.99,
    originalPrice: 199.99,
    rating: 5.0,
    reviews: 421,
    image: "https://images.unsplash.com/photo-1771762013405-ad64577dfc55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Fresh",
    description: "Bold and refined, a modern masterpiece combining citrus freshness with smoky undertones.",
    notes: {
      top: ["Grapefruit", "Marine Notes", "Mint"],
      heart: ["Geranium", "Incense", "Black Tea"],
      base: ["Vetiver", "Oakmoss", "Ambergris"]
    },
    size: "100ml",
    inStock: true
  },
  {
    id: 5,
    name: "Silk Oud",
    brand: "AuraX",
    price: 189.99,
    rating: 4.9,
    reviews: 634,
    image: "https://images.unsplash.com/photo-1643797517714-a273548abc3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Oriental",
    description: "Experience the pinnacle of luxury with this exquisite oud composition draped in silk notes.",
    notes: {
      top: ["Rose", "Saffron", "Cinnamon"],
      heart: ["Agarwood", "Orchid", "Patchouli"],
      base: ["Amber", "Sandalwood", "Musk"]
    },
    size: "100ml",
    inStock: true
  },
  {
    id: 6,
    name: "Obsidian",
    brand: "AuraX",
    price: 139.99,
    rating: 4.8,
    reviews: 398,
    image: "https://images.unsplash.com/photo-1700473209752-395910c89003?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "Woody",
    description: "Dark, mysterious, and utterly irresistible. A signature scent for the modern connoisseur.",
    notes: {
      top: ["Black Currant", "Apple", "Pineapple"],
      heart: ["Birch", "Jasmine", "Rose"],
      base: ["Oakmoss", "Vanilla", "Ambergris"]
    },
    size: "100ml",
    inStock: true
  }
];

export const categories = [
  { id: 1, name: "All", icon: "*" },
  { id: 2, name: "Oriental", icon: "O" },
  { id: 3, name: "Woody", icon: "W" },
  { id: 4, name: "Floral", icon: "F" },
  { id: 5, name: "Fresh", icon: "R" },
];

