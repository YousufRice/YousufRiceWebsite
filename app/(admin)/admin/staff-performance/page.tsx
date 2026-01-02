"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import {
    Users,
    Package,
    DollarSign,
    Scale,
} from "lucide-react";
import { Query } from "appwrite";
import toast from "react-hot-toast";

// Helper to detect agent from name based on lib/meta.ts logic
const getAgentType = (name: string = ""): "s_agent" | "k_agent" | "direct" => {
        // Regex Logic:
        // 1. Matches "- s", "- S" with optional spaces
        // 2. Matches "(s)", "(S)" with optional spaces
        // 3. Matches standalone "s", "S" (word boundaries)
        const sPattern = /\s*-\s*[sS]\s*|\s*\(\s*[sS]\s*\)\s*|\b[sS]\b/;

    // Same logic for K agent
    const kPattern = /\s*-\s*[kK]\s*|\s*\(\s*[kK]\s*\)\s*|\b[kK]\b/;

    if (sPattern.test(name)) return "s_agent";
    if (kPattern.test(name)) return "k_agent";
    return "direct";
};

interface AgentStats {
    totalOrders: number;
    totalRevenue: number;
    totalWeight: number;
}

const initialStats: AgentStats = {
    totalOrders: 0,
    totalRevenue: 0,
    totalWeight: 0,
};

