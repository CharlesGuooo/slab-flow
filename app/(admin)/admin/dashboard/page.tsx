'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface DashboardMetrics {
  pendingQuotes: number;
  quotedOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: number;
  customerName: string;
  stoneName: string;
  status: string;
  createdAt: string;
  finalQuotePrice: string | null;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        setMetrics(data.metrics);
        setRecentOrders(data.recentOrders || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-700 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 border border-red-100">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const statusCards = [
    { title: 'Pending Quotes', value: metrics?.pendingQuotes || 0, icon: Clock, color: 'amber' },
    { title: 'Quoted', value: metrics?.quotedOrders || 0, icon: DollarSign, color: 'blue' },
    { title: 'In Progress', value: metrics?.inProgressOrders || 0, icon: TrendingUp, color: 'violet' },
    { title: 'Completed', value: metrics?.completedOrders || 0, icon: CheckCircle, color: 'emerald' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-700' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-700' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', text: 'text-violet-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-emerald-700' },
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; label: string }> = {
      pending_quote: { bg: 'bg-amber-100 text-amber-700', label: 'Pending Quote' },
      quoted: { bg: 'bg-blue-100 text-blue-700', label: 'Quoted' },
      in_progress: { bg: 'bg-violet-100 text-violet-700', label: 'In Progress' },
      completed: { bg: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
      cancelled: { bg: 'bg-red-100 text-red-700', label: 'Cancelled' },
    };
    return map[status] || { bg: 'bg-stone-100 text-stone-700', label: status };
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">
          Overview of your business metrics and recent activity
        </p>
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => {
          const colors = colorMap[card.color];
          return (
            <div key={card.title} className="bg-white rounded-xl border border-stone-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 rounded-xl p-3 ${colors.bg}`}>
                  <card.icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">{card.title}</p>
                  <p className={`text-2xl font-bold ${colors.text}`}>{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-white rounded-xl border border-stone-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 rounded-xl p-3 bg-stone-100">
              <Users className="h-5 w-5 text-stone-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">New Customers This Month</p>
              <p className="text-2xl font-bold text-stone-700">{metrics?.newCustomersThisMonth || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 rounded-xl p-3 bg-emerald-50">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-700">
                ${(metrics?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100">
          <h2 className="text-lg font-semibold text-stone-900">Recent Orders</h2>
        </div>
        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Stone</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Quote</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentOrders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-stone-900">#{order.id}</td>
                      <td className="px-6 py-4 text-sm text-stone-600">{order.customerName}</td>
                      <td className="px-6 py-4 text-sm text-stone-600">{order.stoneName || 'Custom'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-[11px] font-semibold rounded-full ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600">
                        {order.finalQuotePrice ? `$${parseFloat(order.finalQuotePrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-stone-300" />
            <h3 className="mt-3 text-sm font-medium text-stone-700">No orders yet</h3>
            <p className="mt-1 text-sm text-stone-400">Get started by promoting your products to potential customers.</p>
          </div>
        )}
      </div>
    </div>
  );
}
