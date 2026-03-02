'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Coins,
  Plus,
  Minus,
  Check,
  X,
} from 'lucide-react';

interface Customer {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  aiCredits: string;
  createdAt: string;
  orderCount: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCredits, setEditCredits] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEditCredits = (customer: Customer) => {
    setEditingId(customer.id);
    setEditCredits(parseFloat(customer.aiCredits || '0').toFixed(2));
  };

  const handleSaveCredits = async (customerId: number) => {
    setSavingId(customerId);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiCredits: editCredits }),
      });
      if (!response.ok) throw new Error('Failed to update credits');
      
      // Update local state
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, aiCredits: editCredits } : c
      ));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating credits:', err);
      alert('Failed to update AI credits');
    } finally {
      setSavingId(null);
    }
  };

  const handleQuickAdd = async (customerId: number, currentCredits: string, amount: number) => {
    setSavingId(customerId);
    const newCredits = (parseFloat(currentCredits || '0') + amount).toFixed(2);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiCredits: newCredits }),
      });
      if (!response.ok) throw new Error('Failed to update credits');
      
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, aiCredits: newCredits } : c
      ));
    } catch (err) {
      console.error('Error updating credits:', err);
      alert('Failed to update AI credits');
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

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
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Customers</h1>
        <p className="mt-1 text-sm text-stone-500">
          View and manage your customer accounts and AI credits
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-amber-300 focus:border-amber-300 transition-all"
        />
      </div>

      {/* Customers table */}
      {filteredCustomers.length > 0 ? (
        <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-stone-50/50">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">AI Credits</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-sm font-medium text-amber-700 hover:text-amber-800"
                      >
                        {customer.username}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-stone-600 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-stone-400" />
                          {customer.email}
                        </span>
                        {customer.phone && (
                          <span className="text-sm text-stone-400 flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-stone-400" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === customer.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-stone-500">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editCredits}
                            onChange={(e) => setEditCredits(e.target.value)}
                            className="w-24 px-2 py-1 text-sm border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveCredits(customer.id)}
                            disabled={savingId === customer.id}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            {savingId === customer.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-stone-400 hover:bg-stone-100 rounded-md transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickAdd(customer.id, customer.aiCredits, -1)}
                            disabled={savingId === customer.id || parseFloat(customer.aiCredits || '0') <= 0}
                            className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30"
                            title="Remove $1"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditCredits(customer)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                            title="Click to edit"
                          >
                            <Coins className="h-3.5 w-3.5 text-amber-500" />
                            ${parseFloat(customer.aiCredits || '0').toFixed(2)}
                          </button>
                          <button
                            onClick={() => handleQuickAdd(customer.id, customer.aiCredits, 5)}
                            disabled={savingId === customer.id}
                            className="p-1 text-stone-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-30"
                            title="Add $5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          {savingId === customer.id && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-600">
                      {customer.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(customer.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-100">
          <Users className="mx-auto h-12 w-12 text-stone-300" />
          <h3 className="mt-3 text-sm font-medium text-stone-700">No customers found</h3>
          <p className="mt-1 text-sm text-stone-400">
            {searchTerm ? 'Try adjusting your search' : 'Customers will appear here when they register'}
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-stone-400">
        Total: {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
