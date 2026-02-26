'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocalePath } from '@/lib/hooks/useLocalePath';

interface FabItem {
  label: string;
  unit: string;
  pricePerUnit: number;
  quantity: string;
}

export default function CalculatorPage() {
  const localePath = useLocalePath();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('calculator');
  const tCommon = useTranslations('common');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Fabrication items per original spec
  const [items, setItems] = useState<FabItem[]>([
    { label: 'Straight Cut', unit: 'sq ft', pricePerUnit: 30, quantity: '' },
    { label: '45-Degree Cut', unit: 'sq ft', pricePerUnit: 45, quantity: '' },
    { label: 'Waterfall', unit: 'sq ft', pricePerUnit: 60, quantity: '' },
    { label: 'Double Edge', unit: 'sq ft', pricePerUnit: 50, quantity: '' },
    { label: 'Single Edge', unit: 'sq ft', pricePerUnit: 35, quantity: '' },
    { label: 'Labour Cost', unit: 'hours', pricePerUnit: 40, quantity: '' },
    { label: 'Fabrication Material', unit: 'sq ft', pricePerUnit: 3, quantity: '' },
  ]);

  // Check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/client/account');
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const updateQuantity = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index].quantity = value;
    setItems(newItems);
  };

  const getSubtotal = (item: FabItem): number => {
    const qty = parseFloat(item.quantity);
    if (isNaN(qty) || qty <= 0) return 0;
    return qty * item.pricePerUnit;
  };

  const total = items.reduce((sum, item) => sum + getSubtotal(item), 0);
  const hasAnyInput = items.some(item => item.quantity && parseFloat(item.quantity) > 0);

  // Not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">{tCommon('loginRequired')}</h2>
          <p className="text-stone-500 mb-8">{tCommon('loginRequiredDesc')}</p>
          <Link href={`/${locale}/login?redirect=/${locale}/calculator`}
            className="px-6 py-3 text-sm font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-all">
            {tCommon('signInNow')}
          </Link>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
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
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <Link href={localePath('/browse')}
        className="inline-flex items-center text-sm text-stone-400 hover:text-stone-600 transition-colors mb-6">
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {t('backToBrowse') || 'Back to Browse'}
      </Link>

      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#f5f0ea] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">{t('title') || 'Fabrication Cost Calculator'}</h1>
        <p className="text-stone-500 text-sm">{t('subtitle') || 'Estimate your fabrication and labour costs'}</p>
      </div>

      {/* Calculator Card */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#faf8f5] border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase tracking-wider">
          <div className="col-span-4">Service</div>
          <div className="col-span-2 text-center">Rate (CAD)</div>
          <div className="col-span-3 text-center">Quantity</div>
          <div className="col-span-3 text-right">Subtotal</div>
        </div>

        {/* Items */}
        {items.map((item, index) => {
          const subtotal = getSubtotal(item);
          return (
            <div key={index} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center ${index < items.length - 1 ? 'border-b border-stone-50' : ''}`}>
              <div className="col-span-4">
                <p className="text-sm font-medium text-stone-900">{item.label}</p>
                <p className="text-xs text-stone-400">${item.pricePerUnit}/{item.unit}</p>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm text-stone-700 font-medium">${item.pricePerUnit}</span>
              </div>
              <div className="col-span-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(index, e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-900 text-center focus:ring-1 focus:ring-amber-300 focus:border-amber-300 bg-white placeholder:text-stone-300"
                  />
                  <span className="text-xs text-stone-400 whitespace-nowrap">{item.unit}</span>
                </div>
              </div>
              <div className="col-span-3 text-right">
                <span className={`text-sm font-medium ${subtotal > 0 ? 'text-stone-900' : 'text-stone-300'}`}>
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="border-t-2 border-stone-200 px-6 py-5 bg-[#faf8f5]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Total Fabrication Cost</p>
              <p className="text-xs text-stone-400 mt-0.5">Before any adjustments or discounts</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${hasAnyInput ? 'text-amber-700' : 'text-stone-300'}`}>
                ${total.toFixed(2)}
              </p>
              <p className="text-xs text-stone-400">CAD</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 p-4 bg-[#faf8f5] rounded-lg border border-stone-100">
        <div className="flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-stone-500 leading-relaxed">
            <p className="font-medium text-stone-700 mb-1">Important Notes</p>
            <p>This is an internal fabrication cost estimate only. Stone slab costs are not included. Final pricing may be adjusted by the shop owner based on project complexity, material waste, and other factors. This calculation is for reference purposes and is not automatically saved.</p>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      {hasAnyInput && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setItems(items.map(item => ({ ...item, quantity: '' })))}
            className="text-sm text-stone-400 hover:text-stone-600 transition-colors underline"
          >
            Reset all values
          </button>
        </div>
      )}
    </div>
  );
}
