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
} from 'lucide-react';

interface CalculationItem {
  id: number;
  name: string;
  unit: string;
  pricePerUnit: string;
  sortOrder: number;
}

const UNIT_OPTIONS = [
  { value: 'per_sqft', label: 'Per Sq Ft' },
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'per_hour', label: 'Per Hour' },
];

const DEFAULT_ITEMS = [
  { name: 'Straight Cut', unit: 'per_sqft', pricePerUnit: '25.00', sortOrder: 1 },
  { name: '45-Degree Cut', unit: 'per_sqft', pricePerUnit: '35.00', sortOrder: 2 },
  { name: 'Waterfall Edge', unit: 'per_unit', pricePerUnit: '200.00', sortOrder: 3 },
  { name: 'Backsplash', unit: 'per_sqft', pricePerUnit: '30.00', sortOrder: 4 },
  { name: 'Sink Cutout', unit: 'per_unit', pricePerUnit: '100.00', sortOrder: 5 },
  { name: 'Faucet Hole', unit: 'per_unit', pricePerUnit: '25.00', sortOrder: 6 },
  { name: 'Installation', unit: 'per_hour', pricePerUnit: '75.00', sortOrder: 7 },
];

export default function CalculatorSettingsPage() {
  const [items, setItems] = useState<CalculationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (!response.ok) {
        throw new Error('Failed to fetch calculator settings');
      }
      const data = await response.json();
      setItems(data.items || []);
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

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'per_sqft',
      pricePerUnit: '0.00',
      sortOrder: items.length + 1,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddNew = () => {
    setFormData({
      name: '',
      unit: 'per_sqft',
      pricePerUnit: '0.00',
      sortOrder: items.length + 1,
    });
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (item: CalculationItem) => {
    setFormData({
      name: item.name,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      sortOrder: item.sortOrder,
    });
    setEditingId(item.id);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        // Update existing
        const response = await fetch(`/api/admin/calculator-settings/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Failed to update item');
      } else {
        // Create new
        const response = await fetch('/api/admin/calculator-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
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
      const response = await fetch(`/api/admin/calculator-settings/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete item');

      await fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  };

  const getUnitLabel = (unit: string) => {
    return UNIT_OPTIONS.find(u => u.value === unit)?.label || unit;
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
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="ml-3 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculator Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure pricing items for quote calculations
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={handleAddNew}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Straight Cut"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getUnitLabel(item.unit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${parseFloat(item.pricePerUnit).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.sortOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleEdit(item)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center text-red-600 hover:text-red-700"
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
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calculator className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No calculator items</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add pricing items to enable quote calculations
          </p>
          <button
            onClick={handleAddNew}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Item
          </button>
        </div>
      )}
    </div>
  );
}
