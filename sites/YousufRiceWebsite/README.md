# 🌾 Yousuf Rice - E-Commerce Platform

A complete full-stack e-commerce platform for ordering premium quality rice online with tier-based pricing, built with Next.js 15, TypeScript, Tailwind CSS v4, and Appwrite.

## 🚀 Features

### Customer Features
- **Browse Products**: View all available rice products with detailed information
- **Tier-Based Pricing**: Automatic price calculation based on quantity (2-4kg, 5-9kg, 10+kg)
- **Shopping Cart**: Add products, adjust quantities, and manage cart
- **Checkout**: Complete orders with delivery address and GPS location
- **Order Tracking**: View order status and delivery progress
- **Cash on Delivery**: Pay when you receive your order

### Admin Features
- **Dashboard**: View analytics including total revenue, orders, products, and customers
- **Product Management**: Full CRUD operations for products with tier pricing
- **Order Management**: View and update order status (pending → accepted → out for delivery → delivered)
- **Customer Management**: View all customers with order history and statistics
- **Image Upload**: Upload product images to Appwrite Storage

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript 5, Tailwind CSS 4
- **Backend**: Appwrite 1.8+ (Database, Storage, Authentication)
- **State Management**: Zustand
- **UI Components**: Custom components with Lucide icons
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ installed
- Appwrite instance (cloud or self-hosted)
- pnpm, npm, or yarn package manager

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 2. Environment Variables

The `.env.local` file is already configured with your Appwrite credentials:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=""
NEXT_PUBLIC_APPWRITE_PROJECT_ID=""
NEXT_PUBLIC_APPWRITE_DATABASE_ID=""
NEXT_PUBLIC_APPWRITE_PRODUCTS_TABLE_ID=""
NEXT_PUBLIC_APPWRITE_ORDERS_TABLE_ID=""
NEXT_PUBLIC_APPWRITE_CUSTOMERS_TABLE_ID=""
NEXT_PUBLIC_APPWRITE_ADDRESSES_TABLE_ID=""
NEXT_PUBLIC_APPWRITE_PRODUCT_IMAGES_TABLE_ID=""
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=""
APPWRITE_API_KEY="[your-api-key]"
```

### 3. Appwrite Database Setup

Ensure your Appwrite database has the following collections with the specified attributes:

#### Products Collection
- `name` (string, required)
- `description` (text, optional)
- `base_price_per_kg` (float, required)
- `has_tier_pricing` (boolean, required)
- `tier_2_4kg_price` (float, optional)
- `tier_5_9kg_price` (float, optional)
- `tier_10kg_up_price` (float, optional)
- `available` (boolean, required)
- `primary_image_id` (string, optional)

#### Product Images Collection
- `product_id` (string, required)
- `file_id` (string, required)
- `is_primary` (boolean, optional)

#### Orders Collection
- `customer_id` (string, required)
- `address_id` (string, required)
- `order_items` (text, required) - CSV format
- `total_price` (integer, required)
- `status` (enum: pending, accepted, out_for_delivery, delivered)

#### Customers Collection
- `user_id` (string, required)
- `full_name` (string, required)
- `phone` (string, required)
- `email` (string, optional)

#### Addresses Collection
- `customer_id` (string, required)
- `order_id` (string, required)
- `address_line` (text, required)
- `latitude` (float, required)
- `longitude` (float, required)
- `maps_url` (string, required)

### 4. Storage Bucket

Create a storage bucket named `product-images` with:
- Read: Public
- Write: Admin only
- File size limit: 5 MB
- Allowed file types: .jpg, .jpeg, .png, .webp

### 5. Admin Access

To grant admin access to a user:
1. Go to Appwrite Console → Auth → Users
2. Select a user
3. Go to Preferences tab
4. Add preference: `admin: true`

## 🚀 Running the Application

### Development Mode

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
pnpm build
pnpm start
```

## 📱 Application Routes

### Public Routes
- `/` - Home page
- `/products` - Browse all products
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/auth/login` - Login page
- `/auth/register` - Registration page

### Protected Routes
- `/orders` - View customer orders
- `/orders/[id]` - Order details

### Admin Routes (requires admin: true)
- `/admin` - Admin dashboard
- `/admin/products` - Manage products
- `/admin/orders` - Manage orders
- `/admin/customers` - View customers

## 🎨 Key Features Implementation

### Tier Pricing Logic
The pricing system automatically calculates the best price based on quantity:
- 2-4 kg: Higher price per kg
- 5-9 kg: Medium price per kg
- 10+ kg: Lowest price per kg

### Location Capture
The checkout page uses the browser's Geolocation API to capture GPS coordinates, which are then used to generate Google Maps or Apple Maps URLs.

### Order Status Flow
```
Pending → Accepted → Out for Delivery → Delivered
```

### Image Management
Product images are stored in Appwrite Storage and linked via the Product Images collection, allowing multiple images per product with one marked as primary.

## 🔒 Security Notes

- Admin routes are protected by checking user preferences
- API keys should be kept secure and not committed to version control
- Client-side validation is complemented by Appwrite's built-in security rules

## 📝 License

This project is built for Yousuf Rice e-commerce platform.

## 🤝 Support

For issues or questions, please refer to the CLAUDE.md file for detailed specifications.
