'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Package,
  Sparkles,
  Upload,
  X,
  Camera,
} from 'lucide-react';

interface Stone {
  id: number;
  brand: string;
  series: string;
  stoneType: string;
  pricePerSlab: string;
  imageUrl: string;
  name: { en?: string; zh?: string } | string;
}

interface UploadedPhoto {
  url: string;
  name: string;
}

const DESIRED_DATE_OPTIONS = [
  { value: 'ASAP', label: 'As Soon As Possible' },
  { value: 'within_2_weeks', label: 'Within 2 Weeks' },
  { value: 'within_a_month', label: 'Within a Month' },
  { value: 'not_in_a_hurry', label: 'Not in a Hurry' },
];

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStoneId = searchParams.get('stoneId');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stones, setStones] = useState<Stone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newOrderId, setNewOrderId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    stoneId: '',
    stoneSelectionText: '',
    desiredDate: '',
    isContractor: false,
    totalBudget: '',
    notes: '',
    useAIRecommendation: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStones = async () => {
      try {
        const response = await fetch('/api/client/stones');
        if (response.ok) {
          const data = await response.json();
          setStones(data.stones || []);

          // Pre-select stone if provided in URL
          if (preselectedStoneId) {
            setFormData((prev) => ({
              ...prev,
              stoneId: preselectedStoneId,
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching stones:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStones();
  }, [preselectedStoneId]);

  const getStoneName = (stone: Stone): string => {
    if (!stone.name) return `${stone.brand} - ${stone.series}`;
    if (typeof stone.name === 'string') {
      try {
        const parsed = JSON.parse(stone.name);
        return parsed.en || parsed.zh || stone.name;
      } catch {
        return stone.name;
      }
    }
    return stone.name.en || stone.name.zh || `${stone.brand} - ${stone.series}`;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const formDataObj = new FormData();
        formDataObj.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataObj,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to upload');
        }

        setPhotos((prev) => [...prev, { url: data.url, name: file.name }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.useAIRecommendation && !formData.stoneId) {
      newErrors.stoneId = 'Please select a stone or choose AI recommendation';
    }

    if (formData.useAIRecommendation && !formData.stoneSelectionText.trim()) {
      newErrors.stoneSelectionText = 'Please describe what you\'re looking for';
    }

    if (!formData.desiredDate) {
      newErrors.desiredDate = 'Please select your desired timeline';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stoneId: formData.useAIRecommendation ? null : parseInt(formData.stoneId),
          stoneSelectionText: formData.useAIRecommendation ? formData.stoneSelectionText : null,
          desiredDate: formData.desiredDate,
          isContractor: formData.isContractor,
          totalBudget: formData.totalBudget || null,
          notes: formData.notes || null,
          photos: photos.map(p => p.url),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quote request');
      }

      setNewOrderId(data.order.id);
      setIsSuccess(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit quote request');
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

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Quote Request Submitted!
          </h1>
          <p className="text-gray-600 mb-6">
            Your request #{newOrderId} has been received. We&apos;ll get back to you with a quote soon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              View My Orders
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/account"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Account
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Request a Quote</h1>
      <p className="text-gray-600 mb-8">
        Fill out the form below and we&apos;ll get back to you with a personalized quote.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stone Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-400" />
            Stone Selection
          </h2>

          {/* AI Recommendation toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="useAIRecommendation"
                checked={formData.useAIRecommendation}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Not sure? Let AI recommend a stone
              </span>
            </label>
          </div>

          {formData.useAIRecommendation ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe what you&apos;re looking for
              </label>
              <textarea
                name="stoneSelectionText"
                value={formData.stoneSelectionText}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.stoneSelectionText ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., White marble with gray veins for kitchen island..."
              />
              {errors.stoneSelectionText && (
                <p className="mt-1 text-sm text-red-500">{errors.stoneSelectionText}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select a Stone
              </label>
              <select
                name="stoneId"
                value={formData.stoneId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.stoneId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Choose a stone...</option>
                {stones.map((stone) => (
                  <option key={stone.id} value={stone.id}>
                    {getStoneName(stone)} - {stone.brand} ({stone.stoneType})
                  </option>
                ))}
              </select>
              {errors.stoneId && (
                <p className="mt-1 text-sm text-red-500">{errors.stoneId}</p>
              )}
            </div>
          )}
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-5 w-5 text-gray-400" />
            Project Photos (optional)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload photos of your space to help us provide a more accurate quote.
          </p>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={photo.url}
                    alt={photo.name}
                    width={150}
                    height={100}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors disabled:opacity-50"
          >
            {isUploadingPhoto ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-gray-500">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-500">
                  Click to upload photos (kitchen, bathroom, measurements)
                </span>
                <span className="text-xs text-gray-400">JPG, PNG, WebP up to 10MB each</span>
              </div>
            )}
          </button>
        </div>

        {/* Project Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desired Timeline <span className="text-red-500">*</span>
              </label>
              <select
                name="desiredDate"
                value={formData.desiredDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.desiredDate ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">When do you need this?</option>
                {DESIRED_DATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.desiredDate && (
                <p className="mt-1 text-sm text-red-500">{errors.desiredDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget (optional)
              </label>
              <input
                type="number"
                name="totalBudget"
                value={formData.totalBudget}
                onChange={handleChange}
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your budget in USD"
              />
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isContractor"
                  checked={formData.isContractor}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  I am a contractor/designer
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any specific requirements, measurements, or questions..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Quote Request'
          )}
        </button>
      </form>
    </div>
  );
}
