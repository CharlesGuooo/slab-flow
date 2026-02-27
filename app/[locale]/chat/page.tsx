'use client';

import { useChat } from 'ai/react';
import { useRouter, useParams } from 'next/navigation';
import { useRef, useEffect, useState, useCallback } from 'react';
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

// Session storage keys
const STORAGE_KEYS = {
  messages: 'chat_messages',
  customerSpaceImage: 'chat_customer_space_image',
  generatedImages: 'chat_generated_images',
  messageImages: 'chat_message_images',
};

export default function ChatPage() {
  const localePath = useLocalePath();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('chat');
  const tCommon = useTranslations('common');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [customerSpaceImage, setCustomerSpaceImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stoneMap, setStoneMap] = useState<Record<number, StoneInfo>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generationErrors, setGenerationErrors] = useState<Record<string, string>>({});
  // Track which messages had images attached
  const [messageImages, setMessageImages] = useState<Record<string, string>>({});
  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');
  // Balance state
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceNotice, setBalanceNotice] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track the image that's about to be sent with the next message
  const pendingImageRef = useRef<string | null>(null);
  // Track if we've restored from session
  const restoredRef = useRef(false);

  const {
    messages,
    input,
    setInput,
    setMessages,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    body: { imageUrl: uploadedImage, locale },
    onFinish: () => {
      // Keep customerSpaceImage for future renders, but clear the upload state
      if (uploadedImage) {
        setCustomerSpaceImage(uploadedImage);
      }
      setUploadedImage(null);
      setUploadedImagePreview(null);
    },
  });

  // Restore chat history from sessionStorage on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const savedMessages = sessionStorage.getItem(STORAGE_KEYS.messages);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
      const savedSpaceImage = sessionStorage.getItem(STORAGE_KEYS.customerSpaceImage);
      if (savedSpaceImage) {
        setCustomerSpaceImage(savedSpaceImage);
      }
      const savedGeneratedImages = sessionStorage.getItem(STORAGE_KEYS.generatedImages);
      if (savedGeneratedImages) {
        setGeneratedImages(JSON.parse(savedGeneratedImages));
      }
      const savedMessageImages = sessionStorage.getItem(STORAGE_KEYS.messageImages);
      if (savedMessageImages) {
        setMessageImages(JSON.parse(savedMessageImages));
      }
    } catch (err) {
      console.error('Failed to restore chat history:', err);
    }
  }, [setMessages]);

  // Save chat history to sessionStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        sessionStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
      } catch (err) {
        console.error('Failed to save chat history:', err);
      }
    }
  }, [messages]);

  // Save customerSpaceImage to sessionStorage
  useEffect(() => {
    if (customerSpaceImage) {
      sessionStorage.setItem(STORAGE_KEYS.customerSpaceImage, customerSpaceImage);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.customerSpaceImage);
    }
  }, [customerSpaceImage]);

  // Save generatedImages to sessionStorage
  useEffect(() => {
    if (Object.keys(generatedImages).length > 0) {
      sessionStorage.setItem(STORAGE_KEYS.generatedImages, JSON.stringify(generatedImages));
    }
  }, [generatedImages]);

  // Save messageImages to sessionStorage
  useEffect(() => {
    if (Object.keys(messageImages).length > 0) {
      sessionStorage.setItem(STORAGE_KEYS.messageImages, JSON.stringify(messageImages));
    }
  }, [messageImages]);

  // When a new user message appears, attach the pending image to it
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'user' && pendingImageRef.current && !messageImages[lastMsg.id]) {
        setMessageImages(prev => ({ ...prev, [lastMsg.id]: pendingImageRef.current! }));
        pendingImageRef.current = null;
      }
    }
  }, [messages, messageImages]);

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

  // Deduct credits and show notice
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
        const costLabels: Record<string, string> = {
          'chat_message': locale === 'zh' ? 'AI对话' : locale === 'fr' ? 'Chat IA' : 'AI Chat',
          'image_generation': locale === 'zh' ? 'AI生图' : locale === 'fr' ? 'Génération image' : 'Image Generation',
        };
        const label = costLabels[action] || action;
        const costStr = `$${data.cost.toFixed(2)}`;
        const balStr = `$${data.balance.toFixed(2)}`;
        const notice = locale === 'zh'
          ? `${label} 消耗 ${costStr} | 余额: ${balStr}`
          : locale === 'fr'
          ? `${label} coût ${costStr} | Solde: ${balStr}`
          : `${label} cost ${costStr} | Balance: ${balStr}`;
        setBalanceNotice(notice);
        setTimeout(() => setBalanceNotice(null), 5000);
        return true;
      } else if (res.status === 402) {
        const notice = locale === 'zh'
          ? `余额不足！当前余额: $${data.balance.toFixed(2)}，需要: $${data.required.toFixed(2)}`
          : locale === 'fr'
          ? `Solde insuffisant ! Solde: $${data.balance.toFixed(2)}, requis: $${data.required.toFixed(2)}`
          : `Insufficient balance! Balance: $${data.balance.toFixed(2)}, required: $${data.required.toFixed(2)}`;
        setBalanceNotice(notice);
        setTimeout(() => setBalanceNotice(null), 8000);
        return false;
      }
    } catch (err) {
      console.error('Failed to deduct credits:', err);
    }
    return true; // Allow action even if billing fails
  }, [locale]);

  // Load stone data
  useEffect(() => {
    const loadStones = async () => {
      try {
        const response = await fetch('/api/stones');
        if (response.ok) {
          const data = await response.json();
          const map: Record<number, StoneInfo> = {};
          for (const stone of data.stones || data) {
            map[stone.id] = stone;
          }
          setStoneMap(map);
        }
      } catch (err) {
        console.error('Failed to load stones:', err);
      }
    };
    loadStones();
  }, []);

  // Scroll to bottom of chat container only
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Handle image generation when [RENDER:id] tag is detected
  const handleRenderStone = useCallback(async (stoneId: number, messageId: string) => {
    const renderKey = `${messageId}-${stoneId}`;
    if (generatingImages[renderKey] || generatedImages[renderKey]) return;

    // Deduct credits for image generation
    const allowed = await deductCredits('image_generation');
    if (!allowed) return;

    setGeneratingImages(prev => ({ ...prev, [renderKey]: true }));
    setGenerationErrors(prev => {
      const next = { ...prev };
      delete next[renderKey];
      return next;
    });

    try {
      const stone = stoneMap[stoneId];
      if (!stone) throw new Error('Stone not found');

      // Call the improved generate-image API with both images
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stoneImageUrl: stone.imageUrl,
          stoneName: stone.name,
          stoneBrand: `${stone.brand} ${stone.series}`,
          spaceImageBase64: customerSpaceImage || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');

      setGeneratedImages(prev => ({ ...prev, [renderKey]: data.imageUrl }));
    } catch (err) {
      console.error('Image generation error:', err);
      setGenerationErrors(prev => ({
        ...prev,
        [renderKey]: err instanceof Error ? err.message : 'Failed to generate image',
      }));
    } finally {
      setGeneratingImages(prev => ({ ...prev, [renderKey]: false }));
    }
  }, [customerSpaceImage, stoneMap, generatingImages, generatedImages, deductCredits]);

  // Auto-trigger renders when new messages contain [RENDER:id]
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      const renderRegex = /\[RENDER:(\d+)\]/g;
      let match;
      while ((match = renderRegex.exec(message.content)) !== null) {
        const stoneId = parseInt(match[1], 10);
        const renderKey = `${message.id}-${stoneId}`;
        if (!generatingImages[renderKey] && !generatedImages[renderKey] && !generationErrors[renderKey]) {
          handleRenderStone(stoneId, message.id);
        }
      }
    }
  }, [messages, handleRenderStone, generatingImages, generatedImages, generationErrors]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image must be less than 10MB'); return; }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload image');
      setUploadedImage(data.url);
    } catch (err) {
      console.error('Upload error:', err);
      alert(err instanceof Error ? err.message : 'Failed to upload image');
      setUploadedImagePreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !uploadedImage) return;

    // Deduct credits for chat message
    await deductCredits('chat_message');

    // Save the current preview image to attach to the message
    if (uploadedImagePreview) {
      pendingImageRef.current = uploadedImagePreview;
    }
    originalHandleSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || uploadedImage) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  // Open lightbox
  const openLightbox = (imageUrl: string, title: string) => {
    setLightboxImage(imageUrl);
    setLightboxTitle(title);
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxImage(null);
    setLightboxTitle('');
  };

  // Download image
  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse message content for [STONE:id] and [RENDER:id] tags
  const renderMessageContent = (content: string, messageId: string) => {
    const parts: React.ReactNode[] = [];
    // Match both [STONE:id] and [RENDER:id]
    const regex = /\[(?:STONE|RENDER):(\d+)\]/g;
    let lastIndex = 0;
    let match;
    const renderedStones = new Set<number>();

    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const stoneId = parseInt(match[1], 10);
      const isRender = fullMatch.startsWith('[RENDER:');

      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      const stone = stoneMap[stoneId];

      if (stone && !isRender) {
        // Only show stone card once per stone per message
        if (!renderedStones.has(stoneId)) {
          renderedStones.add(stoneId);
          parts.push(
            <div key={`stone-${stoneId}-${match.index}`} className="my-3 bg-white rounded-lg border border-stone-200 overflow-hidden inline-block max-w-[280px] align-top shadow-sm">
              <div className="relative w-[280px] h-[180px] cursor-pointer" onClick={() => openLightbox(stone.imageUrl, stone.name)}>
                <Image
                  src={stone.imageUrl}
                  alt={stone.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                  <p className="text-[9px] text-white/70">
                    {locale === 'zh' ? '图片仅供参考，请以实物为准。' : locale === 'fr' ? 'Images à titre indicatif uniquement.' : 'Images are for reference only. Please refer to the actual product.'}
                  </p>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-stone-900">{stone.name}</p>
                <p className="text-xs text-stone-500">{stone.brand} - {stone.series}</p>
                <p className="text-xs text-amber-700 font-medium mt-1">${stone.price}/{locale === 'zh' ? '块' : locale === 'fr' ? 'dalle' : 'slab'}</p>
              </div>
            </div>
          );
        }
      } else if (isRender) {
        // Show render result or loading state
        const renderKey = `${messageId}-${stoneId}`;
        const isGenerating = generatingImages[renderKey];
        const generatedUrl = generatedImages[renderKey];
        const genError = generationErrors[renderKey];

        if (generatedUrl) {
          parts.push(
            <div key={`render-${renderKey}`} className="my-3 rounded-lg overflow-hidden border border-amber-200 shadow-md max-w-[500px]">
              <div className="bg-amber-50 px-3 py-1.5 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-amber-800">
                  {locale === 'zh' ? 'AI效果图' : locale === 'fr' ? 'Visualisation IA' : 'AI Visualization'} - {stone?.name || `Stone #${stoneId}`}
                </span>
              </div>
              <div 
                className="cursor-pointer relative group"
                onClick={() => openLightbox(generatedUrl, `AI Visualization - ${stone?.name || `Stone #${stoneId}`}`)}
              >
                <img src={generatedUrl} alt={`Rendered ${stone?.name || 'stone'} in space`} className="w-full" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                    <svg className="w-6 h-6 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-3 py-2 bg-amber-50 flex items-center justify-between">
                <p className="text-[9px] text-amber-600">
                  {locale === 'zh' ? 'AI生成预览，实际效果可能有所不同。' : locale === 'fr' ? 'Aperçu généré par IA. L\'apparence réelle peut varier.' : 'AI-generated preview. Actual appearance may vary.'}
                </p>
                <button
                  onClick={() => downloadImage(generatedUrl, `${stone?.name || 'stone'}-visualization.png`)}
                  className="flex items-center gap-1 text-[10px] text-amber-700 hover:text-amber-900 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {locale === 'zh' ? '保存' : locale === 'fr' ? 'Enregistrer' : 'Save'}
                </button>
              </div>
            </div>
          );
        } else if (isGenerating) {
          parts.push(
            <div key={`render-loading-${renderKey}`} className="my-3 rounded-lg border border-amber-200 p-6 max-w-[400px] bg-amber-50/50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-stone-800">
                    {locale === 'zh' ? '正在生成效果图...' : locale === 'fr' ? 'Génération en cours...' : 'Generating visualization...'}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    {locale === 'zh' ? `正在渲染 ${stone?.name || '石材'} (~15秒)` : `Rendering ${stone?.name || 'stone'} in your space (~15s)`}
                  </p>
                </div>
              </div>
            </div>
          );
        } else if (genError) {
          parts.push(
            <div key={`render-error-${renderKey}`} className="my-3 rounded-lg border border-red-200 p-4 max-w-[400px] bg-red-50">
              <p className="text-sm text-red-700">
                {locale === 'zh' ? `无法生成效果图: ${genError}` : `Could not generate visualization: ${genError}`}
              </p>
              <button
                onClick={() => handleRenderStone(stoneId, messageId)}
                className="mt-2 text-xs text-amber-700 underline hover:text-amber-900"
              >
                {locale === 'zh' ? '重试' : locale === 'fr' ? 'Réessayer' : 'Try again'}
              </button>
            </div>
          );
        }
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.slice(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  const suggestedQuestions = [
    t('suggestion1'),
    t('suggestion2'),
    t('suggestion3'),
    t('suggestion4'),
  ];

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
            <Link href={`/${locale}/login?redirect=/${locale}/chat`}
              className="px-6 py-3 text-sm font-medium text-white bg-stone-900 rounded-md hover:bg-stone-800 transition-all">
              {tCommon('signInNow')}
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
    <div className="max-w-4xl mx-auto px-4" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-stone-100 transition-colors"
            >
              <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image */}
            <img 
              src={lightboxImage} 
              alt={lightboxTitle} 
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
            />
            
            {/* Bottom bar with title and download */}
            <div className="mt-3 flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5">
              <span className="text-sm text-white font-medium">{lightboxTitle}</span>
              <button
                onClick={() => downloadImage(lightboxImage!, `${lightboxTitle.replace(/\s+/g, '-')}.png`)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md text-sm text-stone-800 hover:bg-stone-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {locale === 'zh' ? '下载' : locale === 'fr' ? 'Télécharger' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <Link href={localePath('/browse')}
          className="inline-flex items-center text-sm text-stone-400 hover:text-stone-600 transition-colors">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('backToBrowse')}
        </Link>
        <div className="flex items-center gap-4">
          {/* Balance display */}
          {balance !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-amber-800">${balance.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-amber-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-semibold tracking-wide">{t('title')}</span>
          </div>
        </div>
      </div>

      {/* Balance notice toast */}
      {balanceNotice && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right">
          <div className="bg-white border border-amber-200 shadow-lg rounded-lg px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Chat Container */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm flex flex-col" style={{ height: 'calc(100% - 52px)' }}>
        {/* Messages Area */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-[#f5f0ea] rounded-full flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">{t('welcome')}</h2>
              <p className="text-sm text-stone-500 mb-4 max-w-md leading-relaxed">{t('welcomeMessage')}</p>
              
              {/* Cost info */}
              <div className="mb-6 px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
                {locale === 'zh' ? '💡 每条消息消耗 $0.02 | AI生图消耗 $0.15' : locale === 'fr' ? '💡 Chaque message coûte $0.02 | Génération image $0.15' : '💡 Each message costs $0.02 | Image generation $0.15'}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-left px-4 py-3 bg-[#faf8f5] hover:bg-[#f5f0ea] border border-stone-100 rounded-lg text-sm text-stone-700 transition-all group"
                  >
                    <span className="text-amber-700 mr-2 group-hover:mr-3 transition-all">&rarr;</span>
                    {question}
                  </button>
                ))}
              </div>

              {/* Upload hint */}
              <div className="mt-8 flex items-center gap-2 text-xs text-stone-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{t('tipUpload')}</span>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-[#f5f0ea] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-stone-900 text-white'
                      : 'bg-[#faf8f5] text-stone-800 border border-stone-100'
                  }`}>
                    {/* Show attached image in user messages */}
                    {message.role === 'user' && messageImages[message.id] && (
                      <div className="mb-2">
                        <img 
                          src={messageImages[message.id]} 
                          alt="Uploaded photo" 
                          className="w-[200px] h-[130px] object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openLightbox(messageImages[message.id], locale === 'zh' ? '上传的照片' : 'Uploaded Photo')}
                        />
                      </div>
                    )}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.role === 'assistant'
                        ? renderMessageContent(message.content, message.id)
                        : message.content
                      }
                    </div>
                    <p className={`text-[10px] mt-1.5 ${message.role === 'user' ? 'text-stone-400' : 'text-stone-400'}`}>
                      {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-[#f5f0ea] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="bg-[#faf8f5] border border-stone-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-stone-500">{t('aiThinking')}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
                  {error.message}
                </div>
              )}
            </>
          )}
        </div>

        {/* Customer space image indicator */}
        {customerSpaceImage && !uploadedImagePreview && (
          <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs text-green-700">
              {locale === 'zh' ? '空间照片已保存，可用于AI效果图生成' : locale === 'fr' ? 'Photo d\'espace sauvegardée pour la visualisation IA' : 'Space photo saved for AI visualization'}
            </span>
            <button onClick={() => setCustomerSpaceImage(null)} className="ml-auto text-xs text-green-500 hover:text-red-500">
              {locale === 'zh' ? '清除' : locale === 'fr' ? 'Effacer' : 'Clear'}
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-stone-100 p-4 bg-white rounded-b-xl">
          {uploadedImagePreview && (
            <div className="mb-3 relative inline-block">
              <img src={uploadedImagePreview} alt="Preview" className="w-[120px] h-[80px] object-cover rounded-lg border border-stone-200" />
              {isUploading && (
                <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
              {!isUploading && uploadedImage && (
                <div className="absolute bottom-1 left-1 bg-green-500 rounded-full p-0.5">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <button type="button" onClick={() => { setUploadedImage(null); setUploadedImagePreview(null); }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isLoading}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-all"
              title={t('uploadImage')}>
              {isUploading ? (
                <svg className="w-4 h-4 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              rows={1}
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-300 focus:border-amber-300 resize-none text-sm text-stone-900 placeholder:text-stone-400 bg-[#faf8f5]"
              disabled={isLoading}
            />

            <button type="submit" disabled={(!input.trim() && !uploadedImage) || isLoading}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          
          <p className="text-[10px] text-stone-400 mt-2 text-center">{t('tipUpload')}</p>
        </div>
      </div>
    </div>
  );
}
