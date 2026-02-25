'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Package,
  Calendar,
  DollarSign,
  FileText,
  Image as ImageIcon,
  Save,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface OrderDetail {
  id: number;
  status: string;
  desiredDate: string;
  isContractor: boolean;
  totalBudget: string | null;
  finalQuotePrice: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  stoneId: number | null;
  stoneSelectionText: string | null;
}

interface Customer {
  username: string;
  email: string;
  phone: string | null;
  aiCredits: string;
  createdAt: string;
}

interface Stone {
  id: number;
  brand: string;
  series: string;
  stoneType: string;
  pricePerSlab: string;
  imageUrl: string;
  name: { en?: string; zh?: string } | string;
}

interface Photo {
  id: number;
  imageUrl: string;
  photoType: string;
  gaussianSplatUrl: string | null;
}

const STATUS_OPTIONS = [
  { value: 'pending_quote', label: 'Pending Quote', icon: Clock },
  { value: 'quoted', label: 'Quoted', icon: DollarSign },
  { value: 'in_progress', label: 'In Progress', icon: TrendingUp },
  { value: 'completed', label: 'Completed', icon: CheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
];

const STATUS_COLORS: Record<string, string> = {
  pending_quote: 'bg-yellow-100 text-yellow-700',
  quoted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [stone, setStone] = useState<Stone | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [editData, setEditData] = useState({
    status: '',
    finalQuotePrice: '',
    notes: '',
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Order not found');
          } else {
            setError('Failed to load order');
          }
          return;
        }

        const data = await response.json();
        setOrder(data.order);
        setCustomer(data.customer);
        setStone(data.stone);
        setPhotos(data.photos || []);

        setEditData({
          status: data.order.status,
          finalQuotePrice: data.order.finalQuotePrice || '',
          notes: data.order.notes || '',
        });
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleSave = async () => {
    if (!order) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editData.status,
          finalQuotePrice: editData.finalQuotePrice || null,
          notes: editData.notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      const data = await response.json();
      setOrder(data.order);
      alert('Order updated successfully!');
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: string | null) => {
    if (!price) return '-';
    return `$${parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getStoneName = (stoneData: Stone | null) => {
    if (!stoneData) return null;
    if (typeof stoneData.name === 'string') {
      try {
        const parsed = JSON.parse(stoneData.name);
        return parsed.en || parsed.zh || stoneData.name;
      } catch {
        return stoneData.name;
      }
    }
    return stoneData.name?.en || stoneData.name?.zh || stoneData.series;
  };

  const getDesiredDateLabel = (date: string) => {
    const labels: Record<string, string> = {
      ASAP: 'As Soon As Possible',
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

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error || 'Order not found'}</p>
          </div>
        </div>
        <Link
          href="/admin/orders"
          className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Created {formatDate(order.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
            {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Customer & Stone info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              Customer Information
            </h2>
            {customer ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{customer.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{customer.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer Since</p>
                  <p className="font-medium">{formatDate(customer.createdAt)}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Customer information not available</p>
            )}
          </div>

          {/* Stone Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-400" />
              Stone Selection
            </h2>
            {stone ? (
              <div className="flex gap-4">
                {stone.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stone.imageUrl}
                    alt={getStoneName(stone) || 'Stone'}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{getStoneName(stone)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Brand / Series</p>
                    <p className="font-medium">{stone.brand} - {stone.series}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium capitalize">{stone.stoneType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price per Slab</p>
                    <p className="font-medium">{formatPrice(stone.pricePerSlab)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-1">Custom Selection</p>
                <p className="font-medium">{order.stoneSelectionText || 'Not specified'}</p>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" />
              Order Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Desired Timeline
                </p>
                <p className="font-medium">{getDesiredDateLabel(order.desiredDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contractor</p>
                <p className="font-medium">{order.isContractor ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Customer Budget
                </p>
                <p className="font-medium">{formatPrice(order.totalBudget)}</p>
              </div>
            </div>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-gray-400" />
                Photos ({photos.length})
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.imageUrl}
                      alt="Order photo"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full ${
                      photo.photoType === 'ai_generated'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {photo.photoType === 'ai_generated' ? 'AI' : 'Upload'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Actions */}
        <div className="space-y-6">
          {/* Update Order */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Order</h2>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quote Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Final Quote Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editData.finalQuotePrice}
                  onChange={(e) => setEditData({ ...editData, finalQuotePrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add notes about this order..."
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium text-gray-900">Order Created</p>
                  <p className="text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              {order.updatedAt !== order.createdAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">Last Updated</p>
                    <p className="text-gray-500">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
