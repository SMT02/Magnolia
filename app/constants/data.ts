import icons from "./icons";
import images from "./images";

export const cards = [
  {
    title: "Fresh Apples",
    location: "Organic Section",
    price: "$3.99/lb",
    rating: 4.8,
    category: "fruits",
    image: images.apples,
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
    title: "2% Milk",
    location: "Dairy Aisle",
    price: "$4.00",
    rating: 4.7,
    category: "dairy",
    image: images.milk,
  },
  {
    title: "Chicken Breast",
    location: "Meat Section",
    price: "$7.99/lb",
    rating: 4.9,
    category: "meat",
    image: images.chicken,
  },
];

export const featuredCards = [
  {
    title: "Organic Bananas",
    location: "Fresh Produce",
    price: "$1.29/lb",
    rating: 4.8,
    image: images.bananas,
    category: "fruits",
  },
  {
    title: "Cheddar Cheese",
    location: "Dairy Aisle",
    price: "$5.99",
    rating: 4.6,
    image: images.cheese,
    category: "dairy",
  },
];

export const categories = [
  { title: "All", category: "All" },
  { title: "Fruits & Vegetables", category: "fruits" },
  { title: "Meat & Seafood", category: "meat" },
  { title: "Dairy & Eggs", category: "dairy" },
  { title: "Bakery", category: "bakery" },
  { title: "Beverages", category: "beverages" },
  { title: "Frozen Foods", category: "frozen" },
  { title: "Pantry Staples", category: "pantry" },
  { title: "Snacks & Sweets", category: "snacks" },
  { title: "Household Essentials", category: "household" },
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
    title: "Home Delivery",
    icon: icons.truck,
  },
  {
    title: "Organic Section",
    icon: icons.leaf,
  },
  {
    title: "Prepared Meals",
    icon: icons.cutlery,
  },
  {
    title: "Specialty Cheese",
    icon: icons.cheese,
  },
  {
    title: "Wine & Liquor",
    icon: icons.wine,
  },
  {
    title: "Fresh Bakery",
    icon: icons.bread,
  },
  {
    title: "Deli Counter",
    icon: icons.deli,
  },
];

export const gallery = [
  {
    id: 1,
    image: images.fruits,
  },
  {
    id: 2,
    image: images.meat,
  },
  {
    id: 3,
    image: images.bakery,
  },
  {
    id: 4,
    image: images.frozen,
  },
  {
    id: 5,
    image: images.pantry,
  },
  {
    id: 6,
    image: images.snacks,
  },
];
