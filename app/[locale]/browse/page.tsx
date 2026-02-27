'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocalePath } from '@/lib/hooks/useLocalePath';

interface Stone {
  id: number;
  brand: string;
  series: string;
  stoneType: string;
  pricePerSlab: string;
  imageUrl: string;
  name: { en?: string; zh?: string; fr?: string } | string;
}

export default function BrowsePage() {
  const localePath = useLocalePath();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('browse');
  const tCommon = useTranslations('common');
  const [stones, setStones] = useState<Stone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const stoneTypeLabels: Record<string, Record<string, string>> = {
    'sintered stone': { en: 'Sintered Stone', zh: '岩板', fr: 'Pierre frittée' },
    'sintered': { en: 'Sintered Stone', zh: '岩板', fr: 'Pierre frittée' },
    'quartz': { en: 'Quartz', zh: '石英石', fr: 'Quartz' },
    'granite': { en: 'Granite', zh: '花岗岩', fr: 'Granit' },
    'marble': { en: 'Marble', zh: '大理石', fr: 'Marbre' },
    'quartzite': { en: 'Quartzite', zh: '石英岩', fr: 'Quartzite' },
    'porcelain': { en: 'Porcelain', zh: '瓷砖', fr: 'Porcelaine' },
  };

  const getStoneTypeLabel = (value: string): string => {
    const key = value.toLowerCase();
    return stoneTypeLabels[key]?.[locale] || stoneTypeLabels[key]?.en || value;
  };

  const STONE_TYPES = [
    { value: '', label: t('allTypes') },
    { value: 'sintered stone', label: getStoneTypeLabel('sintered stone') },
    { value: 'quartz', label: getStoneTypeLabel('quartz') },
    { value: 'granite', label: getStoneTypeLabel('granite') },
    { value: 'marble', label: getStoneTypeLabel('marble') },
    { value: 'quartzite', label: getStoneTypeLabel('quartzite') },
    { value: 'porcelain', label: getStoneTypeLabel('porcelain') },
  ];

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
    if (!name) return locale === 'zh' ? '石材' : 'Stone';
    if (typeof name === 'string') {
      try {
        const parsed = JSON.parse(name);
        return parsed[locale] || parsed.en || parsed.zh || name;
      } catch {
        return name;
      }
    }
    return (name as Record<string, string>)[locale] || name.en || name.zh || 'Stone';
  };

  const filteredStones = stones.filter((stone) => {
    const matchesSearch =
      stone.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stone.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStoneName(stone.name).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || stone.stoneType === filterType;
    return matchesSearch && matchesType;
  });

  // Group stones by brand (supplier)
  const groupedStones: Record<string, Stone[]> = {};
  filteredStones.forEach(stone => {
    if (!groupedStones[stone.brand]) groupedStones[stone.brand] = [];
    groupedStones[stone.brand].push(stone);
  });

  const stonesCountLabel = (count: number) => {
    if (locale === 'zh') return `${count} 款石材`;
    if (locale === 'fr') return `${count} pierre${count > 1 ? 's' : ''}`;
    return `${count} stone${count > 1 ? 's' : ''}`;
  };

  const disclaimerText = locale === 'zh'
    ? '图片仅供参考。实际石材产品的颜色、纹理和质感可能有所不同。每块石材都是独一无二的。请访问我们的展厅或联系我们查看实物样品。所有价格均为每块石板（3.2m x 1.6m，20mm厚）。'
    : locale === 'fr'
    ? 'Les images sont fournies à titre indicatif uniquement. Les produits en pierre réels peuvent varier en couleur, motif et texture. Chaque dalle est unique. Veuillez visiter notre showroom ou nous contacter pour voir des échantillons réels. Tous les prix sont par dalle (3,2m x 1,6m, 20mm d\'épaisseur).'
    : 'Images are for reference only. Actual stone products may vary in color, pattern, and texture. Each slab is unique. Please visit our showroom or contact us to see actual samples. All prices are per slab (3.2m x 1.6m, 20mm thick).';

  const perSlabText = locale === 'zh' ? '/块' : locale === 'fr' ? '/dalle' : '/slab';
  const quickViewText = locale === 'zh' ? '快速查看' : locale === 'fr' ? 'Aperçu rapide' : 'Quick View';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-stone-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">{tCommon('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">{t('title')}</h1>
          <p className="mt-2 text-stone-500 text-sm">{t('subtitle')}</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-amber-300 focus:border-amber-300 bg-white"
            />
          </div>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 focus:ring-1 focus:ring-amber-300 focus:border-amber-300 bg-white appearance-none pr-8"
            >
              {STONE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 px-4 py-3 bg-[#faf8f5] border border-stone-100 rounded-lg flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-stone-500">{disclaimerText}</p>
        </div>

        {/* Stones grouped by supplier */}
        {Object.keys(groupedStones).length > 0 ? (
          <div className="space-y-10">
            {Object.entries(groupedStones).map(([brand, brandStones]) => (
              <div key={brand}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-stone-900">{brand}</h2>
                  <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{stonesCountLabel(brandStones.length)}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {brandStones.map((stone) => (
                    <Link
                      key={stone.id}
                      href={localePath(`/browse/${stone.id}`)}
                      className="group bg-white rounded-lg border border-stone-100 overflow-hidden hover:shadow-md hover:border-amber-200 transition-all"
                    >
                      <div className="aspect-square relative bg-stone-50">
                        {stone.imageUrl ? (
                          <img
                            src={stone.imageUrl}
                            alt={getStoneName(stone.name)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <svg className="w-10 h-10 text-stone-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-medium bg-white/90 text-stone-600 rounded-full capitalize backdrop-blur-sm">
                          {getStoneTypeLabel(stone.stoneType)}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">{stone.brand}</p>
                        <h3 className="text-sm font-semibold text-stone-900 mt-0.5 truncate">{stone.series}</h3>
                        <p className="text-xs text-stone-500 mt-0.5 truncate">{getStoneName(stone.name)}</p>
                        {stone.pricePerSlab && (
                          <p className="text-sm font-bold text-amber-700 mt-2">
                            ${parseFloat(stone.pricePerSlab).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            <span className="text-[10px] font-normal text-stone-400 ml-1">{perSlabText}</span>
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-stone-100">
            <svg className="mx-auto w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-3 text-sm font-medium text-stone-900">{t('noResults')}</h3>
            <p className="mt-1 text-xs text-stone-500">
              {searchTerm || filterType
                ? (locale === 'zh' ? '请尝试调整搜索或筛选条件' : locale === 'fr' ? 'Essayez d\'ajuster votre recherche ou filtre' : 'Try adjusting your search or filter')
                : (locale === 'zh' ? '暂时没有可用的石材' : locale === 'fr' ? 'Aucune pierre disponible pour le moment' : 'No stones available at the moment')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
