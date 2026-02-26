'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useLocalePath } from '@/lib/hooks/useLocalePath';

interface StoneInfo {
  id: number;
  name: string;
  brand: string;
  series: string;
  imageUrl: string;
  price: string;
}

export default function QuotePage() {
  const localePath = useLocalePath();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('quote');
  const tCommon = useTranslations('common');

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [stones, setStones] = useState<StoneInfo[]>([]);
  const [selectedStoneId, setSelectedStoneId] = useState<string>(searchParams?.get('stone') || '');
  const [stoneSearch, setStoneSearch] = useState('');
  const [showStoneDropdown, setShowStoneDropdown] = useState(false);
  const [timeline, setTimeline] = useState('2weeks');
  const [isContractor, setIsContractor] = useState(false);
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load stones
  useEffect(() => {
    const loadStones = async () => {
      try {
        const response = await fetch('/api/stones');
        if (response.ok) {
          const data = await response.json();
          setStones(data.stones || []);
        }
      } catch (err) {
        console.error('Failed to load stones:', err);
      }
    };
    loadStones();
  }, []);

  const selectedStone = stones.find(s => s.id.toString() === selectedStoneId);
  const filteredStones = stones.filter(s =>
    s.name.toLowerCase().includes(stoneSearch.toLowerCase()) ||
    s.brand.toLowerCase().includes(stoneSearch.toLowerCase()) ||
    s.series.toLowerCase().includes(stoneSearch.toLowerCase())
  );

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) continue;

        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await response.json();
        if (response.ok && data.url) {
          setPhotos(prev => [...prev, data.url]);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoneId) {
      alert(locale === 'zh' ? '请选择一块石料' : 'Please select a stone');
      return;
    }
    if (photos.length === 0) {
      alert(locale === 'zh' ? '请上传至少一张照片' : 'Please upload at least one photo');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/client/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stoneId: parseInt(selectedStoneId, 10),
          timeline,
          isContractor,
          budget: budget || undefined,
          notes,
          photos,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit quote request');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <Link href={`/${locale}/login?redirect=/${locale}/quote`}
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

  // Success state
  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">
            {locale === 'zh' ? '报价请求已提交！' : locale === 'fr' ? 'Demande de devis soumise !' : 'Quote Request Submitted!'}
          </h2>
          <p className="text-stone-500 mb-8">
            {locale === 'zh' ? '我们的团队会尽快审核并回复您的报价。' : locale === 'fr' ? 'Notre équipe examinera et répondra à votre demande dès que possible.' : 'Our team will review and respond to your quote request as soon as possible.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href={localePath('/browse')}
              className="px-6 py-3 text-sm font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200 transition-all">
              {locale === 'zh' ? '继续浏览' : 'Continue Browsing'}
            </Link>
            <Link href={localePath('/chat')}
              className="px-6 py-3 text-sm font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-all">
              {locale === 'zh' ? '返回 AI 助手' : 'Back to AI Assistant'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-3">
          {locale === 'zh' ? '提交报价请求' : locale === 'fr' ? 'Demander un devis' : 'Request a Quote'}
        </h1>
        <p className="text-stone-500 max-w-lg mx-auto">
          {locale === 'zh' ? '填写以下信息，我们的团队将为您提供详细的加工和安装报价。' : locale === 'fr' ? 'Remplissez les informations ci-dessous et notre équipe vous fournira un devis détaillé.' : 'Fill in the details below and our team will provide you with a detailed fabrication and installation quote.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Stone Selection */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">1</span>
            {locale === 'zh' ? '选择石料' : 'Select Stone'}
          </h2>

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              value={selectedStone ? `${selectedStone.brand} - ${selectedStone.name}` : stoneSearch}
              onChange={(e) => {
                setStoneSearch(e.target.value);
                setSelectedStoneId('');
                setShowStoneDropdown(true);
              }}
              onFocus={() => setShowStoneDropdown(true)}
              placeholder={locale === 'zh' ? '搜索石料名称、品牌...' : 'Search stone name, brand...'}
              className="w-full px-4 py-3 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-amber-300 focus:border-amber-300"
            />
            {selectedStone && (
              <button
                type="button"
                onClick={() => { setSelectedStoneId(''); setStoneSearch(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Dropdown */}
            {showStoneDropdown && !selectedStoneId && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredStones.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-stone-400">
                    {locale === 'zh' ? '没有找到匹配的石料' : 'No stones found'}
                  </p>
                ) : (
                  filteredStones.map((stone) => (
                    <button
                      key={stone.id}
                      type="button"
                      onClick={() => {
                        setSelectedStoneId(stone.id.toString());
                        setStoneSearch('');
                        setShowStoneDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-stone-100">
                        {stone.imageUrl && (
                          <Image src={stone.imageUrl} alt={stone.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{stone.name}</p>
                        <p className="text-xs text-stone-500">{stone.brand} - {stone.series}</p>
                      </div>
                      <span className="ml-auto text-xs text-amber-700 font-medium">${stone.price}/slab</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected stone preview */}
          {selectedStone && (
            <div className="mt-4 flex items-center gap-4 p-3 bg-stone-50 rounded-lg">
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                {selectedStone.imageUrl && (
                  <Image src={selectedStone.imageUrl} alt={selectedStone.name} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">{selectedStone.name}</p>
                <p className="text-xs text-stone-500">{selectedStone.brand} - {selectedStone.series}</p>
                <p className="text-xs text-amber-700 font-medium mt-0.5">${selectedStone.price}/slab</p>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">2</span>
            {locale === 'zh' ? '时间安排' : 'Timeline'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'asap', label: locale === 'zh' ? '尽快' : 'ASAP' },
              { value: '2weeks', label: locale === 'zh' ? '2周内' : 'Within 2 weeks' },
              { value: '1month', label: locale === 'zh' ? '1个月内' : 'Within 1 month' },
              { value: 'flexible', label: locale === 'zh' ? '不急' : 'Flexible' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimeline(option.value)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  timeline === option.value
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photos (Required) */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-2 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">3</span>
            {locale === 'zh' ? '上传照片' : 'Upload Photos'}
            <span className="text-red-500 text-sm">*</span>
          </h2>
          <p className="text-xs text-stone-500 mb-4">
            {locale === 'zh' ? '请上传您的空间照片，以便我们准确报价。' : 'Please upload photos of your space for accurate quoting.'}
          </p>

          <div className="flex flex-wrap gap-3">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-stone-200">
                <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs mt-1">{locale === 'zh' ? '添加' : 'Add'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">4</span>
            {locale === 'zh' ? '其他信息（可选）' : 'Additional Info (Optional)'}
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="contractor"
                checked={isContractor}
                onChange={(e) => setIsContractor(e.target.checked)}
                className="w-4 h-4 text-amber-600 border-stone-300 rounded focus:ring-amber-300"
              />
              <label htmlFor="contractor" className="text-sm text-stone-700">
                {locale === 'zh' ? '我是承包商/装修公司' : locale === 'fr' ? 'Je suis entrepreneur' : 'I am a contractor'}
              </label>
            </div>

            <div>
              <label className="block text-sm text-stone-700 mb-1.5">
                {locale === 'zh' ? '总预算' : 'Total Budget'}
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={locale === 'zh' ? '例如：$5,000 - $10,000' : 'e.g., $5,000 - $10,000'}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-amber-300 focus:border-amber-300"
              />
            </div>

            <div>
              <label className="block text-sm text-stone-700 mb-1.5">
                {locale === 'zh' ? '备注' : 'Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={locale === 'zh' ? '任何其他需要说明的信息...' : 'Any additional information...'}
                rows={3}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-amber-300 focus:border-amber-300 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !selectedStoneId || photos.length === 0}
          className="w-full py-4 bg-stone-900 text-white font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm tracking-wide"
        >
          {isSubmitting
            ? (locale === 'zh' ? '提交中...' : 'Submitting...')
            : (locale === 'zh' ? '提交报价请求' : locale === 'fr' ? 'Soumettre la demande' : 'Submit Quote Request')
          }
        </button>
      </form>
    </div>
  );
}
