'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type GenerationStatus = 'idle' | 'uploading' | 'generating' | 'polling' | 'completed' | 'error';

interface AIRender {
  imageUrl: string;
  stoneName: string;
  stoneId: number;
  createdAt: string;
}

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
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceNotice, setBalanceNotice] = useState<string | null>(null);
  // AI renders from chat
  const [aiRenders, setAiRenders] = useState<AIRender[]>([]);
  const [selectedRender, setSelectedRender] = useState<AIRender | null>(null);
  const [showUploadOption, setShowUploadOption] = useState(false);
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

  // Load AI renders from sessionStorage
  useEffect(() => {
    try {
      const savedRenders = sessionStorage.getItem('chat_ai_renders_for_3d');
      if (savedRenders) {
        const parsed = JSON.parse(savedRenders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiRenders(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load AI renders:', err);
    }
  }, []);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/client/balance');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    }
  }, [isAuthenticated, fetchBalance]);

  // Deduct credits
  const deductCredits = useCallback(async (action: string) => {
    try {
      const res = await fetch('/api/client/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        const costStr = `$${data.cost.toFixed(2)}`;
        const balStr = `$${data.balance.toFixed(2)}`;
        const label = action === '3d_quick'
          ? (locale === 'zh' ? '3D快速预览' : locale === 'fr' ? '3D aperçu rapide' : '3D Quick Preview')
          : (locale === 'zh' ? '3D高质量生成' : locale === 'fr' ? '3D haute qualité' : '3D High Quality');
        const notice = locale === 'zh'
          ? `${label} 消耗 ${costStr} | 余额: ${balStr}`
          : locale === 'fr'
          ? `${label} coût ${costStr} | Solde: ${balStr}`
          : `${label} cost ${costStr} | Balance: ${balStr}`;
        setBalanceNotice(notice);
        setTimeout(() => setBalanceNotice(null), 6000);
        return true;
      } else if (res.status === 402) {
        const notice = locale === 'zh'
          ? '余额不足！请联系商家充值后继续使用。'
          : locale === 'fr'
          ? 'Solde insuffisant ! Contactez le fournisseur pour recharger.'
          : 'Insufficient balance! Please contact the supplier to top up.';
        setBalanceNotice(notice);
        setTimeout(() => setBalanceNotice(null), 8000);
        return false;
      }
    } catch (err) {
      console.error('Failed to deduct credits:', err);
    }
    return true;
  }, [locale]);

  const isBalanceZero = balance !== null && balance <= 0;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert(locale === 'zh' ? '请选择图片文件' : 'Please select an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert(locale === 'zh' ? '图片不能超过10MB' : 'Image must be less than 10MB'); return; }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setSelectedRender(null);
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
    setSelectedRender(null);
    setResult(null);
    setStatus('idle');
    setErrorMessage('');
  };

  // Select an AI render for 3D generation
  const handleSelectRender = (render: AIRender) => {
    setSelectedRender(render);
    setPreviewUrl(render.imageUrl);
    setSelectedFile(null); // Clear file selection since we're using a render
    setShowUploadOption(false);
    setResult(null);
    setStatus('idle');
    setErrorMessage('');
  };

  const pollOperation = useCallback(async (operationId: string) => {
    setStatus('polling');
    let pollCount = 0;
    const maxPolls = 120;

    pollingRef.current = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setStatus('error');
        setErrorMessage(locale === 'zh' ? '生成超时，请重试。' : 'Generation timed out. Please try again.');
        return;
      }

      const estimatedTotal = selectedModel === 'Marble 0.1-mini' ? 12 : 60;
      const newProgress = Math.min(95, (pollCount / estimatedTotal) * 100);
      setProgress(newProgress);

      if (pollCount % 3 === 0) {
        const messages = locale === 'zh'
          ? ['分析图片结构...', '重建3D几何体...', '生成高斯点云...', '优化场景质量...', '最终处理中...']
          : ['Analyzing image structure...', 'Reconstructing 3D geometry...', 'Generating Gaussian splats...', 'Optimizing scene quality...', 'Finalizing 3D scene...'];
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
          fetchBalance();
        } else if (data.error) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setStatus('error');
          setErrorMessage(data.error);
        }
      } catch {
        // Network error, continue polling
      }
    }, 5000);
  }, [selectedModel, locale, fetchBalance]);

  const handleGenerate = async () => {
    // Need either a file or a selected render
    if (!selectedFile && !selectedRender) return;

    // Check balance
    if (isBalanceZero) {
      setBalanceNotice(locale === 'zh'
        ? '余额不足！请联系商家充值。'
        : 'Insufficient balance! Please contact the supplier.');
      setTimeout(() => setBalanceNotice(null), 8000);
      return;
    }

    // Deduct credits first
    const action = selectedModel === 'Marble 0.1-mini' ? '3d_quick' : '3d_high';
    const allowed = await deductCredits(action);
    if (!allowed) return;

    setStatus('uploading');
    setProgress(0);
    setErrorMessage('');
    setResult(null);
    setStatusMessage(locale === 'zh' ? '准备图片中...' : 'Preparing image...');

    try {
      let imageBase64: string;
      let uploadedUrl: string | undefined;

      if (selectedRender) {
        // Use the AI render image - it's already a data URL or a URL
        if (selectedRender.imageUrl.startsWith('data:')) {
          imageBase64 = selectedRender.imageUrl;
        } else {
          // Fetch the image and convert to base64
          const response = await fetch(selectedRender.imageUrl);
          const blob = await response.blob();
          imageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        }
      } else if (selectedFile) {
        // Upload the file first
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
        
        if (!uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          throw new Error(uploadData.error || 'Failed to upload image');
        }
        const uploadData = await uploadResponse.json();
        uploadedUrl = uploadData.url?.startsWith('data:') ? undefined : uploadData.url;

        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      } else {
        throw new Error('No image selected');
      }

      setProgress(10);
      setStatus('generating');
      setStatusMessage(locale === 'zh' ? '启动3D场景生成...' : 'Starting 3D scene generation...');
      setProgress(15);

      const genResponse = await fetch('/api/3d-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          imageUrl: uploadedUrl,
          model: selectedModel,
        }),
      });

      const genData = await genResponse.json();

      if (!genResponse.ok) {
        throw new Error(genData.error || 'Failed to start 3D generation');
      }

      if (genData.operationId) {
        setProgress(20);
        setStatusMessage(locale === 'zh'
          ? `生成3D场景中 (${genData.estimatedTime})...`
          : `Generating 3D scene (${genData.estimatedTime})...`);
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
      {/* Balance notice toast */}
      {balanceNotice && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`border shadow-lg rounded-lg px-4 py-3 flex items-center gap-2 ${
            balanceNotice.includes('不足') || balanceNotice.includes('Insufficient')
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-amber-200'
          }`}>
            <svg className={`w-4 h-4 flex-shrink-0 ${
              balanceNotice.includes('不足') || balanceNotice.includes('Insufficient')
                ? 'text-red-600'
                : 'text-amber-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-stone-700">{balanceNotice}</span>
            <button onClick={() => setBalanceNotice(null)} className="ml-2 text-stone-400 hover:text-stone-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full mb-4">
          <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          <span className="text-xs font-medium text-amber-800 tracking-wider uppercase">Powered by World Labs AI</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight mb-3">{t('title')}</h1>
        <p className="text-stone-500 max-w-xl mx-auto">{t('subtitle')}</p>
        
        {/* Balance display */}
        {balance !== null && (
          <div className={`mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 border rounded-full ${
            isBalanceZero ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
          }`}>
            <svg className={`w-3.5 h-3.5 ${isBalanceZero ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`text-xs font-medium ${isBalanceZero ? 'text-red-800' : 'text-amber-800'}`}>
              {locale === 'zh' ? '余额' : locale === 'fr' ? 'Solde' : 'Balance'}: ${balance.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Zero balance warning */}
      {isBalanceZero && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm text-red-700">
            {locale === 'zh'
              ? '您的余额已用完。请联系商家充值后继续使用3D场景功能。'
              : locale === 'fr'
              ? 'Votre solde est épuisé. Contactez le fournisseur pour recharger.'
              : 'Your balance is depleted. Please contact the supplier to top up your credits.'}
          </span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white border border-stone-100 rounded-xl overflow-hidden shadow-sm">
        <div className="p-8">
          {/* AI Renders from Chat - Primary Selection */}
          {aiRenders.length > 0 && !previewUrl && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-stone-900 mb-2">
                {locale === 'zh' ? '选择AI效果图' : locale === 'fr' ? 'Sélectionnez une visualisation IA' : 'Select an AI Visualization'}
              </h2>
              <p className="text-sm text-stone-500 mb-4">
                {locale === 'zh'
                  ? '这些是您在AI助手中生成的效果图，选择一张来体验3D沉浸式场景。'
                  : locale === 'fr'
                  ? 'Voici les visualisations générées dans l\'assistant IA. Sélectionnez-en une pour l\'expérience 3D immersive.'
                  : 'These are visualizations generated in the AI Assistant. Select one to experience an immersive 3D scene.'}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {aiRenders.map((render, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectRender(render)}
                    disabled={isBalanceZero}
                    className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                      selectedRender?.imageUrl === render.imageUrl
                        ? 'border-amber-500 ring-2 ring-amber-200'
                        : 'border-stone-200 hover:border-amber-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <img
                      src={render.imageUrl}
                      alt={render.stoneName}
                      className="w-full h-[140px] object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white font-medium truncate">{render.stoneName}</p>
                    </div>
                    {selectedRender?.imageUrl === render.imageUrl && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Option to upload own photo */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowUploadOption(true)}
                  className="text-xs text-stone-400 hover:text-amber-700 transition-colors underline"
                >
                  {locale === 'zh' ? '或者上传自己的照片' : locale === 'fr' ? 'Ou téléchargez votre propre photo' : 'Or upload your own photo'}
                </button>
              </div>
            </div>
          )}

          {/* Model Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-stone-700 mb-3 block">
              {locale === 'zh' ? '体验模式' : locale === 'fr' ? 'Mode d\'expérience' : 'Experience Mode'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedModel('Marble 0.1-mini')}
                disabled={isBalanceZero}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedModel === 'Marble 0.1-mini'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-stone-100 hover:border-stone-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-semibold text-stone-900">
                    {locale === 'zh' ? '快速体验' : locale === 'fr' ? 'Aperçu rapide' : 'Quick Preview'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {locale === 'zh' ? '~30秒 • 快速预览效果' : '~30 seconds • Quick preview'}
                </p>
              </button>
              <button
                onClick={() => setSelectedModel('Marble 0.1-plus')}
                disabled={isBalanceZero}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedModel === 'Marble 0.1-plus'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-stone-100 hover:border-stone-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="text-sm font-semibold text-stone-900">
                    {locale === 'zh' ? '高清体验' : locale === 'fr' ? 'Haute qualité' : 'HD Experience'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {locale === 'zh' ? '~5分钟 • 沉浸式高清场景' : '~5 minutes • Immersive HD scene'}
                </p>
              </button>
            </div>
          </div>

          {/* Upload Area - shown when no AI renders, or when user opts to upload */}
          {(aiRenders.length === 0 || showUploadOption || previewUrl) && (
            <>
              {!selectedRender && (
                <>
                  <h2 className="text-lg font-semibold text-stone-900 mb-2">
                    {aiRenders.length > 0
                      ? (locale === 'zh' ? '上传您的照片' : locale === 'fr' ? 'Téléchargez votre photo' : 'Upload Your Photo')
                      : t('uploadTitle')}
                  </h2>
                  <p className="text-sm text-stone-500 mb-4">{t('uploadDesc')}</p>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                      ${previewUrl ? 'border-amber-300 bg-amber-50/30' : 'border-stone-200 hover:border-amber-300 hover:bg-[#faf8f5]'}`}
                    onClick={() => status === 'idle' && fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    
                    {previewUrl && !selectedRender ? (
                      <div className="space-y-4">
                        <div className="relative inline-block">
                          <Image src={previewUrl} alt="Selected photo" width={400} height={300} className="rounded-lg max-h-64 object-contain mx-auto" unoptimized />
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
                </>
              )}

              {/* Selected render preview */}
              {selectedRender && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-stone-900">
                      {locale === 'zh' ? '已选择效果图' : locale === 'fr' ? 'Visualisation sélectionnée' : 'Selected Visualization'}
                    </h2>
                    <button
                      onClick={() => { setSelectedRender(null); setPreviewUrl(null); }}
                      className="text-xs text-stone-400 hover:text-stone-600 underline"
                    >
                      {locale === 'zh' ? '重新选择' : locale === 'fr' ? 'Resélectionner' : 'Change Selection'}
                    </button>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-amber-200">
                    <img src={selectedRender.imageUrl} alt={selectedRender.stoneName} className="w-full max-h-[300px] object-contain bg-stone-50" />
                    <div className="px-3 py-2 bg-amber-50 flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium text-amber-800">{selectedRender.stoneName}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Generate Button */}
          {status === 'idle' && (selectedFile || selectedRender) && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={isBalanceZero}
                className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
                {locale === 'zh' ? '生成3D沉浸式场景' : locale === 'fr' ? 'Générer la scène 3D immersive' : 'Generate Immersive 3D Scene'}
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
                  <p className="text-sm font-medium text-red-800">
                    {locale === 'zh' ? '生成失败' : locale === 'fr' ? 'Échec de la génération' : 'Generation Failed'}
                  </p>
                  <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                  <button
                    onClick={() => { setStatus('idle'); setErrorMessage(''); }}
                    className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline"
                  >
                    {locale === 'zh' ? '重试' : locale === 'fr' ? 'Réessayer' : 'Try Again'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Completed Result */}
        {status === 'completed' && result && (
          <div className="border-t border-stone-100 p-8 bg-[#faf8f5]">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="font-semibold text-stone-900">
                {locale === 'zh' ? '3D场景生成成功！' : locale === 'fr' ? 'Scène 3D générée avec succès !' : '3D Scene Generated Successfully!'}
              </h3>
            </div>

            {/* Balance after generation */}
            {balance !== null && (
              <p className="text-xs text-amber-700 mb-4">
                {locale === 'zh' ? `当前余额: $${balance.toFixed(2)}` : locale === 'fr' ? `Solde actuel: $${balance.toFixed(2)}` : `Current balance: $${balance.toFixed(2)}`}
              </p>
            )}
            
            {result.caption && (
              <p className="text-sm text-stone-600 mb-4 italic">&ldquo;{result.caption}&rdquo;</p>
            )}

            {result.thumbnailUrl && (
              <div className="mb-4">
                <Image src={result.thumbnailUrl} alt="3D Scene Thumbnail" width={600} height={400} className="rounded-lg border border-stone-200" unoptimized />
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
                  {locale === 'zh' ? '下载3D文件' : locale === 'fr' ? 'Télécharger fichier 3D' : 'Download 3D File'}
                </a>
              )}
              <button
                onClick={() => { setStatus('idle'); setResult(null); setSelectedFile(null); setPreviewUrl(null); setSelectedRender(null); setProgress(0); }}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-stone-500 hover:text-stone-700 transition-all"
              >
                {locale === 'zh' ? '再次生成' : locale === 'fr' ? 'Générer un autre' : 'Generate Another'}
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
