'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  Languages,
  Sparkles,
} from 'lucide-react';

const STONE_TYPES = [
  { value: 'quartz', label: 'Quartz' },
  { value: 'granite', label: 'Granite' },
  { value: 'marble', label: 'Marble' },
  { value: 'quartzite', label: 'Quartzite' },
  { value: 'porcelain', label: 'Porcelain' },
  { value: 'sintered stone', label: 'Sintered Stone' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
];

export default function NewStonePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const [tagInput, setTagInput] = useState('');
  const [isTranslatingName, setIsTranslatingName] = useState(false);
  const [isTranslatingDesc, setIsTranslatingDesc] = useState(false);
  const [translateSuccess, setTranslateSuccess] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    brand: '',
    series: '',
    stoneType: 'quartz',
    pricePerSlab: '',
    imageUrl: '',
    name: { en: '', zh: '', fr: '' },
    description: { en: '', zh: '', fr: '' },
    tags: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleNameChange = (lang: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: { ...prev.name, [lang]: value },
    }));
  };

  const handleDescriptionChange = (lang: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      description: { ...prev.description, [lang]: value },
    }));
  };

  // AI Auto-translate function
  const handleAutoTranslate = useCallback(async (field: 'name' | 'description') => {
    const currentText = formData[field][activeLang as keyof typeof formData.name];
    if (!currentText.trim()) {
      alert(`Please enter the ${field} in ${LANGUAGES.find(l => l.code === activeLang)?.label} first.`);
      return;
    }

    if (field === 'name') setIsTranslatingName(true);
    else setIsTranslatingDesc(true);

    try {
      const response = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentText,
          field: field,
          sourceLang: activeLang,
        }),
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      const translations = data.translations;

      if (translations) {
        setFormData((prev) => ({
          ...prev,
          [field]: {
            ...prev[field],
            ...translations,
          },
        }));
        setTranslateSuccess(prev => ({ ...prev, [field]: true }));
        setTimeout(() => setTranslateSuccess(prev => ({ ...prev, [field]: false })), 3000);
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('Auto-translation failed. Please try again or enter translations manually.');
    } finally {
      if (field === 'name') setIsTranslatingName(false);
      else setIsTranslatingDesc(false);
    }
  }, [formData, activeLang]);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }
    if (!formData.series.trim()) {
      newErrors.series = 'Series is required';
    }
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create stone');
      }

      router.push('/admin/inventory');
    } catch (error) {
      console.error('Error creating stone:', error);
      alert('Failed to create stone. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasTextInCurrentLang = (field: 'name' | 'description') => {
    return formData[field][activeLang as keyof typeof formData.name]?.trim().length > 0;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Stone</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new stone to your inventory. Use AI to auto-translate names and descriptions.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.brand ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Caesarstone"
              />
              {errors.brand && (
                <p className="mt-1 text-sm text-red-500">{errors.brand}</p>
              )}
            </div>

            {/* Series */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Series <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="series"
                value={formData.series}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.series ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Calacatta Nuvo"
              />
              {errors.series && (
                <p className="mt-1 text-sm text-red-500">{errors.series}</p>
              )}
            </div>

            {/* Stone Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stone Type
              </label>
              <select
                name="stoneType"
                value={formData.stoneType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {STONE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price per Slab ($)
              </label>
              <input
                type="number"
                name="pricePerSlab"
                value={formData.pricePerSlab}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Image URL */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.imageUrl ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                onClick={() => {
                  alert('File upload requires R2 configuration. Please enter URL directly.');
                }}
              >
                <Upload className="h-4 w-4" />
              </button>
            </div>
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-500">{errors.imageUrl}</p>
            )}
            {formData.imageUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Multi-language Name */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Languages className="h-5 w-5 text-blue-500" />
              Stone Name (Multi-language)
            </h2>
            <button
              type="button"
              onClick={() => handleAutoTranslate('name')}
              disabled={isTranslatingName || !hasTextInCurrentLang('name')}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                translateSuccess.name
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isTranslatingName ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Translating...
                </>
              ) : translateSuccess.name ? (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Translated!
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  AI Auto-Translate
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Enter the name in any language, then click &quot;AI Auto-Translate&quot; to fill in the other languages automatically.
          </p>

          {/* Language tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 ${
                  activeLang === lang.code
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span>{lang.flag}</span>
                {lang.label}
                {formData.name[lang.code as keyof typeof formData.name] && (
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                )}
              </button>
            ))}
          </div>

          {LANGUAGES.map((lang) => (
            <div key={lang.code} className={activeLang === lang.code ? 'block' : 'hidden'}>
              <input
                type="text"
                value={formData.name[lang.code as keyof typeof formData.name]}
                onChange={(e) => handleNameChange(lang.code, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Stone name in ${lang.label}`}
              />
            </div>
          ))}
        </div>

        {/* Multi-language Description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Languages className="h-5 w-5 text-blue-500" />
              Description (Multi-language)
            </h2>
            <button
              type="button"
              onClick={() => handleAutoTranslate('description')}
              disabled={isTranslatingDesc || !hasTextInCurrentLang('description')}
              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                translateSuccess.description
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isTranslatingDesc ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Translating...
                </>
              ) : translateSuccess.description ? (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Translated!
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  AI Auto-Translate
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Enter the description in any language, then click &quot;AI Auto-Translate&quot; to fill in the other languages automatically.
          </p>

          {/* Language tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5 ${
                  activeLang === lang.code
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <span>{lang.flag}</span>
                {lang.label}
                {formData.description[lang.code as keyof typeof formData.description] && (
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                )}
              </button>
            ))}
          </div>

          {LANGUAGES.map((lang) => (
            <div key={lang.code} className={activeLang === lang.code ? 'block' : 'hidden'}>
              <textarea
                value={formData.description[lang.code as keyof typeof formData.description]}
                onChange={(e) => handleDescriptionChange(lang.code, e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Description in ${lang.label}`}
              />
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Add
            </button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/inventory"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Stone
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
