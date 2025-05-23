import icons from "./icons";
import images from "./images";

export const cards = [
  {
    title: "Fresh Apples",
    location: "Produce",
    price: "$3.99/lb",
    rating: 4.8,
    category: "fruits",
    image: images.apples,
  },
  {
    title: "Beans",
    location: "Canned Goods",
    price: "$1.20",
    rating: 4.3,
    category: "pantry",
    image: images.beans,
  },
  {
    title: "Whole Wheat Bread",
    location: "Bakery",
    price: "$2.50",
    rating: 4.5,
    category: "bakery",
    image: images.bread,
  },
  {
    title: "Broccoli",
    location: "Produce",
    price: "$1.75/lb",
    rating: 4.6,
    category: "fruits",
    image: images.broccoli,
  },
  {
    title: "Candy",
    location: "Snacks Aisle",
    price: "$1.00",
    rating: 4.0,
    category: "snacks",
    image: images.candy,
  },
  {
    title: "Carrots",
    location: "Produce",
    price: "$1.25/lb",
    rating: 4.4,
    category: "fruits",
    image: images.carrots,
  },
  {
    title: "Cheddar Cheese",
    location: "Dairy Aisle",
    price: "$5.99",
    rating: 4.6,
    category: "dairy",
    image: images.cheddarcheese,
  },
  {
    title: "Chicken Breast",
    location: "Meat Section",
    price: "$7.99/lb",
    rating: 4.9,
    category: "meat",
    image: images.chickenbreast,
  },
  {
    title: "Chips",
    location: "Snacks Aisle",
    price: "$3.49",
    rating: 4.2,
    category: "snacks",
    image: images.chips,
  },
  {
    title: "Chocolate Bar",
    location: "Snacks Aisle",
    price: "$1.50",
    rating: 4.5,
    category: "snacks",
    image: images.chocolatebar,
  },
  {
    title: "Coffee",
    location: "Beverage Aisle",
    price: "$8.99",
    rating: 4.8,
    category: "beverages",
    image: images.coffee,
  },
  {
    title: "Croissant",
    location: "Bakery",
    price: "$1.99",
    rating: 4.4,
    category: "bakery",
    image: images.croissant,
  },
  {
    title: "Eggs",
    location: "Dairy Aisle",
    price: "$2.99",
    rating: 4.7,
    category: "dairy",
    image: images.eggs,
  },
  {
    title: "Frozen Peas",
    location: "Frozen Foods",
    price: "$2.50",
    rating: 4.3,
    category: "frozen",
    image: images.frozenpeas,
  },
  {
    title: "Frozen Pizza",
    location: "Frozen Foods",
    price: "$6.99",
    rating: 4.5,
    category: "frozen",
    image: images.frozenpizza,
  },
  {
    title: "Ground Beef",
    location: "Meat Section",
    price: "$5.49/lb",
    rating: 4.6,
    category: "meat",
    image: images.groundbeef,
  },
  {
    title: "Ice Cream",
    location: "Frozen Foods",
    price: "$4.99",
    rating: 4.8,
    category: "frozen",
    image: images.icecream,
  },
  {
    title: "2% Milk",
    location: "Dairy Aisle",
    price: "$4.00",
    rating: 4.7,
    category: "dairy",
    image: images.milk,
  },
  {
    title: "Muffin",
    location: "Bakery",
    price: "$2.20",
    rating: 4.5,
    category: "bakery",
    image: images.muffin,
  },
  {
    title: "Pasta",
    location: "Pantry",
    price: "$1.89",
    rating: 4.4,
    category: "pantry",
    image: images.pasta,
  },
  {
    title: "Pepsi",
    location: "Beverage Aisle",
    price: "$1.50",
    rating: 4.3,
    category: "beverages",
    image: images.pepsi,
  },
  {
    title: "Rice",
    location: "Pantry",
    price: "$3.00",
    rating: 4.5,
    category: "pantry",
    image: images.rice,
  },
  {
    title: "Salmon",
    location: "Meat Section",
    price: "$9.99/lb",
    rating: 4.7,
    category: "meat",
    image: images.salmon,
  },
  {
    title: "Toilet Paper",
    location: "Household Essentials",
    price: "$6.99",
    rating: 4.3,
    category: "household",
    image: images.toiletpaper,
  },
  {
    title: "Toothpaste",
    location: "Household Essentials",
    price: "$3.25",
    rating: 4.2,
    category: "household",
    image: images.toothpaste,
  },
  {
    title: "Water Bottle",
    location: "Beverage Aisle",
    price: "$1.00",
    rating: 4.6,
    category: "beverages",
    image: images.water,
  },
];

export const featuredCards = [];

export const categories = [
  { title: "All", category: "All", location: null },
  { 
    title: "Fruits & Vegetables", 
    category: "FruitsAndVegetables",
    location: {
      area: "Front Right",
      aisle: "Produce Section",
      description: "First section when entering, right side"
    }
  },
  { 
    title: "Bakery", 
    category: "Bakery",
    location: {
      area: "Front Left",
      aisle: "Bakery Section",
      description: "First section when entering, left side"
    }
  },
  { 
    title: "Dairy & Eggs", 
    category: "DairyAndEggs",
    location: {
      area: "Back Wall",
      aisle: "Aisle 12",
      description: "Along the back wall, refrigerated section"
    }
  },
  { 
    title: "Meat & Seafood", 
    category: "MeatAndSeafood",
    location: {
      area: "Back Right",
      aisle: "Meat Counter",
      description: "Back right corner, behind produce"
    }
  },
  { 
    title: "Beverages", 
    category: "Beverages",
    location: {
      area: "Center",
      aisle: "Aisle 3-4",
      description: "Center aisles, near front"
    }
  },
  { 
    title: "Frozen Foods", 
    category: "FrozenFoods",
    location: {
      area: "Right Wall",
      aisle: "Aisle 13-14",
      description: "Along right wall, freezer section"
    }
  },
  { 
    title: "Pantry Staples", 
    category: "PantryStaples",
    location: {
      area: "Center",
      aisle: "Aisle 5-7",
      description: "Center aisles"
    }
  },
  { 
    title: "Snacks & Sweets", 
    category: "SnacksAndSweets",
    location: {
      area: "Center",
      aisle: "Aisle 8-9",
      description: "Center aisles, near back"
    }
  },
  { 
    title: "Household Essentials", 
    category: "HouseholdEssentials",
    location: {
      area: "Left Wall",
      aisle: "Aisle 15-16",
      description: "Along left wall, last aisles"
    }
  },
];

export const settings = [
  {
    title: "My Orders",
    icon: icons.calendar,
  },
  {
    title: "Payments",
    icon: icons.wallet,
  },
  {
    title: "Profile",
    icon: icons.person,
  },
  {
    title: "Notifications",
    icon: icons.bell,
  },
  {
    title: "Security",
    icon: icons.shield,
  },
  {
    title: "Language",
    icon: icons.language,
  },
  {
    title: "Customer Support",
    icon: icons.info,
  },
  {
    title: "Invite Friends",
    icon: icons.people,
  },
];

export const facilities = [
  {
    title: "Curbside Pickup",
    icon: icons.carPark,
  },
  {
    title: "Prepared Meals",
    icon: icons.cutlery,
  },
];

export const gallery = [];
