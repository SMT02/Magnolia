# 🛍️ Magnolia Shopping Assistant

Magnolia is a smart shopping assistant mobile application built with React Native and Expo. It helps users manage their shopping lists with an AI-powered chat interface, real-time product search, and an intuitive shopping experience.

## ✨ Features

### 🤖 AI Shopping Assistant
- Interactive chat interface powered by GPT-3.5
- Smart product recommendations
- Natural language shopping list management
- Context-aware suggestions based on your current list

### 📝 Shopping List Management
- Add/remove items from your shopping list
- Adjust item quantities
- Real-time price calculations
- Organized by product categories
- Quick access to product details

### 👤 User Profile
- Customizable user profiles
- Name editing
- Shopping history
- Notification preferences
- Easy sharing functionality

### 🏪 Product Catalog
- Detailed product information
- Product ratings and reviews
- Category-based browsing
- Price tracking
- High-quality product images

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Appwrite instance
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd Magnolia
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:
```env
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
APPWRITE_ENDPOINT=your_appwrite_endpoint
APPWRITE_PROJECT_ID=your_project_id
```

4. Start the development server:
```bash
npx expo start
```

## 🏗️ Tech Stack

- **Frontend Framework**: React Native
- **UI Framework**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router
- **Backend**: Appwrite
- **AI Integration**: OpenAI GPT-3.5
- **State Management**: React Context
- **Authentication**: Appwrite Auth
- **Storage**: Appwrite Storage
- **Database**: Appwrite Database

## 📱 App Structure

```
Magnolia/
├── app/                    # Main application code
│   ├── (auth)/            # Authentication screens
│   ├── (root)/            # Main app screens
│   │   ├── (tabs)/        # Tab navigation screens
│   │   └── product/       # Product details screens
├── components/            # Reusable components
├── constants/            # App constants and assets
├── lib/                 # Utility functions and providers
└── assets/             # Static assets
```

## 🔐 Authentication

The app uses Appwrite for authentication, supporting:
- Email/Password login
- Social authentication (configurable)
- Session management
- Secure token handling

## 💾 Data Models

### Product
```typescript
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageId: string;
  rating: number;
}
```

### Shopping List Item
```typescript
interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageId: string;
  rating: number;
  quantity: number;
}
```

## 🎨 UI Components

The app uses a custom design system with:
- Consistent typography using Rubik font family
- Custom color scheme with primary and secondary colors
- Responsive layouts
- Animated interactions
- Native platform considerations

## 🔄 State Management

- Global user context for authentication state
- Shopping list context for cart management
- Real-time updates using Appwrite subscriptions
- Persistent storage for offline access

