'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, Package, MessageCircle } from 'lucide-react';
import { useLocalePath } from '@/lib/hooks/useLocalePath';
import { useTranslations } from 'next-intl';

interface Stone {
  id: number;
  brand: string;
  series: string;
  stoneType: string;
  pricePerSlab: string;
  imageUrl: string;
  name: { en?: string; zh?: string; fr?: string } | string;
  description: { en?: string; zh?: string; fr?: string } | string;
}

export default function StoneDetailPage() {
  const params = useParams();
  const stoneId = params.id as string;
  const locale = (params?.locale as string) || 'en';
  const localePath = useLocalePath();
  const t = useTranslations('stone');
  const tBrowse = useTranslations('browse');
  const tCommon = useTranslations('common');

  const [stone, setStone] = useState<Stone | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStone = async () => {
      try {
        const response = await fetch(`/api/client/stones/${stoneId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError(locale === 'zh' ? '未找到石材' : locale === 'fr' ? 'Pierre non trouvée' : 'Stone not found');
          } else {
            setError(locale === 'zh' ? '加载失败' : locale === 'fr' ? 'Échec du chargement' : 'Failed to load stone');
          }
          return;
        }

        const data = await response.json();
        setStone(data.stone);
      } catch (err) {
        console.error('Error fetching stone:', err);
        setError(locale === 'zh' ? '加载失败' : locale === 'fr' ? 'Échec du chargement' : 'Failed to load stone');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStone();
  }, [stoneId, locale]);

  const getLocalizedText = (field: Stone['name'] | Stone['description'], fallback: string): string => {
    if (!field) return fallback;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return parsed[locale] || parsed.en || parsed.zh || field || fallback;
      } catch {
        return field || fallback;
      }
    }
    const f = field as Record<string, string>;
    return f[locale] || f.en || f.zh || fallback;
  };

  const getStoneTypeName = (type: string): string => {
    const types: Record<string, Record<string, string>> = {
      'sintered stone': { en: 'Sintered Stone', zh: '岩板', fr: 'Pierre frittée' },
      'sintered': { en: 'Sintered Stone', zh: '岩板', fr: 'Pierre frittée' },
      'quartz': { en: 'Quartz', zh: '石英石', fr: 'Quartz' },
      'granite': { en: 'Granite', zh: '花岗岩', fr: 'Granit' },
      'marble': { en: 'Marble', zh: '大理石', fr: 'Marbre' },
      'quartzite': { en: 'Quartzite', zh: '石英岩', fr: 'Quartzite' },
      'porcelain': { en: 'Porcelain', zh: '瓷砖', fr: 'Porcelaine' },
    };
    const key = type.toLowerCase();
    return types[key]?.[locale] || types[key]?.en || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !stone) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error || (locale === 'zh' ? '未找到石材' : 'Stone not found')}</p>
          </div>
        </div>
        <Link
          href={localePath('/browse')}
          className="mt-4 inline-flex items-center text-sm text-amber-700 hover:text-amber-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {tBrowse('title')}
        </Link>
      </div>
    );
  }

  const noDescText = locale === 'zh' ? '暂无描述。' : locale === 'fr' ? 'Aucune description disponible.' : 'No description available.';

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={localePath('/browse')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {locale === 'zh' ? '返回浏览' : locale === 'fr' ? 'Retour à la navigation' : 'Back to Browse'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            {stone.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stone.imageUrl}
                alt={getLocalizedText(stone.name, 'Stone')}
                className="w-full h-auto aspect-square object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <Package className="h-24 w-24 text-gray-300" />
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full capitalize mb-4">
              {getStoneTypeName(stone.stoneType)}
            </span>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {getLocalizedText(stone.name, 'Stone')}
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              {stone.brand} - {stone.series}
            </p>

            {stone.pricePerSlab && (
              <div className="mb-6">
                <p className="text-sm text-gray-500">{t('pricePerSlab')}</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${parseFloat(stone.pricePerSlab).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('description')}</h2>
              <p className="text-gray-600 leading-relaxed">
                {getLocalizedText(stone.description, noDescText)}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
              <p className="text-sm text-yellow-700">
                <strong>{locale === 'zh' ? '注意：' : locale === 'fr' ? 'Remarque :' : 'Note:'}</strong> {t('imageDisclaimer')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={localePath('/register')}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {tBrowse('requestQuote')}
              </Link>
              <Link
                href={localePath('/chat')}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                {tBrowse('chatAboutStone')}
              </Link>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{t('brand')}</h3>
            <p className="text-gray-600">{stone.brand}</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{t('series')}</h3>
            <p className="text-gray-600">{stone.series}</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">{t('type')}</h3>
            <p className="text-gray-600 capitalize">{getStoneTypeName(stone.stoneType)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