export default function StaffPerformancePage() {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState("");
    const [dateFilter, setDateFilter] = useState<
        "today" | "week" | "month" | "custom"
    >("week");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    const [stats, setStats] = useState({
        s_agent: { ...initialStats },
        k_agent: { ...initialStats },
        direct: { ...initialStats },
        total: { ...initialStats },
    });

    useEffect(() => {
        fetchStats();
    }, [dateFilter, customStartDate, customEndDate]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setProgress("Initializing...");

            // Calculate Date Range
            const now = new Date();
            let start = new Date();
            let end = new Date(); // End is always now unless custom

            if (dateFilter === "today") {
                start.setHours(0, 0, 0, 0);
            } else if (dateFilter === "week") {
                start.setDate(now.getDate() - 7);
            } else if (dateFilter === "month") {
                start.setMonth(now.getMonth() - 1);
            } else if (dateFilter === "custom") {
                if (!customStartDate || !customEndDate) {
                    setLoading(false);
                    setProgress("");
                    return; // Wait for both dates
                }
                start = new Date(customStartDate);
                // Set end date to end of the day if it's just a date string
                end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
            } else {
                // Default to all time or some logical default? Let's assume week if undefined but type says otherwise
                start.setDate(now.getDate() - 7);
            }

            // 1. Fetch ALL relevant orders
            const allOrders: Order[] = [];
            let lastId = null;
            let hasMore = true;
            const CHUNK_SIZE = 1000; // Larger chunk for orders is usually fine

            while (hasMore) {
                setProgress(`Fetching orders... (${allOrders.length})`);

                const queries: string[] = [
                    Query.greaterThanEqual("$createdAt", start.toISOString()),
                    Query.lessThanEqual("$createdAt", end.toISOString()),
                    Query.limit(CHUNK_SIZE),
                ];

                if (lastId) {
                    queries.push(Query.cursorAfter(lastId));
                }

                const response = await databases.listDocuments(
                    DATABASE_ID,
                    ORDERS_TABLE_ID,
                    queries
                );

                const chunk = response.documents as unknown as Order[];
                if (chunk.length > 0) {
                    allOrders.push(...chunk);
                    lastId = chunk[chunk.length - 1].$id;
                }

                if (chunk.length < CHUNK_SIZE) {
                    hasMore = false;
                }
            }

            // 2. Fetch Customers
            setProgress(`Processing ${allOrders.length} orders...`);

            const customerMap = new Map<string, string>(); // Map ID -> Name
            const uniqueCustomerIds = Array.from(new Set(allOrders.map(o => o.customer_id)));

            // IMPROVED: Batch fetching with delay to handle rate limits
            const CUSTOMER_BATCH_SIZE = 20;
            let processedCustomers = 0;

            for (let i = 0; i < uniqueCustomerIds.length; i += CUSTOMER_BATCH_SIZE) {
                setProgress(`Fetching customer data... ${processedCustomers}/${uniqueCustomerIds.length}`);

                const batchIds = uniqueCustomerIds.slice(i, i + CUSTOMER_BATCH_SIZE);

                await Promise.all(batchIds.map(async (customerId) => {
                    try {
                        const customer = await databases.getDocument(
                            DATABASE_ID,
                            CUSTOMERS_TABLE_ID,
                            customerId
                        ) as unknown as Customer;
                        customerMap.set(customerId, customer.full_name);
                    } catch (error) {
                        console.error(`Failed to fetch customer ${customerId}`, error);
                        customerMap.set(customerId, ""); // Mark as empty but present
                    }
                }));

                processedCustomers += batchIds.length;
                // Add explicit delay to throttle requests
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // 3. Calculate Stats
            const newStats = {
                s_agent: { ...initialStats },
                k_agent: { ...initialStats },
                direct: { ...initialStats },
                total: { ...initialStats }
            };

            allOrders.forEach(order => {
                if (order.status === 'returned') return;

                const customerName = customerMap.get(order.customer_id) || "";
                const type = getAgentType(customerName);

                const weight = order.total_weight_kg || 0;
                const price = order.total_price || 0;

                // Add to specific agent
                newStats[type].totalOrders += 1;
                newStats[type].totalRevenue += price;
                newStats[type].totalWeight += weight;

                // Add to global total
                newStats.total.totalOrders += 1;
                newStats.total.totalRevenue += price;
                newStats.total.totalWeight += weight;
            });

            setStats(newStats);

        } catch (error) {
            console.error("Error fetching stats:", error);
            toast.error("Failed to load staff performance data");
        } finally {
            setLoading(false);
            setProgress("");
        }
    };

    return (
        <AdminAuthGuard>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Staff Performance
                    </h1>
                    <p className="text-gray-600">
                        Track performance stats for S Agent, K Agent, and Direct orders.
                    </p>
                </div>

                {/* Filters */}
                <Card className="mb-8">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Time Range</label>
                            <Select
                                value={dateFilter}
                                onValueChange={(val: any) => setDateFilter(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">Last 7 Days</SelectItem>
                                    <SelectItem value="month">Last 30 Days</SelectItem>
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {dateFilter === 'custom' && (
                            <>
                                <div className="w-full md:w-auto">
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                                    <Input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-auto">
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                                    <Input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        <Button onClick={fetchStats} disabled={loading} className="w-full md:w-auto">
                            {loading ? "Loading..." : "Refresh Stats"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Loading Progress */}
                {loading && progress && (
                    <div className="mb-6 bg-blue-50 text-blue-700 px-4 py-3 rounded-md flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                        {progress}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* S Agent */}
                    <StatsCard
                        title="S Agent Reorders"
                        stats={stats.s_agent}
                        icon={<Users className="w-6 h-6 text-blue-600" />}
                        colorClass="border-blue-200 bg-blue-50"
                    />

                    {/* K Agent */}
                    <StatsCard
                        title="K Agent Reorders"
                        stats={stats.k_agent}
                        icon={<Users className="w-6 h-6 text-purple-600" />}
                        colorClass="border-purple-200 bg-purple-50"
                    />

                    {/* Direct */}
                    <StatsCard
                        title="Direct / Website"
                        stats={stats.direct}
                        icon={<Users className="w-6 h-6 text-green-600" />}
                        colorClass="border-green-200 bg-green-50"
                    />
                </div>

                {/* Grand Total */}
                <div className="mt-8">
                    <StatsCard
                        title="Grand Total (All Channels)"
                        stats={stats.total}
                        icon={<Users className="w-6 h-6 text-gray-800" />}
                        className="bg-white border-2 border-gray-200"
                    />
                </div>

            </div>
        </AdminAuthGuard>
    );
}

function StatsCard({
    title,
    stats,
    icon,
    colorClass = "bg-white",
    className = ""
}: {
    title: string;
    stats: AgentStats;
    icon: React.ReactNode;
    colorClass?: string;
    className?: string;
}) {
    return (
        <Card className={`${colorClass} ${className} shadow-sm`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Revenue
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                            {formatCurrency(stats.totalRevenue)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-200/50 pb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Package className="w-4 h-4" /> Orders
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                            {stats.totalOrders}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Scale className="w-4 h-4" /> Weight
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                            {stats.totalWeight} kg
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
