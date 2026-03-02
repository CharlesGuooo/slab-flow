'use client';

import { useEffect, useState } from 'react';
import {
  Calculator,
  Plus,
  Loader2,
  AlertCircle,
  Save,
  Trash2,
  Edit,
  X,
  Settings,
  RotateCcw,
} from 'lucide-react';

interface CalculationItem {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: string;
  sortOrder: number;
}

interface CalcEntry {
  itemId: number;
  quantity: string;
}

const UNIT_OPTIONS = [
  { value: 'per_sqft', label: 'Per Sq Ft', inputLabel: 'sq ft' },
  { value: 'per_unit', label: 'Per Unit', inputLabel: 'units' },
  { value: 'per_hour', label: 'Per Hour', inputLabel: 'hours' },
];

type TabMode = 'calculator' | 'settings';

export default function CalculatorPage() {
  const [items, setItems] = useState<CalculationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>('calculator');

  // Calculator state
  const [calcEntries, setCalcEntries] = useState<CalcEntry[]>([]);

  // Settings state
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'per_sqft',
    pricePerUnit: '0.00',
    sortOrder: 0,
  });

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/admin/calculator-settings');
      if (!response.ok) throw new Error('Failed to fetch calculator settings');
      const data = await response.json();
      const fetchedItems = data.items || [];
      setItems(fetchedItems);
      // Initialize calculator entries
      setCalcEntries(fetchedItems.map((item: CalculationItem) => ({ itemId: item.id, quantity: '' })));
    } catch (err) {
      console.error('Error fetching calculator settings:', err);
      setError('Failed to load calculator settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Calculator functions
  const updateQuantity = (itemId: number, quantity: string) => {
    setCalcEntries(prev => prev.map(e => e.itemId === itemId ? { ...e, quantity } : e));
  };

  const getItemTotal = (item: CalculationItem) => {
    const entry = calcEntries.find(e => e.itemId === item.id);
    const qty = parseFloat(entry?.quantity || '0');
    if (isNaN(qty) || qty <= 0) return 0;
    return qty * parseFloat(item.pricePerUnit);
  };

  const grandTotal = items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const resetCalculator = () => {
    setCalcEntries(items.map(item => ({ itemId: item.id, quantity: '' })));
  };

  // Settings functions
  const resetForm = () => {
    setFormData({ name: '', unit: 'per_sqft', pricePerUnit: '0.00', sortOrder: items.length + 1 });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddNew = () => {
    setFormData({ name: '', unit: 'per_sqft', pricePerUnit: '0.00', sortOrder: items.length + 1 });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (item: CalculationItem) => {
    setFormData({ name: item.name, unit: item.unit, pricePerUnit: item.pricePerUnit, sortOrder: item.sortOrder });
    setEditingId(item.id);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { alert('Name is required'); return; }
    setIsSaving(true);
    try {
      if (editingId) {
        const response = await fetch(`/api/admin/calculator-settings/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to update item');
      } else {
        const response = await fetch('/api/admin/calculator-settings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to create item');
      }
      await fetchItems();
      resetForm();
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`/api/admin/calculator-settings/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  };

  const getUnitLabel = (unit: string) => UNIT_OPTIONS.find(u => u.value === unit)?.label || unit;
  const getUnitInputLabel = (unit: string) => UNIT_OPTIONS.find(u => u.value === unit)?.inputLabel || unit;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-700 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-4 border border-red-100">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Fabrication Calculator</h1>
          <p className="mt-1 text-sm text-stone-500">
            Calculate fabrication costs and manage pricing items
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-stone-100 rounded-xl p-1 flex max-w-xs">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'calculator' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Calculator className="h-4 w-4" />
          Calculator
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'settings' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          <Settings className="h-4 w-4" />
          Pricing
        </button>
      </div>

      {/* ==================== CALCULATOR TAB ==================== */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          {items.length > 0 ? (
            <>
              <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-stone-900">Enter Quantities</h2>
                  <button
                    onClick={resetCalculator}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
                <div className="divide-y divide-stone-50">
                  {items.map((item) => {
                    const entry = calcEntries.find(e => e.itemId === item.id);
                    const itemTotal = getItemTotal(item);
                    return (
                      <div key={item.id} className="px-6 py-4 flex items-center gap-4 hover:bg-stone-50/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900">{item.name}</p>
                          <p className="text-xs text-stone-400">
                            ${parseFloat(item.pricePerUnit).toFixed(2)} / {getUnitInputLabel(item.unit)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={entry?.quantity || ''}
                              onChange={(e) => updateQuantity(item.id, e.target.value)}
                              placeholder="0"
                              className="w-28 px-3 py-2 text-sm text-right border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-300 focus:border-amber-300 transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 pointer-events-none">
                              {getUnitInputLabel(item.unit)}
                            </span>
                          </div>
                          <div className="w-28 text-right">
                            <span className={`text-sm font-medium ${itemTotal > 0 ? 'text-stone-900' : 'text-stone-300'}`}>
                              ${itemTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-stone-900 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-400 uppercase tracking-wide font-medium">Estimated Total</p>
                    <p className="text-xs text-stone-500 mt-1">
                      This is an estimate only. Final price may vary based on on-site measurements.
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-amber-400">
                    ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-stone-100">
              <Calculator className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No pricing items configured</h3>
              <p className="mt-1 text-sm text-stone-400">
                Switch to the Pricing tab to add fabrication items first
              </p>
              <button
                onClick={() => setActiveTab('settings')}
                className="mt-4 inline-flex items-center px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Pricing
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== SETTINGS TAB ==================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Add button */}
          {!isAdding && !editingId && (
            <div className="flex justify-end">
              <button
                onClick={handleAddNew}
                className="inline-flex items-center px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          )}

          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <div className="bg-white rounded-xl border border-stone-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-stone-900">
                  {editingId ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button onClick={resetForm} className="text-stone-400 hover:text-stone-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-300 focus:border-amber-300"
                    placeholder="e.g., Straight Cut"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-300 focus:border-amber-300"
                  >
                    {UNIT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1.5">Price (CAD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:ring-1 focus:ring-amber-300 focus:border-amber-300"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />Save</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Items list */}
          {items.length > 0 ? (
            <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-stone-50/50">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Price (CAD)</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-stone-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-stone-500">{getUnitLabel(item.unit)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-stone-900">${parseFloat(item.pricePerUnit).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(item)}
                          className="inline-flex items-center p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors mr-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex items-center p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-stone-100">
              <Calculator className="mx-auto h-12 w-12 text-stone-300" />
              <h3 className="mt-3 text-sm font-medium text-stone-700">No calculator items</h3>
              <p className="mt-1 text-sm text-stone-400">Add pricing items to enable the calculator</p>
              <button
                onClick={handleAddNew}
                className="mt-4 inline-flex items-center px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
