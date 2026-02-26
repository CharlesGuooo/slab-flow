'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type GenerationStatus = 'idle' | 'uploading' | 'generating' | 'polling' | 'completed' | 'error';

export default function ThreeDGenPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('threeDGen');
  const tCommon = useTranslations('common');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<{
    marbleUrl?: string;
    splatUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
  } | null>(null);
  const [selectedModel, setSelectedModel] = useState<'Marble 0.1-mini' | 'Marble 0.1-plus'>('Marble 0.1-mini');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image must be less than 10MB'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setStatus('idle');
    setErrorMessage('');
  };

  const pollOperation = useCallback(async (operationId: string) => {
    setStatus('polling');
    let pollCount = 0;
    const maxPolls = 120; // 10 minutes max (5s interval)

    pollingRef.current = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setStatus('error');
        setErrorMessage('Generation timed out. Please try again.');
        return;
      }

      // Update progress based on model
      const estimatedTotal = selectedModel === 'Marble 0.1-mini' ? 12 : 60; // polls
      const newProgress = Math.min(95, (pollCount / estimatedTotal) * 100);
      setProgress(newProgress);

      if (pollCount % 3 === 0) {
        const messages = [
          'Analyzing image structure...',
          'Reconstructing 3D geometry...',
          'Generating Gaussian splats...',
          'Optimizing scene quality...',
          'Finalizing 3D scene...',
        ];
        setStatusMessage(messages[Math.min(Math.floor(pollCount / 3) - 1, messages.length - 1)]);
      }

      try {
        const response = await fetch(`/api/3d-gen?operationId=${operationId}`);
        const data = await response.json();

        if (data.status === 'completed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setProgress(100);
          setStatus('completed');
          setResult({
            marbleUrl: data.marbleUrl,
            splatUrl: data.splatUrl,
            thumbnailUrl: data.thumbnailUrl,
            caption: data.caption,
          });
        } else if (data.error) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStatus('error');
          setErrorMessage(data.error);
        }
      } catch {
        // Network error, continue polling
      }
    }, 5000);
  }, [selectedModel]);

  const handleGenerate = async () => {
    if (!selectedFile) return;
    setStatus('uploading');
    setProgress(0);
    setErrorMessage('');
    setResult(null);
    setStatusMessage('Uploading image...');

    try {
      // Step 1: Upload image to get a URL
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
      
      if (!uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        throw new Error(uploadData.error || 'Failed to upload image');
      }
      const uploadData = await uploadResponse.json();
      setProgress(10);

      // Step 2: Convert to base64 for World Labs API
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Send full data URL - the API route will handle stripping the prefix
          resolve(result);
        };
        reader.readAsDataURL(selectedFile);
      });

      // Step 3: Start 3D generation
      setStatus('generating');
      setStatusMessage('Starting 3D scene generation...');
      setProgress(15);

      const genResponse = await fetch('/api/3d-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          imageUrl: uploadData.url?.startsWith('data:') ? undefined : uploadData.url,
          model: selectedModel,
        }),
      });

      const genData = await genResponse.json();

      if (!genResponse.ok) {
        throw new Error(genData.error || 'Failed to start 3D generation');
      }

      if (genData.operationId) {
        // Step 4: Poll for completion
        setProgress(20);
        setStatusMessage(`Generating 3D scene (${genData.estimatedTime})...`);
        pollOperation(genData.operationId);
      } else {
        throw new Error('No operation ID returned');
      }
    } catch (err) {
      console.error('3D generation error:', err);
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate 3D scene');
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
          <span className="text-xs font-medium text-amber-800 tracking-wider uppercase">Powered by World Labs AI</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight mb-3">{t('title')}</h1>
        <p className="text-stone-500 max-w-xl mx-auto">{t('subtitle')}</p>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden shadow-sm">
        <div className="p-8">
          {/* Model Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-stone-700 mb-3 block">Generation Quality</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedModel('Marble 0.1-mini')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedModel === 'Marble 0.1-mini'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-stone-900">Quick Preview</span>
                </div>
                <p className="text-xs text-stone-500">~30 seconds • Draft quality</p>
              </button>
              <button
                onClick={() => setSelectedModel('Marble 0.1-plus')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedModel === 'Marble 0.1-plus'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="text-sm font-semibold text-stone-900">High Quality</span>
                </div>
                <p className="text-xs text-stone-500">~5 minutes • Production quality</p>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <h2 className="text-lg font-semibold text-stone-900 mb-2">{t('uploadTitle')}</h2>
          <p className="text-sm text-stone-500 mb-4">{t('uploadDesc')}</p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${previewUrl ? 'border-amber-300 bg-amber-50/30' : 'border-stone-200 hover:border-amber-300 hover:bg-[#faf8f5]'}`}
            onClick={() => status === 'idle' && fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            
            {previewUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <Image src={previewUrl} alt="Selected photo" width={400} height={300} className="rounded-lg max-h-64 object-contain mx-auto" />
                  {status === 'idle' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
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
          {status === 'idle' && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleGenerate}
                disabled={!selectedFile}
                className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                {t('generate')}
              </button>
            </div>
          )}

          {/* Progress */}
          {(status === 'uploading' || status === 'generating' || status === 'polling') && (
            <div className="mt-6 space-y-3">
              <div className="w-full bg-stone-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-stone-600">{statusMessage}</span>
                </div>
                <span className="text-sm font-medium text-amber-700">{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="mt-6 bg-red-50 border border-red-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">Generation Failed</p>
                  <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                  <button
                    onClick={() => { setStatus('idle'); setErrorMessage(''); }}
                    className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Completed Result */}
        {status === 'completed' && result && (
          <div className="border-t border-stone-100 p-8 bg-[#faf8f5]">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="font-semibold text-stone-900">3D Scene Generated Successfully!</h3>
            </div>
            
            {result.caption && (
              <p className="text-sm text-stone-600 mb-4 italic">&ldquo;{result.caption}&rdquo;</p>
            )}

            {result.thumbnailUrl && (
              <div className="mb-4">
                <Image src={result.thumbnailUrl} alt="3D Scene Thumbnail" width={600} height={400} className="rounded-lg border border-stone-200" />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {result.marbleUrl && (
                <a
                  href={result.marbleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-amber-700 rounded-lg hover:bg-amber-800 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  {t('viewScene')}
                </a>
              )}
              {result.splatUrl && (
                <a
                  href={result.splatUrl}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-stone-700 border border-stone-200 rounded-lg hover:bg-stone-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download 3D File
                </a>
              )}
              <button
                onClick={() => { setStatus('idle'); setResult(null); setSelectedFile(null); setPreviewUrl(null); setProgress(0); }}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-stone-500 hover:text-stone-700 transition-all"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6">
          <div className="w-10 h-10 bg-[#f5f0ea] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-sm font-bold text-amber-800">1</span>
          </div>
          <h3 className="text-sm font-semibold text-stone-900 mb-1">{t('step1Title')}</h3>
          <p className="text-xs text-stone-500">{t('step1Desc')}</p>
        </div>
        <div className="text-center p-6">
          <div className="w-10 h-10 bg-[#f5f0ea] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-sm font-bold text-amber-800">2</span>
          </div>
          <h3 className="text-sm font-semibold text-stone-900 mb-1">{t('step2Title')}</h3>
          <p className="text-xs text-stone-500">{t('step2Desc')}</p>
        </div>
        <div className="text-center p-6">
          <div className="w-10 h-10 bg-[#f5f0ea] rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-sm font-bold text-amber-800">3</span>
          </div>
          <h3 className="text-sm font-semibold text-stone-900 mb-1">{t('step3Title')}</h3>
          <p className="text-xs text-stone-500">{t('step3Desc')}</p>
        </div>
      </div>
    </div>
  );
}
