'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function ThreeDGenPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('threeDGen');
  const tCommon = useTranslations('common');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedSceneUrl, setGeneratedSceneUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image must be less than 10MB'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setGeneratedSceneUrl(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setGeneratedSceneUrl(null);
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress (real implementation would call World Labs API)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) { clearInterval(interval); return 95; }
        return prev + Math.random() * 10;
      });
    }, 3000);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/3d-gen', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate 3D scene');
      }

      const data = await response.json();
      setGeneratedSceneUrl(data.sceneUrl || data.splatUrl);
      setProgress(100);
    } catch (err) {
      console.error('3D generation error:', err);
      alert(err instanceof Error ? err.message : 'Failed to generate 3D scene. This feature may not be fully configured yet.');
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/${locale}/login?redirect=/${locale}/3d-gen`}
              className="px-6 py-3 text-sm font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-all">
              {tCommon('signInNow')}
            </Link>
            <Link href={`/${locale}/register`}
              className="px-6 py-3 text-sm font-medium text-stone-700 border border-stone-200 rounded-md hover:bg-stone-50 transition-all">
              {tCommon('createAccount')}
            </Link>
          </div>
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
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full mb-4">
          <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          <span className="text-xs font-medium text-amber-800 tracking-wider uppercase">World Labs AI</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight mb-3">{t('title')}</h1>
        <p className="text-stone-500 max-w-xl mx-auto">{t('subtitle')}</p>
      </div>

      {/* Upload Area */}
      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden shadow-sm">
        <div className="p-8">
          <h2 className="text-lg font-semibold text-stone-900 mb-2">{t('uploadTitle')}</h2>
          <p className="text-sm text-stone-500 mb-6">{t('uploadDesc')}</p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${previewUrl ? 'border-amber-300 bg-amber-50/30' : 'border-stone-200 hover:border-amber-300 hover:bg-[#faf8f5]'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <Image src={previewUrl} alt="Selected photo" width={400} height={300} className="rounded-lg max-h-64 object-contain mx-auto" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-stone-500">{selectedFile?.name}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 bg-[#f5f0ea] rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-700">{t('selectPhoto')}</p>
                  <p className="text-xs text-stone-400 mt-1">{t('dragDrop')}</p>
                </div>
                <p className="text-[10px] text-stone-400">{t('supportedFormats')}</p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={!selectedFile || isGenerating}
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('generating')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  {t('generate')}
                </>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {isGenerating && (
            <div className="mt-6">
              <div className="w-full bg-stone-100 rounded-full h-1.5">
                <div className="bg-amber-600 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-stone-400 mt-2 text-center">{Math.round(progress)}%</p>
            </div>
          )}
        </div>

        {/* Generated Scene Result */}
        {generatedSceneUrl && (
          <div className="border-t border-stone-100 p-8 bg-[#faf8f5]">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="font-semibold text-stone-900">3D Scene Ready</h3>
            </div>
            <a
              href={generatedSceneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              {t('viewScene')}
            </a>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6">
          <div className="w-10 h-10 bg-[#f5f0ea] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-sm font-bold text-amber-800">1</span>
          </div>
          <h3 className="text-sm font-semibold text-stone-900 mb-1">Upload Photo</h3>
          <p className="text-xs text-stone-500">Take a photo of your kitchen, bathroom, or any space</p>
        </div>
        <div className="text-center p-6">
          <div className="w-10 h-10 bg-[#f5f0ea] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-sm font-bold text-amber-800">2</span>
          </div>
          <h3 className="text-sm font-semibold text-stone-900 mb-1">AI Processing</h3>
          <p className="text-xs text-stone-500">Our AI reconstructs a 3D scene from your 2D photo</p>
        </div>
        <div className="text-center p-6">
          <div className="w-10 h-10 bg-[#f5f0ea] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-sm font-bold text-amber-800">3</span>
          </div>
          <h3 className="text-sm font-semibold text-stone-900 mb-1">Explore in 3D</h3>
          <p className="text-xs text-stone-500">Navigate through an interactive 3D version of your space</p>
        </div>
      </div>
    </div>
  );
}
