'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface Stone {
  id: number;
  brand: string;
  series: string;
  stoneType: string;
  pricePerSlab: string;
  imageUrl: string;
  name: { en?: string; zh?: string; fr?: string } | string;
  isActive: boolean;
  createdAt: string;
}

export default function InventoryPage() {
  const [stones, setStones] = useState<Stone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStones = async () => {
    try {
      const response = await fetch('/api/admin/inventory');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const data = await response.json();
      setStones(data.stones || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStones();
  }, []);

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/inventory/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete stone');
      }

      // Refresh the list
      await fetchStones();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting stone:', err);
      alert('Failed to delete stone');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStoneName = (name: Stone['name']) => {
    if (typeof name === 'string') {
      try {
        const parsed = JSON.parse(name);
        return parsed.en || parsed.zh || name;
      } catch {
        return name;
      }
    }
    return name?.en || name?.zh || 'Unnamed';
  };

  const getStoneTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      quartz: 'Quartz',
      granite: 'Granite',
      marble: 'Marble',
      quartzite: 'Quartzite',
      porcelain: 'Porcelain',
    };
    return types[type] || type;
  };

  const filteredStones = stones.filter((stone) => {
    const matchesSearch =
      stone.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stone.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStoneName(stone.name).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !filterType || stone.stoneType === filterType;

    return matchesSearch && matchesType;
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your stone inventory
          </p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Stone
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by brand, series, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="quartz">Quartz</option>
          <option value="granite">Granite</option>
          <option value="marble">Marble</option>
          <option value="quartzite">Quartzite</option>
          <option value="porcelain">Porcelain</option>
        </select>
      </div>

      {/* Stones grid */}
      {filteredStones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStones.map((stone) => (
            <div
              key={stone.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="aspect-square relative bg-gray-100">
                {stone.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stone.imageUrl}
                    alt={getStoneName(stone.name)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-white/90 rounded-full">
                  {getStoneTypeLabel(stone.stoneType)}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">
                  {getStoneName(stone.name)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {stone.brand} - {stone.series}
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  ${parseFloat(stone.pricePerSlab || '0').toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                  <span className="text-sm font-normal text-gray-500">/slab</span>
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/admin/inventory/${stone.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(stone.id)}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stones found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterType
              ? 'Try adjusting your search or filter'
              : 'Get started by adding your first stone'}
          </p>
          {!searchTerm && !filterType && (
            <Link
              href="/admin/inventory/new"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stone
            </Link>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900">Delete Stone</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this stone? This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 inline animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
