'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { databases, DATABASE_ID, CUSTOMERS_TABLE_ID, ORDERS_TABLE_ID } from '@/lib/appwrite';
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { Customer, Order } from '@/lib/types';
import { Card, CardContent, } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { User, Mail, Phone, ShoppingBag, Search, Users, TrendingUp, DollarSign, Award } from 'lucide-react';
import { Query } from 'appwrite';
import toast from 'react-hot-toast';

interface CustomerWithStats extends Customer {
  orderCount: number;
  totalSpent: number;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent'>('name');


  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = [...customers];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.full_name.localeCompare(b.full_name);
      } else if (sortBy === 'orders') {
        return b.orderCount - a.orderCount;
      } else {
        return b.totalSpent - a.totalSpent;
      }
    });

    setFilteredCustomers(filtered);
  }, [customers, searchQuery, sortBy]);

  const fetchCustomers = async () => {
    try {
      const customersResponse = await databases.listDocuments(
        DATABASE_ID,
        CUSTOMERS_TABLE_ID,
        [Query.orderDesc('$createdAt')]
      );

      const customersWithStats = await Promise.all(
        customersResponse.documents.map(async (customer: any) => {
          try {
            const ordersResponse = await databases.listDocuments(
              DATABASE_ID,
              ORDERS_TABLE_ID,
              [Query.equal('customer_id', customer.$id)]
            );

            const totalSpent = ordersResponse.documents.reduce((sum: number, order: any) => {
              return sum + (order.total_price || 0);
            }, 0);

            return {
              ...customer,
              orderCount: ordersResponse.total,
              totalSpent
            } as CustomerWithStats;
          } catch {
            return {
              ...customer,
              orderCount: 0,
              totalSpent: 0
            } as CustomerWithStats;
          }
        })
      );

      setCustomers(customersWithStats);
      setFilteredCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };


  const stats = {
    total: customers.length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgOrdersPerCustomer: customers.length > 0 ? customers.reduce((sum, c) => sum + c.orderCount, 0) / customers.length : 0,
    topCustomer: customers.length > 0 ? customers.reduce((max, c) => c.totalSpent > max.totalSpent ? c : max, customers[0]) : null
  };

  return (
    <AdminAuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-lg text-gray-600 flex items-center gap-2">
            <Users className="w-5 h-5" />
            View and analyze customer data and behavior
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg Orders/Customer</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.avgOrdersPerCustomer.toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Top Customer</p>
                  <p className="text-sm font-bold text-purple-600 truncate">
                    {stats.topCustomer?.full_name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.topCustomer ? formatCurrency(stats.topCustomer.totalSpent) : ''}
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="orders">Sort by Orders</SelectItem>
                  <SelectItem value="spent">Sort by Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Loading customers...</p>
          </CardContent>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No customers found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Link key={customer.$id} href={`/admin/customers/${customer.$id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{customer.full_name}</h3>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(customer.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{customer.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Orders</span>
                    </div>
                    <Badge variant="info">{customer.orderCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Spent</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(customer.totalSpent)}
                    </span>
                  </div>
                  {customer.orderCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg Order</span>
                      <span className="text-sm font-medium text-purple-600">
                        {formatCurrency(customer.totalSpent / customer.orderCount)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
    </AdminAuthGuard>
  );
}
