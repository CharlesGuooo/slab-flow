'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocalePath } from '@/lib/hooks/useLocalePath';
import {
  Calculator,
  ArrowLeft,
  Loader2,
  Ruler,
  DollarSign,
  Package,
  Info,
} from 'lucide-react';

interface CalculationItem {
  id: number;
  name: string;
  nameZh: string | null;
  unit: string;
  pricePerUnit: string;
  description: string | null;
}

interface Stone {
  id: number;
  brand: string;
  series: string;
  stoneType: string;
  pricePerSlab: string;
  imageUrl: string;
  name: string | null;
}

export default function CalculatorPage() {
  const localePath = useLocalePath();
  const [isLoading, setIsLoading] = useState(true);
  const [stones, setStones] = useState<Stone[]>([]);
  const [calculationItems, setCalculationItems] = useState<CalculationItem[]>([]);

  const [selectedStoneId, setSelectedStoneId] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [edgeProfile, setEdgeProfile] = useState('standard');
  const [sinkCutouts, setSinkCutouts] = useState('0');
  const [hasBacksplash, setHasBacksplash] = useState(false);

  const [result, setResult] = useState<{
    slabCost: number;
    edgeCost: number;
    cutoutCost: number;
    backsplashCost: number;
    total: number;
    squareFeet: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stonesRes, itemsRes] = await Promise.all([
          fetch('/api/client/stones'),
          fetch('/api/calculator/items'),
        ]);

        if (stonesRes.ok) {
          const data = await stonesRes.json();
          setStones(data.stones || []);
        }

        if (itemsRes.ok) {
          const data = await itemsRes.json();
          setCalculationItems(data.items || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
    const nameObj = stone.name as { en?: string; zh?: string };
    return nameObj.en || nameObj.zh || `${stone.brand} - ${stone.series}`;
  };

  const getCalcItemPrice = (name: string): number => {
    const item = calculationItems.find(i =>
      i.name.toLowerCase().includes(name.toLowerCase()) ||
      i.nameZh?.includes(name)
    );
    return item ? parseFloat(item.pricePerUnit) : 0;
  };

  const calculatePrice = () => {
    if (!selectedStoneId || !length || !width) {
      alert('Please select a stone and enter dimensions');
      return;
    }

    const stone = stones.find(s => s.id === parseInt(selectedStoneId));
    if (!stone) return;

    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);
    const sinkNum = parseInt(sinkCutouts);

    // Calculate square feet (convert inches to feet)
    const squareFeet = (lengthNum * widthNum) / 144;

    // Slab cost (assume 50 sq ft per slab, round up)
    const slabsNeeded = Math.max(1, Math.ceil(squareFeet / 50));
    const slabCost = slabsNeeded * parseFloat(stone.pricePerSlab);

    // Edge profile cost (per linear foot)
    const linearFeet = ((lengthNum + widthNum) * 2) / 12;
    const edgePricePerFoot = edgeProfile === 'fancy'
      ? getCalcItemPrice('fancy edge') || 35
      : getCalcItemPrice('standard edge') || 20;
    const edgeCost = linearFeet * edgePricePerFoot;

    // Sink cutouts
    const cutoutPrice = getCalcItemPrice('sink cutout') || 150;
    const cutoutCost = sinkNum * cutoutPrice;

    // Backsplash (if selected)
    const backsplashPrice = getCalcItemPrice('backsplash') || 25;
    const backsplashCost = hasBacksplash
      ? (lengthNum / 12) * 4 * backsplashPrice // 4" standard height
      : 0;

    const total = slabCost + edgeCost + cutoutCost + backsplashCost;

    setResult({
      slabCost,
      edgeCost,
      cutoutCost,
      backsplashCost,
      total,
      squareFeet,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link
        href={localePath('/browse')}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Browse
      </Link>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Price Calculator</h1>
        <p className="text-gray-600">
          Estimate the cost of your stone countertop project
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-400" />
            Project Details
          </h2>

          <div className="space-y-4">
            {/* Stone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Stone <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStoneId}
                onChange={(e) => setSelectedStoneId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a stone...</option>
                {stones.map((stone) => (
                  <option key={stone.id} value={stone.id}>
                    {getStoneName(stone)} - ${stone.pricePerSlab}/slab
                  </option>
                ))}
              </select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Length (inches) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="120"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (inches) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="25"
                  min="1"
                />
              </div>
            </div>

            {/* Edge Profile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edge Profile
              </label>
              <select
                value={edgeProfile}
                onChange={(e) => setEdgeProfile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="standard">Standard Edge (Eased)</option>
                <option value="fancy">Fancy Edge (Ogee, Bullnose, etc.)</option>
              </select>
            </div>

            {/* Sink Cutouts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Sink Cutouts
              </label>
              <select
                value={sinkCutouts}
                onChange={(e) => setSinkCutouts(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            {/* Backsplash */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBacksplash}
                  onChange={(e) => setHasBacksplash(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Include 4&quot; backsplash
                </span>
              </label>
            </div>

            {/* Calculate Button */}
            <button
              onClick={calculatePrice}
              className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Calculator className="h-5 w-5 mr-2" />
              Calculate Price
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-start gap-2">
            <Info className="h-4 w-4 text-gray-400 mt-0.5" />
            <p className="text-xs text-gray-500">
              This is an estimate only. Final pricing depends on actual measurements,
              template requirements, and installation complexity.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-400" />
            Estimate
          </h2>

          {result ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Estimate</p>
                <p className="text-3xl font-bold text-blue-700">
                  ${result.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {result.squareFeet.toFixed(1)} sq ft
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Stone Slabs</span>
                  <span className="font-medium">${result.slabCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Edge Profile</span>
                  <span className="font-medium">${result.edgeCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {result.cutoutCost > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Sink Cutouts</span>
                    <span className="font-medium">${result.cutoutCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {result.backsplashCost > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Backsplash</span>
                    <span className="font-medium">${result.backsplashCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <Link
                  href={selectedStoneId ? localePath(`/account/new-quote?stoneId=${selectedStoneId}`) : localePath('/account/new-quote')}
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Request a Quote
                </Link>
                <Link
                  href={localePath('/chat')}
                  className="w-full inline-flex items-center justify-center px-6 py-3 text-base font-medium border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Chat with AI Assistant
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Ruler className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                Fill in your project details and click Calculate to see your estimate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
