"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, AdminPermission } from "@/lib/store/auth-store";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import ReadOnlyGuard from "@/components/admin/ReadOnlyGuard";
import {
  databases,
  DATABASE_ID,
  ORDERS_TABLE_ID,
  CUSTOMERS_TABLE_ID,
} from "@/lib/appwrite";
import { Order, Customer } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
  Clock,
  Package,
  Truck,
  CheckCircle,
  ExternalLink,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Trash2,
} from "lucide-react";
import { Query } from "appwrite";
import toast from "react-hot-toast";
import DeleteOrderDialog from "@/components/admin/DeleteOrderDialog";
import EditOrderDialog from "@/components/admin/EditOrderDialog";

interface OrderWithCustomer extends Order {
  customer?: Customer;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { hasWritePermission } = useAuthStore();
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithCustomer | null>(
    null
  );

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  useEffect(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.$id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer?.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          order.customer?.phone.includes(searchQuery)
      );
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === "today") {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        filterDate.setMonth(now.getMonth() - 1);
      }

      filtered = filtered.filter(
        (order) => new Date(order.$createdAt) >= filterDate
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "amount") {
        return b.total_price - a.total_price;
      } else {
        return (
          new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
        );
      }
    });

    setFilteredOrders(filtered);
  }, [orders, searchQuery, dateFilter, sortBy]);

  const fetchOrders = async () => {
    try {
      const queries =
        filter === "all"
          ? [Query.orderDesc("$createdAt"), Query.limit(5000)]
          : [
            Query.equal("status", filter),
            Query.orderDesc("$createdAt"),
            Query.limit(5000),
          ];

      const ordersResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_TABLE_ID,
        queries
      );

      const ordersWithCustomers = await Promise.all(
        ordersResponse.documents.map(async (order: any) => {
          try {
            const customer = (await databases.getDocument(
              DATABASE_ID,
              CUSTOMERS_TABLE_ID,
              order.customer_id
            )) as unknown as Customer;
            return { ...order, customer } as OrderWithCustomer;
          } catch {
            return order as OrderWithCustomer;
          }
        })
      );

      setOrders(ordersWithCustomers);
      setFilteredOrders(ordersWithCustomers);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Order ID",
      "Customer",
      "Phone",
      "Date",
      "Status",
      "Total",
    ];
    const rows = filteredOrders.map((order) => [
      order.$id,
      order.customer?.full_name || "Unknown",
      order.customer?.phone || "",
      new Date(order.$createdAt).toLocaleDateString(),
      order.status,
      order.total_price,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Orders exported successfully!");
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    try {
      await databases.updateDocument(DATABASE_ID, ORDERS_TABLE_ID, orderId, {
        status: newStatus,
      });
      toast.success("Order status updated!");
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order status");
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "accepted":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "out_for_delivery":
        return <Truck className="w-5 h-5 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "returned":
        return <RotateCcw className="w-5 h-5 text-red-500" />;
    }
  };

  const stats = {
    total: orders.length,
    totalRevenue: orders.reduce((sum, order) => {
      // Exclude returned orders from revenue calculation
      if (order.status === "returned") return sum;
      return sum + order.total_price;
    }, 0),
    pending: orders.filter((o) => o.status === "pending").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    avgOrderValue:
      orders.length > 0
        ? orders.reduce((sum, order) => {
          // Exclude returned orders from average calculation
          if (order.status === "returned") return sum;
          return sum + order.total_price;
        }, 0) / orders.filter((o) => o.status !== "returned").length
        : 0,
  };

  const handleEditClick = (order: OrderWithCustomer) => {
    setSelectedOrder(order);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (order: OrderWithCustomer) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminAuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Order Management
              </h1>
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Track and manage all customer orders
              </p>
            </div>
            <ReadOnlyGuard>
              <Button onClick={exportToCSV} variant="outline" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </ReadOnlyGuard>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.pending}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(stats.avgOrderValue)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by order ID, customer name, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={dateFilter}
                  onValueChange={(value: any) => setDateFilter(value)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(value: any) => setSortBy(value)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="amount">Sort by Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All Orders
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("pending")}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Pending
                </Button>
                <Button
                  variant={filter === "accepted" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("accepted")}
                >
                  <Package className="w-4 h-4 mr-1" />
                  Accepted
                </Button>
                <Button
                  variant={
                    filter === "out_for_delivery" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setFilter("out_for_delivery")}
                >
                  <Truck className="w-4 h-4 mr-1" />
                  Out for Delivery
                </Button>
                <Button
                  variant={filter === "delivered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("delivered")}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Delivered
                </Button>
                <Button
                  variant={filter === "returned" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("returned")}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Returned
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-600">Loading orders...</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.$id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order ID</p>
                      <p className="font-mono text-sm font-medium">
                        {order.$id.slice(0, 12)}...
                      </p>
                      <Badge
                        variant={
                          order.status === "pending"
                            ? "warning"
                            : order.status === "accepted"
                              ? "info"
                              : order.status === "out_for_delivery"
                                ? "purple"
                                : order.status === "delivered"
                                  ? "success"
                                  : "destructive"
                        }
                        className="mt-2"
                      >
                        {order.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Customer</p>
                      <p className="font-medium">
                        {order.customer?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.customer?.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Order Date</p>
                      <p className="font-medium">
                        {new Date(order.$createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.$createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(order.total_price)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <ReadOnlyGuard>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(order)}
                          title="Edit Order"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(order)}
                          title="Delete Order"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </ReadOnlyGuard>
                      <Link href={`/orders/${order.$id}?from=admin`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm text-gray-600">
                        Status:{" "}
                        <span className="font-medium capitalize">
                          {order.status.replace("_", " ")}
                        </span>
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      {order.status === "pending" && (
                        <ReadOnlyGuard>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateOrderStatus(order.$id, "accepted")
                            }
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Accept Order
                          </Button>
                        </ReadOnlyGuard>
                      )}

                      {order.status === "accepted" && (
                        <ReadOnlyGuard>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateOrderStatus(order.$id, "out_for_delivery")
                            }
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Out for Delivery
                          </Button>
                        </ReadOnlyGuard>
                      )}

                      {order.status === "out_for_delivery" && (
                        <ReadOnlyGuard>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateOrderStatus(order.$id, "delivered")
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark Delivered
                          </Button>
                        </ReadOnlyGuard>
                      )}

                      {order.status === "delivered" && (
                        <ReadOnlyGuard>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateOrderStatus(order.$id, "returned")
                            }
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Mark as Returned
                          </Button>
                        </ReadOnlyGuard>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DeleteOrderDialog
          orderId={selectedOrder?.$id || ""}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={fetchOrders}
        />

        <EditOrderDialog
          order={selectedOrder}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchOrders}
        />
      </div>
    </AdminAuthGuard>
  );
}
