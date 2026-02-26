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
  const [isUploading, setIsUploading] = useState(false);
  const [stoneMap, setStoneMap] = useState<Record<number, StoneInfo>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    setInput,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    body: { imageUrl: uploadedImage, locale },
    onFinish: () => {
      setUploadedImage(null);
      setUploadedImagePreview(null);
    },
  });

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

  // Load stone data for displaying photos
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

  // Scroll to bottom of chat container (not page)
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('Image must be less than 10MB'); return; }
    
    // Show preview immediately
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !uploadedImage) return;
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

  // Parse [STONE:id] tags in message content and render stone cards
  const renderMessageContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[STONE:(\d+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.slice(lastIndex, match.index)}
          </span>
        );
      }

      const stoneId = parseInt(match[1], 10);
      const stone = stoneMap[stoneId];

      if (stone) {
        parts.push(
          <div key={`stone-${stoneId}-${match.index}`} className="my-3 bg-white rounded-lg border border-stone-200 overflow-hidden inline-block max-w-[280px] align-top">
            <div className="relative w-[280px] h-[180px]">
              <Image
                src={stone.imageUrl}
                alt={stone.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-stone-900">{stone.name}</p>
              <p className="text-xs text-stone-500">{stone.brand} - {stone.series}</p>
              <p className="text-xs text-amber-700 font-medium mt-1">${stone.price}/slab</p>
            </div>
          </div>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
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
      {/* Header */}
      <div className="flex items-center justify-between py-3">
        <Link href={localePath('/browse')}
          className="inline-flex items-center text-sm text-stone-400 hover:text-stone-600 transition-colors">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('backToBrowse')}
        </Link>
        <div className="flex items-center gap-2 text-amber-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-semibold tracking-wide">{t('title')}</span>
        </div>
      </div>

      {/* Chat Container - fixed height, internal scroll */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm flex flex-col" style={{ height: 'calc(100% - 52px)' }}>
        {/* Messages Area - scrolls internally */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-[#f5f0ea] rounded-full flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-2">{t('welcome')}</h2>
              <p className="text-sm text-stone-500 mb-8 max-w-md leading-relaxed">{t('welcomeMessage')}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-left px-4 py-3 bg-[#faf8f5] hover:bg-[#f5f0ea] border border-stone-100 rounded-lg text-sm text-stone-700 transition-all hover:border-amber-200 group"
                  >
                    <span className="text-amber-700 mr-2 group-hover:mr-3 transition-all">&rarr;</span>
                    {question}
                  </button>
                ))}
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
                  <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-stone-900 text-white'
                      : 'bg-[#faf8f5] text-stone-800 border border-stone-100'
                  }`}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.role === 'assistant'
                        ? renderMessageContent(message.content)
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

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">
                  {error.message}
                </div>
              )}
            </>
          )}
        </div>

        {/* Input Area - fixed at bottom of chat container */}
        <div className="border-t border-stone-100 p-4 bg-white rounded-b-xl">
          {/* Image preview */}
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
