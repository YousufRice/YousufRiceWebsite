'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { tablesDB, DATABASE_ID, CUSTOMERS_TABLE_ID, ORDERS_TABLE_ID } from "@/lib/appwrite";
import AdminAuthGuard from '@/components/admin/AdminAuthGuard';
import { Customer, Order } from '@/lib/types';
import { Card, CardContent, } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { User, Mail, Phone, ShoppingBag, Search, Users, TrendingUp, DollarSign, Award, Download } from 'lucide-react';
import { Query } from 'appwrite';
import toast from 'react-hot-toast';
import { sanitizeCustomerNameForMeta } from '@/lib/meta';

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
      const customersResponse = await tablesDB.listRows({ databaseId: DATABASE_ID, tableId: CUSTOMERS_TABLE_ID, queries: [
                    Query.orderDesc('$createdAt'),
                    Query.limit(5000)
                  ] });

      const customersWithStats = await Promise.all(
        customersResponse.rows.map(async (customer: any) => {
          try {
            const ordersResponse = await tablesDB.listRows({ databaseId: DATABASE_ID, tableId: ORDERS_TABLE_ID, queries: [Query.equal('customer_id', customer.$id)] });

            const totalSpent = ordersResponse.rows.reduce((sum: number, order: any) => {
              // Exclude returned orders from revenue calculation
              if (order.status === 'returned') return sum;
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

  const exportToMetaCSV = () => {
    try {
      if (customers.length === 0) {
        toast.error('No customers to export');
        return;
      }

      const headers = ['email', 'phone', 'fn', 'ln', 'value'];
      const rows = customers.map(customer => {
        // Sanitize name
        const cleanName = sanitizeCustomerNameForMeta(customer.full_name) || '';
        const nameParts = cleanName.trim().split(/\s+/);
        const fn = nameParts[0] || '';
        const ln = nameParts.slice(1).join(' ') || '';

        // Format phone: must include country code. Assume 92 if starts with 0 or has 10 digits
        let phone = customer.phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '92' + phone.substring(1);
        } else if (phone.length === 10 && !phone.startsWith('92')) {
          phone = '92' + phone;
        }

        // Ensure phone has 92 prefix if it's a standard length Pakistani mobile number (10 digits after 0)
        if (phone.length === 10) {
          phone = '92' + phone;
        }

        return [
          customer.email || '',
          phone,
          fn,
          ln,
          customer.totalSpent.toFixed(2)
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `meta_audience_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Audience list exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export audience list');
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
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Customer Management</h1>
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <Users className="w-5 h-5" />
                View and analyze customer data and behavior
              </p>
            </div>
            <button
              onClick={exportToMetaCSV}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
              title="Export customer list for Meta Ads Audience upload"
            >
              <Download className="w-4 h-4" />
              Export for Meta
            </button>
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
