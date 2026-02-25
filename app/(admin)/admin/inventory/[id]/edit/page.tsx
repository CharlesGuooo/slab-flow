'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  AlertCircle,
} from 'lucide-react';

const STONE_TYPES = [
  { value: 'quartz', label: 'Quartz' },
  { value: 'granite', label: 'Granite' },
  { value: 'marble', label: 'Marble' },
  { value: 'quartzite', label: 'Quartzite' },
  { value: 'porcelain', label: 'Porcelain' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: 'Chinese' },
  { code: 'fr', label: 'French' },
];

export default function EditStonePage() {
  const router = useRouter();
  const params = useParams();
  const stoneId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState('en');
  const [tagInput, setTagInput] = useState('');

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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load stone data
  useEffect(() => {
    const fetchStone = async () => {
      try {
        const response = await fetch(`/api/admin/inventory/${stoneId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Stone not found');
          } else {
            setError('Failed to load stone');
          }
          return;
        }

        const data = await response.json();
        const stone = data.stone;

        // Parse name and description if they're strings
        let parsedName = { en: '', zh: '', fr: '' };
        let parsedDescription = { en: '', zh: '', fr: '' };
        let parsedTags: string[] = [];

        if (stone.name) {
          if (typeof stone.name === 'string') {
            try {
              parsedName = JSON.parse(stone.name);
            } catch {
              parsedName = { en: stone.name, zh: '', fr: '' };
            }
          } else {
            parsedName = stone.name;
          }
        }

        if (stone.description) {
          if (typeof stone.description === 'string') {
            try {
              parsedDescription = JSON.parse(stone.description);
            } catch {
              parsedDescription = { en: stone.description, zh: '', fr: '' };
            }
          } else {
            parsedDescription = stone.description;
          }
        }

        if (stone.tags) {
          if (typeof stone.tags === 'string') {
            try {
              parsedTags = JSON.parse(stone.tags);
            } catch {
              parsedTags = [];
            }
          } else if (Array.isArray(stone.tags)) {
            parsedTags = stone.tags;
          }
        }

        setFormData({
          brand: stone.brand || '',
          series: stone.series || '',
          stoneType: stone.stoneType || 'quartz',
          pricePerSlab: stone.pricePerSlab || '',
          imageUrl: stone.imageUrl || '',
          name: parsedName,
          description: parsedDescription,
          tags: parsedTags,
        });
      } catch (err) {
        console.error('Error fetching stone:', err);
        setError('Failed to load stone');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStone();
  }, [stoneId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
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

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/inventory/${stoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update stone');
      }

      router.push('/admin/inventory');
    } catch (err) {
      console.error('Error updating stone:', err);
      alert('Failed to update stone. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
        <Link
          href="/admin/inventory"
          className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Inventory
        </Link>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Edit Stone</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update stone information
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
                  formErrors.brand ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Caesarstone"
              />
              {formErrors.brand && (
                <p className="mt-1 text-sm text-red-500">{formErrors.brand}</p>
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
                  formErrors.series ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Calacatta Nuvo"
              />
              {formErrors.series && (
                <p className="mt-1 text-sm text-red-500">{formErrors.series}</p>
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
                  formErrors.imageUrl ? 'border-red-500' : 'border-gray-300'
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
            {formErrors.imageUrl && (
              <p className="mt-1 text-sm text-red-500">{formErrors.imageUrl}</p>
            )}
            {formData.imageUrl && (
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Multi-language Name */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stone Name (Multi-language)</h2>

          <div className="flex border-b border-gray-200 mb-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeLang === lang.code
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {lang.label}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Description (Multi-language)</h2>

          <div className="flex border-b border-gray-200 mb-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  activeLang === lang.code
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {lang.label}
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
