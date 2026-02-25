'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Loader2,
  Package,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Camera,
  User,
  Box,
} from 'lucide-react';
import { useLocalePath } from '@/lib/hooks/useLocalePath';

interface Order {
  id: number;
  status: string;
  stoneId: number | null;
  stoneSelectionText: string | null;
  desiredDate: string;
  isContractor: boolean;
  totalBudget: string | null;
  notes: string | null;
  finalQuotePrice: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stone {
  id: number;
  brand: string;
  series: string;
  stoneType: string;
  imageUrl: string;
  name: string | null;
  pricePerSlab: string;
}

interface Photo {
  id: number;
  imageUrl: string;
  photoType: string;
  gaussianSplatUrl: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending_quote: { label: 'Pending Quote', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  quoted: { label: 'Quoted', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: Package },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function OrderDetailPage() {
  const localePath = useLocalePath();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [stone, setStone] = useState<Stone | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/client/orders/${orderId}`);

        if (!response.ok) {
          if (response.status === 401) {
            router.push(localePath('/login'));
            return;
          }
          throw new Error('Failed to load order');
        }

        const data = await response.json();
        setOrder(data.order);
        setStone(data.stone);
        setPhotos(data.photos || []);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router]);

  const getStoneName = (): string => {
    if (!stone) return 'Custom Selection';
    if (!stone.name) return `${stone.brand} - ${stone.series}`;
    try {
      const parsed = JSON.parse(stone.name);
      return parsed.en || parsed.zh || stone.name;
    } catch {
      return stone.name;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeline = (value: string) => {
    const labels: Record<string, string> = {
      ASAP: 'As Soon As Possible',
      within_2_weeks: 'Within 2 Weeks',
      within_a_month: 'Within a Month',
      not_in_a_hurry: 'Not in a Hurry',
    };
    return labels[value] || value;
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
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
          <Link
            href={localePath('/account')}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Account
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_quote;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link
        href={localePath('/account')}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Account
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.id}
              </h1>
              <p className="text-gray-500 mt-1">
                Submitted on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.color}`}>
              <StatusIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{statusConfig.label}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Stone Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stone Selection</h2>
            {stone ? (
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {stone.imageUrl ? (
                    <Image
                      src={stone.imageUrl}
                      alt={getStoneName()}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{getStoneName()}</p>
                  <p className="text-sm text-gray-500">{stone.brand} - {stone.series}</p>
                  <p className="text-sm text-gray-500">{stone.stoneType}</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">
                    ${stone.pricePerSlab} per slab
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 italic">
                  {order.stoneSelectionText || 'No specific stone selected'}
                </p>
              </div>
            )}
          </div>

          {/* Quote Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Details</h2>
            {order.finalQuotePrice ? (
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Your Quote</p>
                <p className="text-3xl font-bold text-green-700">
                  ${parseFloat(order.finalQuotePrice).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Quote provided on {formatDate(order.updatedAt)}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Your quote is being prepared. We&apos;ll notify you once it&apos;s ready!
                </p>
              </div>
            )}

            {order.totalBudget && (
              <p className="text-sm text-gray-600 mt-3">
                Your budget: ${parseFloat(order.totalBudget).toLocaleString()}
              </p>
            )}
          </div>

          {/* Project Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Timeline</p>
                  <p className="font-medium text-gray-900">{formatTimeline(order.desiredDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Customer Type</p>
                  <p className="font-medium text-gray-900">
                    {order.isContractor ? 'Contractor/Designer' : 'Homeowner'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Notes</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-gray-400" />
              Project Photos ({photos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  <Image
                    src={photo.imageUrl}
                    alt="Project photo"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                  {/* 3D View Button */}
                  {photo.gaussianSplatUrl && (
                    <Link
                      href={localePath(`/account/orders/${orderId}/3d-view`)}
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="flex flex-col items-center text-white">
                        <Box className="h-8 w-8 mb-2" />
                        <span className="text-sm font-medium">View 3D</span>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
          <div className="flex items-center gap-2">
            {['pending_quote', 'quoted', 'in_progress', 'completed'].map((status, index) => {
              const config = STATUS_CONFIG[status];
              const isActive = order.status === status;
              const isPast = ['pending_quote', 'quoted', 'in_progress', 'completed']
                .indexOf(order.status) > index;

              return (
                <div key={status} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-12 h-1 mx-1 ${
                        isPast ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Pending</span>
            <span>Quoted</span>
            <span>In Progress</span>
            <span>Completed</span>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 flex gap-4">
          <Link
            href={localePath('/browse')}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Continue Browsing
          </Link>
          <Link
            href={localePath('/chat')}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Chat with AI Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}
