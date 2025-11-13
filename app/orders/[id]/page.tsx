'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { databases, DATABASE_ID, ORDERS_TABLE_ID, ADDRESSES_TABLE_ID, PRODUCTS_TABLE_ID } from '@/lib/appwrite';
import { Order, Address, Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, parseOrderItems } from '@/lib/utils';
import { MapPin, Package, Clock, Truck, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';

interface OrderItemWithProduct {
  productId: string;
  productName: string;
  quantity: number;
  pricePerKg: number;
  totalPrice: number;
  product: Product | null;
}

interface OrderData {
  order: Order;
  address: Address;
  products: OrderItemWithProduct[];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const { isAdmin } = useAuthStore();
  
  const [data, setData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check if coming from customer detail page
  const fromCustomer = searchParams.get('from') === 'customer';
  const customerId = searchParams.get('customerId');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const order = await databases.getDocument(DATABASE_ID, ORDERS_TABLE_ID, orderId) as unknown as Order;
        const address = await databases.getDocument(DATABASE_ID, ADDRESSES_TABLE_ID, order.address_id) as unknown as Address;
        
        // Parse order items and fetch product details
        const orderItems = parseOrderItems(order.order_items);
        const products: OrderItemWithProduct[] = await Promise.all(
          orderItems.map(async (item) => {
            try {
              const product = await databases.getDocument(DATABASE_ID, PRODUCTS_TABLE_ID, item.productId) as unknown as Product;
              // Calculate price based on quantity and tier pricing
              let pricePerKg = product.base_price_per_kg;
              if (product.has_tier_pricing) {
                if (item.quantity >= 10 && product.tier_10kg_up_price) {
                  pricePerKg = product.tier_10kg_up_price;
                } else if (item.quantity >= 5 && product.tier_5_9kg_price) {
                  pricePerKg = product.tier_5_9kg_price;
                } else if (item.quantity >= 2 && product.tier_2_4kg_price) {
                  pricePerKg = product.tier_2_4kg_price;
                }
              }
              return {
                productId: item.productId,
                productName: product.name,
                quantity: item.quantity,
                pricePerKg: pricePerKg,
                totalPrice: pricePerKg * item.quantity,
                product
              };
            } catch {
              return {
                productId: item.productId,
                productName: 'Unknown Product',
                quantity: item.quantity,
                pricePerKg: 0,
                totalPrice: 0,
                product: null
              };
            }
          })
        );

        setData({ order, address, products });
      } catch (error) {
        console.error('Error fetching order details:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  // Determine back URL and text based on context
  let backUrl = '/orders';
  let backText = 'Back to My Orders';
  
  if (fromCustomer && customerId) {
    backUrl = `/admin/customers/${customerId}`;
    backText = 'Back to Customer Details';
  } else if (isAdmin) {
    backUrl = '/admin/orders';
    backText = 'Back to Order Management';
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist</p>
          <Link href={backUrl}>
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { order, address, products } = data;

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'accepted':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'out_for_delivery':
        return <Truck className="w-6 h-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <Link href={backUrl}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backText}
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Details</h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Order ID:</span>
          <code className="px-3 py-1 bg-gray-100 rounded-md font-mono text-sm font-medium text-gray-900">
            {order.$id}
          </code>
        </div>
      </div>

      <div className="space-y-6">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <div>
                <p className="text-xl font-bold">{getStatusText(order.status)}</p>
                <p className="text-sm text-gray-500">
                  Ordered on {new Date(order.$createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="mt-6 space-y-3">
              <div className={`flex items-center space-x-3 ${order.status === 'pending' || order.status === 'accepted' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Order Placed</span>
              </div>
              <div className={`flex items-center space-x-3 ${order.status === 'accepted' || order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Order Accepted</span>
              </div>
              <div className={`flex items-center space-x-3 ${order.status === 'out_for_delivery' || order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Out for Delivery</span>
              </div>
              <div className={`flex items-center space-x-3 ${order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Delivered</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-gray-500">{item.quantity} kg</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(order.total_price)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Payment: Cash on Delivery</p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">{address.address_line}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Coordinates: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              <a
                href={address.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button variant="outline" className="mt-2">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in Maps
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
