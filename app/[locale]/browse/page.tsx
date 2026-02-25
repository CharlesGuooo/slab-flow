'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Package, Loader2, Filter } from 'lucide-react';

interface Stone {
  id: number;
  brand: string;
  series: string;
  stoneType: string;
  pricePerSlab: string;
  imageUrl: string;
  name: { en?: string; zh?: string; fr?: string } | string;
}

const STONE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'quartz', label: 'Quartz' },
  { value: 'granite', label: 'Granite' },
  { value: 'marble', label: 'Marble' },
  { value: 'quartzite', label: 'Quartzite' },
  { value: 'porcelain', label: 'Porcelain' },
];

export default function BrowsePage() {
  const [stones, setStones] = useState<Stone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const fetchStones = async () => {
      try {
        const response = await fetch('/api/client/stones');
        if (response.ok) {
          const data = await response.json();
          setStones(data.stones || []);
        }
      } catch (error) {
        console.error('Error fetching stones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStones();
  }, []);

  const getStoneName = (name: Stone['name']): string => {
    if (!name) return 'Stone';
    if (typeof name === 'string') {
      try {
        const parsed = JSON.parse(name);
        return parsed.en || parsed.zh || name;
      } catch {
        return name;
      }
    }
    return name.en || name.zh || 'Stone';
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

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Stones</h1>
          <p className="mt-2 text-gray-600">
            Explore our collection of premium stone surfaces
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by brand, series, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              {STONE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Stone images are for representation purposes. Actual products may vary in color, pattern, and texture.
            Please contact us to see actual samples.
          </p>
        </div>

        {/* Stones grid */}
        {filteredStones.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStones.map((stone) => (
              <Link
                key={stone.id}
                href={`/browse/${stone.id}`}
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square relative bg-gray-100">
                  {stone.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={stone.imageUrl}
                      alt={getStoneName(stone.name)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-white/90 rounded-full capitalize">
                    {stone.stoneType}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {getStoneName(stone.name)}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {stone.brand} - {stone.series}
                  </p>
                  {stone.pricePerSlab && (
                    <p className="text-lg font-semibold text-blue-600 mt-2">
                      ${parseFloat(stone.pricePerSlab).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No stones found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType
                ? 'Try adjusting your search or filter'
                : 'No stones available at the moment'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
