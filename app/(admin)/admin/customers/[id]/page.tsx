'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Coins,
  ShoppingCart,
  Plus,
  Save,
} from 'lucide-react';

interface Customer {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  aiCredits: string;
  createdAt: string;
}

interface Order {
  id: number;
  status: string;
  stoneName: string | null;
  stoneSelectionText: string | null;
  finalQuotePrice: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending_quote: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending_quote: 'Pending Quote',
  quoted: 'Quoted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [creditAmount, setCreditAmount] = useState('10.00');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/admin/customers/${customerId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Customer not found');
          } else {
            setError('Failed to load customer');
          }
          return;
        }

        const data = await response.json();
        setCustomer(data.customer);
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('Failed to load customer');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const handleAddCredits = async () => {
    if (!customer) return;

    setIsSaving(true);
    try {
      const currentCredits = parseFloat(customer.aiCredits || '0');
      const addAmount = parseFloat(creditAmount);
      const newCredits = (currentCredits + addAmount).toFixed(2);

      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aiCredits: newCredits,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update credits');
      }

      const data = await response.json();
      setCustomer(data.customer);
      alert(`Added $${addAmount.toFixed(2)} credits. New balance: $${newCredits}`);
    } catch (err) {
      console.error('Error updating credits:', err);
      alert('Failed to update credits');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: string | null) => {
    if (!price) return '-';
    return `$${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error || 'Customer not found'}</p>
          </div>
        </div>
        <Link
          href="/admin/customers"
          className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Customers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.username}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customer since {formatDate(customer.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Customer info and orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              Customer Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </p>
                <p className="font-medium">{customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone
                </p>
                <p className="font-medium">{customer.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Registered
                </p>
                <p className="font-medium">{formatDate(customer.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <ShoppingCart className="h-4 w-4" />
                  Total Orders
                </p>
                <p className="font-medium">{orders.length}</p>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order History</h2>
            {orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-900">
                        #{order.id}
                      </span>
                      <span className="text-sm text-gray-600">
                        {order.stoneName || order.stoneSelectionText || 'Custom Selection'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(order.finalQuotePrice)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>

        {/* Right column - Credits */}
        <div className="space-y-6">
          {/* Current Credits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              AI Credits
            </h2>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-gray-900">
                ${parseFloat(customer.aiCredits || '0').toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Current Balance</p>
            </div>
          </div>

          {/* Add Credits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Add Credits</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleAddCredits}
                disabled={isSaving || parseFloat(creditAmount) <= 0}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credits
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
