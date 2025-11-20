'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { databases, DATABASE_ID, ORDERS_TABLE_ID } from '@/lib/appwrite';
import { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Package, Clock, Truck, CheckCircle, LogIn } from 'lucide-react';
import { Query } from 'appwrite';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/auth-store';

export default function OrdersPage() {
  const router = useRouter();
  const { user, customer, loading: authLoading, checkAuth } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // If auth check is complete and user is not logged in, redirect to login
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/orders');
      return;
    }

    // If user is logged in and has customer record, fetch orders
    if (user && customer) {
      fetchOrders();
    }
  }, [user, customer, authLoading, router]);

  const fetchOrders = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      // Get all orders for this customer
      const ordersResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_TABLE_ID,
        [Query.equal('customer_id', customer.$id), Query.orderDesc('$createdAt'), Query.limit(100)]
      );

      setOrders(ordersResponse.documents as unknown as Order[]);

      if (ordersResponse.documents.length > 0) {
        toast.success(`Found ${ordersResponse.documents.length} order(s)`, {
          id: 'orders-found',
        });
      }


    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
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

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt (this will redirect automatically)
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-12 text-center">
            <LogIn className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to view your orders.</p>
            <Link href="/auth/login?redirect=/orders">
              <Button size="lg">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Orders</h1>
        {customer && (
          <p className="text-gray-600">
            Welcome back, {customer.full_name}! ({customer.phone})
          </p>
        )}
      </div>

      {/* Manual Tracking Option - Temporarily disabled */}
      {/* Uncomment below to enable manual tracking link */}
      {/* {orders.length === 0 && !loading && (
        <Card className="mb-6 border-2 border-[#ffff03]/50 bg-[#ffff03]/5">
          <CardContent className="p-4">
            <p className="text-sm text-[#27247b] font-bold mb-2">
              📱 Changed your phone number?
            </p>
            <p className="text-xs text-[#27247b]/80 mb-3">
              If you placed orders with a different phone number, you can track them manually.
            </p>
            <Link href="/track-order">
              <Button variant="outline" size="sm" className="border-[#27247b] text-[#27247b] hover:bg-[#27247b] hover:text-white">
                Track Order by Phone Number
              </Button>
            </Link>
          </CardContent>
        </Card>
      )} */}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Loading your orders...</p>
        </div>
      )}

      {/* Orders List */}
      {!loading && (
        <>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
                <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
                <Link href="/#products">
                  <Button size="lg">Start Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Orders ({orders.length})
              </h2>

              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.$id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Order ID</p>
                          <p className="font-mono text-sm font-medium">{order.$id}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className="font-medium">{getStatusText(order.status)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-500">Order Date</p>
                          <p className="font-medium">
                            {new Date(order.$createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(order.total_price)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <Link href={`/orders/${order.$id}`}>
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
