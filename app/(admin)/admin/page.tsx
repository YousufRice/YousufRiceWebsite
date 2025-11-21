"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  databases,
  DATABASE_ID,
  ORDERS_TABLE_ID,
  ORDER_ITEMS_TABLE_ID,
  PRODUCTS_TABLE_ID,
  CUSTOMERS_TABLE_ID,
} from "@/lib/appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Image as ImageIcon,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  BarChart3,
  Activity,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Query } from "appwrite";
import toast from "react-hot-toast";
import { clearImageCache } from "@/lib/actions/cache-actions";
import { Order, Product, Customer } from "@/lib/types";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import ReadOnlyGuard from "@/components/admin/ReadOnlyGuard";

export default function AdminDashboard() {
  const router = useRouter();
  const { hasReadPermission, hasWritePermission } = useAuthStore();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    acceptedOrders: 0,
    outForDeliveryOrders: 0,
    deliveredOrders: 0,
    availableProducts: 0,
    lowStockProducts: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!hasReadPermission()) return;

      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        const [
          ordersRes,
          productsRes,
          customersRes,
          pendingRes,
          acceptedRes,
          outForDeliveryRes,
          deliveredRes,
          recentOrdersRes,
          lastMonthOrdersRes,
          orderItemsRes,
        ] = await Promise.all([
          databases.listDocuments(DATABASE_ID, ORDERS_TABLE_ID, [
            Query.limit(5000),
          ]),
          databases.listDocuments(DATABASE_ID, PRODUCTS_TABLE_ID),
          databases.listDocuments(DATABASE_ID, CUSTOMERS_TABLE_ID),
          databases.listDocuments(DATABASE_ID, ORDERS_TABLE_ID, [
            Query.equal("status", "pending"),
          ]),
          databases.listDocuments(DATABASE_ID, ORDERS_TABLE_ID, [
            Query.equal("status", "accepted"),
          ]),
          databases.listDocuments(DATABASE_ID, ORDERS_TABLE_ID, [
            Query.equal("status", "out_for_delivery"),
          ]),
          databases.listDocuments(DATABASE_ID, ORDERS_TABLE_ID, [
            Query.equal("status", "delivered"),
          ]),
          databases.listDocuments(DATABASE_ID, ORDERS_TABLE_ID, [
            Query.orderDesc("$createdAt"),
            Query.limit(5),
          ]),
          databases.listDocuments(DATABASE_ID, ORDERS_TABLE_ID, [
            Query.greaterThan("$createdAt", thirtyDaysAgo.toISOString()),
          ]),
          databases.listDocuments(DATABASE_ID, ORDER_ITEMS_TABLE_ID, [
            Query.limit(5000),
          ]),
        ]);

        const totalRevenue = ordersRes.documents.reduce(
          (sum: number, order: any) => {
            // Exclude returned orders from revenue calculation
            if (order.status === "returned") return sum;
            return sum + (order.total_price || 0);
          },
          0
        );

        const lastMonthRevenue = lastMonthOrdersRes.documents.reduce(
          (sum: number, order: any) => {
            // Exclude returned orders from revenue calculation
            if (order.status === "returned") return sum;
            return sum + (order.total_price || 0);
          },
          0
        );

        const previousRevenue = totalRevenue - lastMonthRevenue;
        const revenueGrowth =
          previousRevenue > 0
            ? (lastMonthRevenue / previousRevenue) * 100 - 100
            : 0;
        const ordersGrowth =
          ordersRes.total > 0
            ? (lastMonthOrdersRes.total / ordersRes.total) * 100
            : 0;

        const availableProducts = (productsRes.documents as any[]).filter(
          (p: any) => p.available
        ).length;

        setStats({
          totalOrders: ordersRes.total,
          totalRevenue,
          totalProducts: productsRes.total,
          totalCustomers: customersRes.total,
          pendingOrders: pendingRes.total,
          acceptedOrders: acceptedRes.total,
          outForDeliveryOrders: outForDeliveryRes.total,
          deliveredOrders: deliveredRes.total,
          availableProducts,
          lowStockProducts: 0,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          ordersGrowth: Math.round(ordersGrowth * 10) / 10,
        });

        setRecentOrders(recentOrdersRes.documents as unknown as Order[]);

        // Create product lookup map for names
        const productLookup: { [key: string]: string } = {};
        productsRes.documents.forEach((product: any) => {
          productLookup[product.$id] = product.name;
        });

        // Calculate top products from orders
        // Calculate top products from ACTUAL order items table (Robust way)
        const productCounts: {
          [key: string]: { count: number; revenue: number; name: string };
        } = {};

        orderItemsRes.documents.forEach((item: any) => {
          const productId = item.product_id;
          const quantity = item.quantity_kg || 0;
          const total = item.total_after_discount || 0;

          if (!productCounts[productId]) {
            productCounts[productId] = {
              count: 0,
              revenue: 0,
              name:
                productLookup[productId] ||
                item.product_name ||
                `Product ${productId.slice(0, 8)}`,
            };
          }

          productCounts[productId].count += quantity;
          productCounts[productId].revenue += total;
        });

        const topProductsArray = Object.entries(productCounts)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopProducts(topProductsArray);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [hasReadPermission]);

  const handleRevalidateImages = async () => {
    setRevalidating(true);
    try {
      // Use Server Action with updateTag for immediate cache clearing
      const result = await clearImageCache();

      if (result.success) {
        toast.success(result.message || "Image cache cleared successfully!");
        // Force a page refresh to show the cleared cache immediately
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to clear image cache");
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast.error("Failed to clear image cache");
    } finally {
      setRevalidating(false);
    }
  };

  return (
    <AdminAuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time business insights and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-sm px-3 py-1">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              System Online
            </Badge>
            <Badge variant="info" className="text-sm px-3 py-1">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                {stats.revenueGrowth >= 0 ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600 font-medium">
                      +{stats.revenueGrowth}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
                    <span className="text-red-600 font-medium">
                      {stats.revenueGrowth}%
                    </span>
                  </>
                )}
                <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.totalOrders}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <BarChart3 className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-gray-600">
                  {stats.deliveredOrders} delivered
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Products</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.totalProducts}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <CheckCircle2 className="w-4 h-4 text-purple-600 mr-1" />
                <span className="text-gray-600">
                  {stats.availableProducts} available
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Customers</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.totalCustomers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-orange-600 mr-1" />
                <span className="text-gray-600">Active users</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Pipeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Order Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-900">
                    {stats.pendingOrders}
                  </p>
                  <p className="text-sm text-yellow-700">Pending</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.acceptedOrders}
                  </p>
                  <p className="text-sm text-blue-700">Accepted</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats.outForDeliveryOrders}
                  </p>
                  <p className="text-sm text-purple-700">Out for Delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.deliveredOrders}
                  </p>
                  <p className="text-sm text-green-700">Delivered</p>
                </div>
              </div>
            </div>
            {stats.pendingOrders > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">
                    {stats.pendingOrders} order
                    {stats.pendingOrders !== 1 ? "s" : ""} need
                    {stats.pendingOrders === 1 ? "s" : ""} your attention
                  </span>
                </div>
                <ReadOnlyGuard>
                  <Link href="/admin/orders">
                    <Button
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Review Orders
                    </Button>
                  </Link>
                </ReadOnlyGuard>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity & Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Recent Orders
                </span>
                <ReadOnlyGuard>
                  <Link href="/admin/orders">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </ReadOnlyGuard>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No recent orders
                </p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.$id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${order.status === "pending"
                            ? "bg-yellow-500"
                            : order.status === "accepted"
                              ? "bg-blue-500"
                              : order.status === "out_for_delivery"
                                ? "bg-purple-500"
                                : "bg-green-500"
                            }`}
                        />
                        <div>
                          <p className="font-medium text-sm">
                            Order #{order.$id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.$createdAt).toLocaleDateString()} •{" "}
                            {order.status.replace("_", " ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(order.total_price)}
                        </p>
                        <ReadOnlyGuard>
                          <Link href={`/admin/orders/${order.$id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                            >
                              View
                            </Button>
                          </Link>
                        </ReadOnlyGuard>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Top Selling Products
                </span>
                <ReadOnlyGuard>
                  <Link href="/admin/products">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </ReadOnlyGuard>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No product data available
                </p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {product.count} kg sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className="text-xs text-gray-500">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <ReadOnlyGuard>
                <Button
                  onClick={handleRevalidateImages}
                  disabled={revalidating}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  {revalidating ? "Clearing Cache..." : "Clear Image Cache"}
                </Button>
              </ReadOnlyGuard>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminAuthGuard>
  );
}
