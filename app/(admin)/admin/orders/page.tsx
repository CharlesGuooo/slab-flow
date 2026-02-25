'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface Order {
  id: number;
  status: string;
  desiredDate: string;
  isContractor: boolean;
  totalBudget: string | null;
  finalQuotePrice: string | null;
  createdAt: string;
  stoneName: string | null;
  stoneSelectionText: string | null;
  customer: {
    username: string;
    email: string;
    phone: string | null;
  };
}

const STATUS_CONFIG = {
  pending_quote: {
    label: 'Pending Quote',
    icon: Clock,
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  quoted: {
    label: 'Quoted',
    icon: DollarSign,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  in_progress: {
    label: 'In Progress',
    icon: TrendingUp,
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [counts, setCounts] = useState({
    pending_quote: 0,
    quoted: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });

  const fetchOrders = async (status?: string) => {
    try {
      const url = status && status !== 'all'
        ? `/api/admin/orders?status=${status}`
        : '/api/admin/orders';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data.orders || []);

      // Calculate counts from all orders if we fetched all
      if (!status || status === 'all') {
        const newCounts = {
          pending_quote: 0,
          quoted: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
        };
        (data.orders || []).forEach((order: Order) => {
          if (newCounts.hasOwnProperty(order.status)) {
            newCounts[order.status as keyof typeof newCounts]++;
          }
        });
        setCounts(newCounts);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusFilter = (status: string) => {
    setActiveStatus(status);
    setIsLoading(true);
    fetchOrders(status);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: string | null) => {
    if (!price) return '-';
    return `$${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getDesiredDateLabel = (date: string) => {
    const labels: Record<string, string> = {
      ASAP: 'ASAP',
      within_2_weeks: 'Within 2 Weeks',
      within_a_month: 'Within a Month',
      not_in_a_hurry: 'Not in a Hurry',
    };
    return labels[date] || date;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="ml-3 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage customer quote requests and orders
        </p>
      </div>

      {/* Status tabs with counts */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          <button
            onClick={() => handleStatusFilter('all')}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
              activeStatus === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Orders
          </button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeStatus === status
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {config.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${config.bgColor} ${config.textColor}`}>
                {counts[status as keyof typeof counts]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Orders table */}
      {orders.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending_quote;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.stoneName || order.stoneSelectionText || 'Custom Selection'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {formatPrice(order.finalQuotePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeStatus !== 'all'
              ? `No ${activeStatus.replace('_', ' ')} orders`
              : 'Orders will appear here when customers submit quote requests'}
          </p>
        </div>
      )}
    </div>
  );
}
