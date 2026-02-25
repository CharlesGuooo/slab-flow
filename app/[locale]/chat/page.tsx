'use client';

import { useChat } from 'ai/react';
import { useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Upload,
  X,
  ImageIcon,
} from 'lucide-react';

interface StoneRecommendation {
  stoneId: number;
  stoneName: string;
  reason: string;
}

interface RenderedImage {
  imageUrl: string;
  stoneName: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [renderedImages, setRenderedImages] = useState<RenderedImage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use Vercel AI SDK's useChat hook
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    append,
  } = useChat({
    api: '/api/chat',
    body: {
      imageUrl: uploadedImage,
    },
    onFinish: (message) => {
      // Check if message contains a rendered image
      const renderMatch = message.content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
      if (renderMatch) {
        setRenderedImages(prev => [...prev, {
          imageUrl: renderMatch[1],
          stoneName: 'Rendered Stone',
        }]);
      }
      // Clear uploaded image after sending
      setUploadedImage(null);
    },
  });

  useEffect(() => {
    // Check if user is authenticated
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

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setUploadedImage(data.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || uploadedImage) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const handleStartQuote = (stoneId: number) => {
    if (isAuthenticated) {
      router.push(`/account/new-quote?stoneId=${stoneId}`);
    } else {
      router.push(`/login?redirect=/account/new-quote&stoneId=${stoneId}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const suggestedQuestions = [
    'What stone is best for kitchen countertops?',
    'I need a white marble with gray veins',
    'Show me budget-friendly options for bathroom vanity',
    'What is the difference between quartz and granite?',
  ];

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/browse"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Browse
        </Link>
        <div className="flex items-center gap-2 text-purple-600">
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">AI Stone Assistant</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Hello! I&apos;m your AI Stone Assistant
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                I can help you find the perfect stone for your project. Tell me about your
                needs, style preferences, or budget, and I&apos;ll recommend the best options.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(question)}
                    className="text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {/* Show uploaded image for user message */}
                    {message.role === 'user' && uploadedImage && message === messages[messages.length - 1] && (
                      <div className="mb-2">
                        <Image
                          src={uploadedImage}
                          alt="Uploaded image"
                          width={300}
                          height={200}
                          className="rounded-lg max-w-full"
                        />
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}

              {/* Show rendered images inline */}
              {renderedImages.length > 0 && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2">AI Generated Rendering:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {renderedImages.map((img, idx) => (
                        <div key={idx} className="relative">
                          <Image
                            src={img.imageUrl}
                            alt={img.stoneName}
                            width={400}
                            height={300}
                            className="rounded-lg"
                          />
                          <a
                            href={img.imageUrl}
                            download
                            className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs text-gray-700 hover:bg-white"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-center text-red-500 text-sm p-2 bg-red-50 rounded">
                  Error: {error.message}
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          {/* Image preview */}
          {uploadedImage && (
            <div className="mb-3 relative inline-block">
              <Image
                src={uploadedImage}
                alt="Preview"
                width={150}
                height={100}
                className="rounded-lg"
              />
              <button
                type="button"
                onClick={() => setUploadedImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2">
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              title="Upload image"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              ) : (
                <Upload className="h-5 w-5 text-gray-500" />
              )}
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedImage ? "Describe what you'd like to know about this image..." : "Ask me about stone options..."}
              rows={1}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={(!input.trim() && !uploadedImage) || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">
            Tip: Upload a photo of your kitchen or bathroom for personalized recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
